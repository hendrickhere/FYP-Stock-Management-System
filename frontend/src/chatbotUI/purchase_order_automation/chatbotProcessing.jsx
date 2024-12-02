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
  const [errors, setErrors] = useState([]);

  // Initialize processing state when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      setProcessingData(analysisResult);
      
      // Determine initial stage based on analysis
      if (analysisResult.groupedItems.newProducts.length > 0) {
        setCurrentStage(PROCESSING_STAGES.ADDING_PRODUCTS);
        dispatch({ 
          type: 'SET_PROCESSING_STAGE', 
          payload: PROCESSING_STAGES.ADDING_PRODUCTS 
        });
      } else if (analysisResult.groupedItems.insufficientStock.length > 0) {
        setCurrentStage(PROCESSING_STAGES.REVIEWING_STOCK);
        dispatch({ 
          type: 'SET_PROCESSING_STAGE', 
          payload: PROCESSING_STAGES.REVIEWING_STOCK 
        });
      } else {
        setCurrentStage(PROCESSING_STAGES.FINAL_REVIEW);
        dispatch({ 
          type: 'SET_PROCESSING_STAGE', 
          payload: PROCESSING_STAGES.FINAL_REVIEW 
        });
      }
    }
  }, [analysisResult, dispatch]);

  const handleProcessingError = (error) => {
    // Log the error for debugging
    console.error('Processing error:', error);

    // Update the error state
    setErrors(prev => [...prev, {
      id: Date.now(),
      message: error.message,
      type: error.code || 'PROCESSING_ERROR'
    }]);

    // Show error toast to user
    toast({
      title: "Processing Error",
      description: error.message,
      variant: "destructive",
      duration: 5000
    });

    // If the error is critical, cancel processing
    if (error.code === 'CRITICAL_ERROR') {
      onProcessingCancel();
    }
  };

  // Add support function for specific error types
  const isRecoverableError = (error) => {
    const recoverableErrors = [
      'NETWORK_ERROR',
      'VALIDATION_ERROR',
      'STOCK_UPDATE_ERROR'
    ];
    return recoverableErrors.includes(error.code);
  };

  // Handle new products being added
  const handleProductsAdded = async (newProducts) => {
    setIsProcessing(true);
    try {
      // Add products to inventory
      const response = await instance.post('/user/inventory/batch', { products: newProducts });
      
      // Transform the created products to match the expected format
      const transformedProducts = response.data.products.map(product => ({
        productName: product.product_name,
        sku: product.sku_number,
        quantity: parseInt(product.product_stock),
        price: parseFloat(product.price),
        // Preserve original data for other operations if needed
        originalData: product
      }));

      // Update processing data with transformed products
      setProcessingData(prev => ({
        ...prev,
        groupedItems: {
          ...prev.groupedItems,
          readyToProcess: [...prev.groupedItems.readyToProcess, ...transformedProducts],
          newProducts: []
        }
      }));

      toast({
        title: "Products Added Successfully",
        description: `Added ${newProducts.length} new products to inventory.`
      });

      // Move to next stage with the correctly formatted data
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

const processPurchaseOrder = async (analysisResult) => {
  // Update UI state to show processing
  updateProgressWithMessage('documentAnalysis', 'Analyzing purchase order details...');

  try {
    // Get the processed items and analysis
    const { groupedItems, financials, warnings } = analysisResult;

    // Process inventory status for each item
    await handleInventoryChecks(groupedItems);

    // Update progress
    updateProgressWithMessage('stockValidation', 'Validating stock levels...');

    // Generate appropriate UI components based on analysis
    if (groupedItems.newProducts.length > 0) {
      return renderNewProductsFlow(groupedItems.newProducts);
    } else if (groupedItems.insufficientStock.length > 0) {
      return renderStockUpdateFlow(groupedItems.insufficientStock);
    } else {
      return renderOrderReviewFlow(groupedItems.readyToProcess);
    }

  } catch (error) {
    handleProcessingError(error);
  }
};

const renderNewProductsFlow = (newProducts) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">New Products to Add</h3>
      <AddProductsForm
        products={newProducts}
        onSubmit={handleProductsAdded}
        onCancel={onProcessingCancel}
        isProcessing={isProcessing}
      />
    </div>
  );
};

const renderStockUpdateFlow = (insufficientStock) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Stock Level Updates Required</h3>
      <StockReviewForm
        products={insufficientStock}
        onSubmit={handleStockUpdate}
        onCancel={onProcessingCancel}
        isProcessing={isProcessing}
      />
    </div>
  );
};

