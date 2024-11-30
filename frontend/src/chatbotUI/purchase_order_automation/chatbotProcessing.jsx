import React, { useState, useEffect } from 'react';
import { usePurchaseOrder } from './purchaseOrderContext';
import AddProductsForm from './addProductForm';
import StockReviewForm from './stockReviewForm';
import PurchaseOrderPreview from './purchaseOrderPreview';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import { AlertCircle, Package, ArrowRight, Save, Check } from "lucide-react";
import { Steps } from "../../ui/steps";
import { useToast } from "../../ui/use-toast";
import instance from '../../axiosConfig';

const PROCESSING_STAGES = {
  INITIAL_REVIEW: 'initial_review',
  ADDING_PRODUCTS: 'adding_products',
  REVIEWING_STOCK: 'reviewing_stock',
  FINAL_REVIEW: 'final_review',
  PROCESSING: 'processing',
  COMPLETED: 'completed'
};

const ChatbotProcessing = ({ 
  analysisResult, 
  onProcessingComplete,
  onProcessingCancel
}) => {
  const { state, dispatch } = usePurchaseOrder();
  const [currentStage, setCurrentStage] = useState(PROCESSING_STAGES.INITIAL_REVIEW);
  const [processingData, setProcessingData] = useState(analysisResult);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Initialize processing state when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      setProcessingData(analysisResult);
      
      // Determine initial stage based on analysis
      if (analysisResult.groupedItems.newProducts.length > 0) {
        setCurrentStage(PROCESSING_STAGES.ADDING_PRODUCTS);
      } else if (analysisResult.groupedItems.insufficientStock.length > 0) {
        setCurrentStage(PROCESSING_STAGES.REVIEWING_STOCK);
      } else {
        setCurrentStage(PROCESSING_STAGES.FINAL_REVIEW);
      }
    }
  }, [analysisResult]);

  // Handle new products being added
  const handleProductsAdded = async (newProducts) => {
    setIsProcessing(true);
    try {
      // Add products to inventory
      const response = await instance.post('/inventory/batch', { products: newProducts });
      
      // Update processing data with new products
      setProcessingData(prev => ({
        ...prev,
        groupedItems: {
          ...prev.groupedItems,
          readyToProcess: [...prev.groupedItems.readyToProcess, ...response.data.products],
          newProducts: []
        }
      }));

      toast({
        title: "Products Added Successfully",
        description: `Added ${newProducts.length} new products to inventory.`
      });

      // Move to next stage
      if (processingData.groupedItems.insufficientStock.length > 0) {
        setCurrentStage(PROCESSING_STAGES.REVIEWING_STOCK);
      } else {
        setCurrentStage(PROCESSING_STAGES.FINAL_REVIEW);
      }
    } catch (error) {
      toast({
        title: "Error Adding Products",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle stock level updates
  const handleStockUpdate = async (updates) => {
    setIsProcessing(true);
    try {
      // Update stock levels
      await instance.post('/inventory/batch-update', { updates });

      // Update processing data
      setProcessingData(prev => ({
        ...prev,
        groupedItems: {
          ...prev.groupedItems,
          readyToProcess: [...prev.groupedItems.readyToProcess, ...updates],
          insufficientStock: []
        }
      }));

      toast({
        title: "Stock Levels Updated",
        description: "Inventory levels have been successfully updated."
      });

      setCurrentStage(PROCESSING_STAGES.FINAL_REVIEW);
    } catch (error) {
      toast({
        title: "Error Updating Stock",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle final purchase order processing
  const handleProcessOrder = async () => {
    setIsProcessing(true);
    try {
      // Prepare purchase order data
      const orderData = {
        items: processingData.groupedItems.readyToProcess,
        metadata: processingData.metadata,
        financials: processingData.financials
      };

      // Create purchase order
      const response = await instance.post('/purchase/create', orderData);

      toast({
        title: "Purchase Order Created",
        description: `Purchase order #${response.data.purchaseOrderId} has been created successfully.`
      });

      setCurrentStage(PROCESSING_STAGES.COMPLETED);
      onProcessingComplete(response.data);
    } catch (error) {
      toast({
        title: "Error Creating Purchase Order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render progress steps
  const renderProgressSteps = () => {
    const steps = [
      { label: 'Document Analysis', status: 'completed' },
      { 
        label: 'Add New Products', 
        status: getStepStatus(PROCESSING_STAGES.ADDING_PRODUCTS),
        hidden: !processingData?.groupedItems?.newProducts?.length
      },
      {
        label: 'Review Stock',
        status: getStepStatus(PROCESSING_STAGES.REVIEWING_STOCK),
        hidden: !processingData?.groupedItems?.insufficientStock?.length
      },
      { 
        label: 'Final Review',
        status: getStepStatus(PROCESSING_STAGES.FINAL_REVIEW)
      }
    ].filter(step => !step.hidden);

    return (
      <Steps
        steps={steps}
        currentStep={steps.findIndex(step => step.status === 'current')}
      />
    );
  };

  // Get status for progress step
  const getStepStatus = (stage) => {
    if (currentStage === stage) return 'current';
    if (
      (stage === PROCESSING_STAGES.ADDING_PRODUCTS && currentStage === PROCESSING_STAGES.REVIEWING_STOCK) ||
      (stage === PROCESSING_STAGES.REVIEWING_STOCK && currentStage === PROCESSING_STAGES.FINAL_REVIEW) ||
      currentStage === PROCESSING_STAGES.COMPLETED
    ) {
      return 'completed';
    }
    return 'pending';
  };

  // Render current stage content
  const renderStageContent = () => {
    switch (currentStage) {
      case PROCESSING_STAGES.ADDING_PRODUCTS:
        return (
          <AddProductsForm
            newProducts={processingData.groupedItems.newProducts}
            onProductsAdded={handleProductsAdded}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        );

      case PROCESSING_STAGES.REVIEWING_STOCK:
        return (
          <StockReviewForm
            insufficientStock={processingData.groupedItems.insufficientStock}
            onStockUpdate={handleStockUpdate}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        );

      case PROCESSING_STAGES.FINAL_REVIEW:
        return (
          <PurchaseOrderPreview
            items={processingData.groupedItems.readyToProcess}
            metadata={processingData.metadata}
            financials={processingData.financials}
            onConfirm={handleProcessOrder}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        );

      case PROCESSING_STAGES.COMPLETED:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Processing Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The purchase order has been successfully processed.</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderProgressSteps()}
      {renderStageContent()}
    </div>
  );
};

export default ChatbotProcessing;