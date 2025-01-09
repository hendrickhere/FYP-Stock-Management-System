import React, { useState, useEffect } from 'react';
import { usePurchaseOrder } from './purchaseOrderContext';
import AddProductsForm from './addProductForm';
import InventoryVerificationView from './inventoryVerificationView';
import PurchaseOrderPreview from './purchaseOrderPreview';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import { AlertCircle, Package, ArrowRight, Save, Check } from "lucide-react";
import { Steps } from "../../ui/steps";
import { useToast } from "../../ui/use-toast";
import { FileText } from 'lucide-react';
import { Button } from '../../ui/button';
import instance from '../../axiosConfig';

const PROCESSING_STAGES = {
  INITIAL: 'initial',
  DOCUMENT_PROCESSING: 'document_processing',    
  INVENTORY_VALIDATION: 'inventory_validation',  
  PURCHASE_ORDER_REVIEW: 'purchase_order_review',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const ChatbotProcessing = ({ 
  analysisResult, 
  onProcessingComplete,
  onProcessingCancel,
  onMessage
}) => {
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      setProcessingData(null);
      setFormData(null);
      setCurrentView('create_products');
      setIsFormComplete(false);
    };
  }, []);

  const { state, dispatch } = usePurchaseOrder();
  const [currentStage, setCurrentStage] = useState(PROCESSING_STAGES.INITIAL);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);

  const [status, setStatus] = useState({
    isProcessing: false,
    error: null
  });

  const [currentView, setCurrentView] = useState(
  // Initialize based on analysisResult
  analysisResult?.status?.requiresProductCreation 
    ? 'create_products' 
    : 'review_order'
);

  const [formData, setFormData] = useState(analysisResult);
  
  const [processingState, setProcessingState] = useState({
    stage: PROCESSING_STAGES.INITIAL,
    missingInfo: [],
    autoFilledFields: []
  });

  const [completedOrders, setCompletedOrders] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('completed_purchase_orders') || '[]');
    } catch {
      return [];
    }
  });

  const [processingData, setProcessingData] = useState(() => {
      if (!analysisResult) return null;

      return {
        metadata: analysisResult.metadata,
        items: {
          existingProducts: (analysisResult.items?.existingProducts || []).map(item => ({
            ...item,
            quantity: item.quantity || 0 
          })),
          newProducts: (analysisResult.items?.newProducts || []).map(item => ({
            ...item,
            quantity: item.quantity || 0, 
            sku: item.suggestedSku || item.sku || ''
          }))
        },
        financials: analysisResult.financials || {},
        status: analysisResult.status || {}
      };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [errors, setErrors] = useState([]);

  const validateAnalysisResult = (result) => {
    // First level validation
    if (!result) {
      return { 
        isValid: false, 
        error: 'No analysis result provided',
        details: null
      };
    }

    // Initialize validation results
    let validationResults = {
      isValid: true,
      warnings: [],
      details: {
        hasMetadata: false,
        hasItems: false,
        hasGroupedItems: false
      }
    };

    // Check metadata
    if (!result.metadata || !result.metadata.poNumber) {
      validationResults.warnings.push('Purchase order metadata incomplete');
      validationResults.details.hasMetadata = false;
    } else {
      validationResults.details.hasMetadata = true;
    }

    // Check extracted items
    if (!result.extractedItems || !Array.isArray(result.extractedItems)) {
      validationResults.warnings.push('No items found in purchase order');
      validationResults.details.hasItems = false;
    } else {
      validationResults.details.hasItems = true;
    }

    // Check and initialize groupedItems if missing
    if (!result.groupedItems) {
      // Instead of failing, initialize with empty arrays
      result.groupedItems = {
        newProducts: [],
        existingProducts: [],
        insufficientStock: [],
        readyToProcess: []
      };
      validationResults.warnings.push('Initialized empty grouped items');
      validationResults.details.hasGroupedItems = false;
    } else {
      // Ensure all required arrays exist
      const requiredArrays = ['newProducts', 'existingProducts', 'insufficientStock'];
      requiredArrays.forEach(arrayName => {
        if (!Array.isArray(result.groupedItems[arrayName])) {
          result.groupedItems[arrayName] = [];
          validationResults.warnings.push(`Initialized empty ${arrayName} array`);
        }
      });
      validationResults.details.hasGroupedItems = true;
    }

    // Calculate final validation state
    validationResults.isValid = validationResults.details.hasMetadata && 
                              validationResults.details.hasItems;

    return validationResults;
  };

  useEffect(() => {
    if (!analysisResult) return;

  if (analysisResult.status?.completed) {
    setProcessingData(null);
    return;
  }
    
    let mounted = true;
    
    const processAnalysis = async () => {
      try {
        // Validate the structure first
        const validationResult = validateAnalysisResult(analysisResult);
        if (!validationResult.isValid) {
          throw new Error(validationResult.error);
        }

        // Initialize processing data
        setProcessingData({
          metadata: analysisResult.metadata || {},
          items: analysisResult.extractedItems || [],
          groupedItems: {
            newProducts: analysisResult.groupedItems?.newProducts || [],
            existingProducts: analysisResult.groupedItems?.existingProducts || [],
            insufficientStock: analysisResult.groupedItems?.insufficientStock || [],
            readyToProcess: []
          },
          financials: analysisResult.financials || {}
        });

        // Only proceed if component is still mounted
        if (!mounted) return;

        // Determine next steps and create message
        const nextSteps = determineNextSteps(analysisResult);
        if (onMessage) {
          onMessage({
            type: 'bot',
            text: nextSteps.message,
            actions: nextSteps.actions,
            showPreview: true,
            fileAnalysis: {
              metadata: analysisResult.metadata,
              extractedItems: analysisResult.extractedItems,
              financials: analysisResult.financials
            },
            timestamp: new Date().toISOString()
          });
        }

        // Update processing state
        setCurrentStage(nextSteps.stage);
        dispatch({
          type: 'SET_PROCESSING_STAGE',
          payload: {
            stage: nextSteps.stage,
            currentStep: 'analysis_complete',
            processedData: analysisResult
          }
        });

      } catch (error) {
        if (!mounted) return;
        console.error('Processing error:', error);
        handleProcessingError(error);
      }
    };

    processAnalysis();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, [analysisResult]);

const determineNextSteps = (analysisResult) => {
  if (!analysisResult?.groupedItems) {
    return {
      stage: PROCESSING_STAGES.ERROR,
      message: "Sorry, I couldn't process the document properly.",
      actions: [{ label: "Try Again", action: "retry", variant: "default" }]
    };
  }

  // If we have new products, we need to validate them first
  if (analysisResult.groupedItems.newProducts?.length > 0) {
    return {
      stage: PROCESSING_STAGES.INVENTORY_VALIDATION,
      message: `I found ${analysisResult.groupedItems.newProducts.length} new products that need to be added to inventory. Please validate their details.`,
      actions: [{
        label: "Add & Validate Products",
        action: "validate_products",
        variant: "default",
        priority: "high"
      }]
    };
  }

  // If all products exist, go straight to PO review
  return {
    stage: PROCESSING_STAGES.PURCHASE_ORDER_REVIEW,
    message: "All products verified. Please review the purchase order details.",
    actions: [{
      label: "Review Purchase Order",
      action: "review",
      variant: "default",
      type: "review"
    }]
  };
};

  const handleProcessingCancel = () => {
    // First, clear the local processing state
    setProcessingData(null);
    setFormData(null);
    setCurrentView('create_products');
    setIsFormComplete(false);
    
    // Remove processing state from session storage
    sessionStorage.removeItem('chatbot_processing_state');

    // Notify parent component of cancellation
    if (onProcessingCancel) {
      onProcessingCancel();
    }
  };

  useEffect(() => {
    // If analysisResult is cleared or completed, clean up local state
    if (!analysisResult || analysisResult.status?.completed) {
      setProcessingData(null);
      setFormData(null);
      setCurrentView('create_products');
      setIsFormComplete(false);
      sessionStorage.removeItem('chatbot_processing_state');
    }
  }, [analysisResult]);

// Handle new products being added
const handleProductsAdded = async (newProducts) => {
  setIsProcessing(true);
  try {
    const response = await instance.post('/user/inventory/batch', { products: newProducts });
    
    // Get original quantities from the purchase order
    const originalQuantities = {};
    processingData.items.newProducts.forEach(item => {
      originalQuantities[item.productName] = parseInt(item.quantity || item.orderQuantity || 0);
      if (item.sku) originalQuantities[item.sku] = parseInt(item.quantity || item.orderQuantity || 0);
    });

    // Create the formatted products once to ensure consistency
    const formattedProducts = newProducts.map(product => ({
      productName: product.product_name,
      sku: product.sku_number,
      quantity: originalQuantities[product.product_name] || 
               originalQuantities[product.sku_number] || 
               parseInt(product.quantity || 0),
      price: parseFloat(product.price || 0),
      cost: parseFloat(product.cost || 0),
      type: 'new'
    }));

    // Update both formData and processingData
    setFormData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        existingProducts: [
          ...(prev.items.existingProducts || []),
          ...formattedProducts
        ]
      }
    }));

    setProcessingData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        existingProducts: [
          ...(prev.items.existingProducts || []),
          ...formattedProducts
        ]
      }
    }));

    setIsFormComplete(true);
    setCurrentView('review_order');

  } catch (error) {
    console.error('Error adding products:', error);
    toast({
      title: "Error Adding Products",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsProcessing(false);
  }
};

const handleProcessingError = (error) => {
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

  // Handle final purchase order processing
  const handleProcessOrder = async (modifiedData) => {
    if (status.isProcessing) return; // Prevent multiple submissions
  
    try {
      setStatus(prev => ({ ...prev, isProcessing: true }));
      const username = localStorage.getItem('username')?.trim();
      if (!username) throw new Error('User not authenticated');
  
      // Use the modified data passed from PurchaseOrderPreview
      const allItems = modifiedData.items.map(item => ({
        sku: item.sku,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        productName: item.productName
      }));
  
      const purchaseOrderData = {
        username,
        orderDate: new Date().toISOString(),
        deliveryMethod: "Standard Shipping",
        paymentTerms: "Net 30",
        totalAmount: modifiedData.financials.total,
        itemsList: allItems
      };
  
      const response = await instance.post(
        `/purchases/automated/${username}`, 
        purchaseOrderData
      );
      
      if (response.status === 200 || response.status === 201) {
        // Update session storage
        const currentMessages = JSON.parse(sessionStorage.getItem('stocksavvy_current_messages') || '[]');
        const updatedMessages = currentMessages.map(msg => {
          if (msg.fileAnalysis?.metadata?.poNumber === analysisResult.metadata?.poNumber) {
            return { ...msg, fileAnalysis: { ...msg.fileAnalysis, status: { completed: true } } };
          }
          return msg;
        });
        sessionStorage.setItem('stocksavvy_current_messages', JSON.stringify(updatedMessages));
        
        // Clear states
        setProcessingData(null);
        setFormData(null);
  
        // Notify completion
        if (onMessage) {
          onMessage({
            type: 'bot',
            text: `Purchase order #${response.data.orderId} created successfully. Need anything else?`,
            timestamp: new Date().toISOString()
          });
        }
  
        if (onProcessingComplete) {
          onProcessingComplete({
            status: 'success',
            orderId: response.data.orderId,
            data: purchaseOrderData
          });
        }
      }
    } catch (error) {
      console.error('Error processing order:', error);
      handleProcessingError(error);
      throw error; // Re-throw to be caught by PurchaseOrderPreview
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const validateDataStructure = (data) => {
    // First check if data exists
    if (!data) {
      console.error('No analysis data provided');
      return false;
    }

    // Check required top-level properties
    const requiredProps = ['metadata', 'extractedItems', 'groupedItems'];
    for (const prop of requiredProps) {
      if (!data[prop]) {
        console.error(`Missing required property: ${prop}`);
        return false;
      }
    }

    // Validate groupedItems structure
    if (!data.groupedItems || typeof data.groupedItems !== 'object') {
      console.error('Invalid groupedItems structure');
      return false;
    }

    // Ensure all required arrays exist
    const requiredArrays = ['insufficientStock', 'newProducts', 'existingProducts'];
    for (const arrayName of requiredArrays) {
      if (!Array.isArray(data.groupedItems[arrayName])) {
        console.error(`Invalid or missing array: ${arrayName}`);
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    if (!validateDataStructure(analysisResult)) {
      console.error('Invalid analysis result structure:', analysisResult);
      onProcessingCancel();
      return;
    }

    setProcessingData({
      metadata: analysisResult.metadata,
      items: analysisResult.extractedItems,
      groupedItems: analysisResult.groupedItems,
      financials: analysisResult.financials
    });
  }, [analysisResult]);

  if (status.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Processing Purchase Order</AlertTitle>
        <AlertDescription>{status.error}</AlertDescription>
        <Button onClick={onProcessingCancel}>Start Over</Button>
      </Alert>
    );
  }

  if (!analysisResult || 
      !processingData || 
      analysisResult.status?.completed) {
    return null;
  }

  if (isCompleted || 
      currentStage === PROCESSING_STAGES.COMPLETED || 
      analysisResult?.status?.completed ||
      !processingData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-4">
        <Steps 
          currentStep={currentView === 'create_products' ? 0 : 1}
          steps={[
            {
              label: "Add New Products",
              status: currentView === 'create_products' ? 'current' : 'completed',
              hidden: !analysisResult.status.requiresProductCreation
            },
            {
              label: "Review Purchase Order",
              status: currentView === 'review_order' ? 'current' : 'pending'
            }
          ].filter(step => !step.hidden)}
        />
      </div>

      {/* Main Content */}
        {processingData && currentView === 'create_products' && !isProcessing ? (
            <AddProductsForm
            products={formData.items.newProducts}
            onProductsAdded={handleProductsAdded}
            onCancel={handleProcessingCancel}
            isProcessing={status.isProcessing}
            disabled={status.isProcessing}
            />
        ) : currentView === 'review_order' ? (
            <PurchaseOrderPreview
                extractedData={{
                    items: formData.items.existingProducts, 
                    metadata: formData.metadata,
                    financials: formData.financials
                }}
                onConfirm={handleProcessOrder}
                onCancel={onProcessingCancel}
                isProcessing={isProcessing}
            />
        ) : null}
      
    </div>
  );
};

export default ChatbotProcessing;