const renderOrderReviewFlow = (readyToProcess) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Purchase Order</h3>
      <PurchaseOrderPreview
        items={readyToProcess}
        metadata={processingData.metadata}
        financials={processingData.financials}
        onConfirm={handleProcessOrder}
        onCancel={onProcessingCancel}
        isProcessing={isProcessing}
      />
    </div>
  );
};

const updateProgressWithMessage = (stage, message) => {
  // This function updates the UI with progress messages
  toast({
    title: `Processing: ${stage}`,
    description: message,
    duration: 3000
  });
};

const handleInventoryChecks = async (groupedItems) => {
  const itemsToCheck = [
    ...groupedItems.newProducts,
    ...groupedItems.insufficientStock,
    ...groupedItems.readyToProcess
  ];

  // Check inventory status for each item
  for (const item of itemsToCheck) {
    try {
      const inventoryStatus = await instance.get(`/inventory/check/${item.sku}`);
      item.inventoryDetails = inventoryStatus.data;
    } catch (error) {
      console.error(`Error checking inventory for ${item.sku}:`, error);
    }
  }

  return groupedItems;
};

const ErrorDisplay = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Processing Errors</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4">
          {errors.map(error => (
            <li key={error.id}>{error.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

  // Handle final purchase order processing
  const handleProcessOrder = async () => {
      setIsProcessing(true);
      try {
          // Get username from localStorage
          const username = localStorage.getItem('username')?.trim();
          if (!username) {
              throw new Error('User not authenticated');
          }

          // Get items from the ready-to-process group
          const items = processingData.groupedItems.readyToProcess;
          
          // Calculate order totals
          const totals = items.reduce((acc, item) => ({
              subtotal: acc.subtotal + (parseFloat(item.price) * parseInt(item.quantity)),
              itemCount: acc.itemCount + parseInt(item.quantity)
          }), { subtotal: 0, itemCount: 0 });

          // Format items as expected by the automated endpoint
          const formattedItems = items.map(item => ({
              uuid: item.sku.startsWith('BAT-') ? item.sku.slice(4) : item.sku, // Remove BAT- prefix if present
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price)
          }));

          // Construct data for automated purchase order
          const purchaseOrderData = {
              username: username,
              orderDate: new Date().toISOString(),
              deliveryMethod: "Standard Shipping",
              paymentTerms: "Net 30",
              totalAmount: totals.subtotal, // Backend will calculate tax and shipping
              itemsList: formattedItems
          };

          // Log data being sent for debugging
          console.log('Sending automated purchase order:', JSON.stringify(purchaseOrderData, null, 2));

          // Use the automated purchase endpoint
          const response = await instance.post(
              `/purchases/automated/${username}`, 
              purchaseOrderData
          );

          // Show success message
          toast({
              title: "Purchase Order Created",
              description: `Purchase order #${response.data.purchaseOrder.purchase_order_id} has been created successfully.`
          });

          // Update state and notify parent
          setCurrentStage(PROCESSING_STAGES.COMPLETED);
          onProcessingComplete(response.data);

      } catch (error) {
          console.error('Purchase order creation error:', error);
          
          // Enhanced error handling
          const errorMessage = error.response?.data?.message || 
                            'There was a problem creating the purchase order. Please try again.';
          
          toast({
              title: "Error Creating Purchase Order",
              description: errorMessage,
              variant: "destructive",
              duration: 5000
          });

          handleProcessingError(error);
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
      <ErrorDisplay errors={errors} />
      {renderProgressSteps()}
      
      <div className="mt-4">
        {currentStage === PROCESSING_STAGES.ADDING_PRODUCTS && (
          <AddProductsForm
            newProducts={processingData.groupedItems.newProducts}
            onProductsAdded={handleProductsAdded}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        )}
        
        {currentStage === PROCESSING_STAGES.REVIEWING_STOCK && (
          <StockReviewForm
            insufficientStock={processingData.groupedItems.insufficientStock}
            onStockUpdate={handleStockUpdate}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        )}
        
        {currentStage === PROCESSING_STAGES.FINAL_REVIEW && (
          <PurchaseOrderPreview
            extractedData={{
              items: processingData.groupedItems.readyToProcess,
              metadata: processingData.metadata,
              financials: processingData.financials
            }}
            onConfirm={handleProcessOrder}
            onCancel={onProcessingCancel}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default ChatbotProcessing;