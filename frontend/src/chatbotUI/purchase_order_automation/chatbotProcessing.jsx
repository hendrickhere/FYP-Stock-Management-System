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

  // Helper function to initialize empty purchase order structure
  const createEmptyPurchaseOrder = () => {
    return {
      metadata: {
        poNumber: null,
        poDate: new Date().toISOString(),
        vendorName: 'Unknown Vendor'
      },
      extractedItems: [],
      groupedItems: {
        newProducts: [],
        existingProducts: [],
        insufficientStock: [],
        readyToProcess: []
      },
      financials: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        grandTotal: 0
      }
    };
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

  const ProcessingProgress = ({ currentStage, missingInfo }) => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Processing Status</h3>
          {missingInfo.length > 0 && (
            <span className="text-sm text-amber-600">
              {missingInfo.length} fields need attention
            </span>
          )}
        </div>
        
        <div className="relative">
          <div className="flex justify-between mb-1">
            {Object.values(PROCESSING_STAGES).map((stage) => (
              <div 
                key={stage}
                className={`text-sm ${
                  stage === currentStage 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                {stage.replace(/_/g, ' ').toLowerCase()}
              </div>
            ))}
          </div>
          
          <div className="h-2 bg-gray-200 rounded">
            <div 
              className="h-full bg-blue-600 rounded transition-all duration-300"
              style={{
                width: `${
                  (Object.values(PROCESSING_STAGES).indexOf(currentStage) + 1) /
                  Object.values(PROCESSING_STAGES).length * 100
                }%`
              }}
            />
          </div>
        </div>

        {missingInfo.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
            <p className="font-medium text-amber-800">Missing Information:</p>
            <ul className="list-disc pl-4 mt-1 text-amber-700">
              {missingInfo.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

    const renderProcessingView = () => {
      // Always show current status and missing information
      return (
        <div className="space-y-4">
          {/* Progress indicator */}
          <ProcessingProgress 
            currentStage={processingState.stage}
            missingInfo={processingState.missingInfo}
          />

          {/* Main content with missing field indicators */}
          <div className="relative">
            {processingState.autoFilledFields.length > 0 && (
              <Alert variant="info" className="mb-4">
                <AlertTitle>Some information was automatically filled</AlertTitle>
                <AlertDescription>
                  The following fields were auto-filled with default values:
                  <ul>
                    {processingState.autoFilledFields.map(field => (
                      <li key={field.name}>
                        {field.name}: {field.value} (click to edit)
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Render appropriate form/view based on stage */}
            {renderStageContent()}
          </div>

          {/* Action buttons with clear next steps */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isProcessing}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleProceed}
              disabled={isProcessing}
            >
              {processingState.missingInfo.length > 0 
                ? 'Proceed (Some Fields Missing)' 
                : 'Proceed'}
            </Button>
          </div>
        </div>
      );
    };

  const handleSaveAsDraft = async () => {
  try {
    setIsProcessing(true);
    
    const draftData = {
      ...processingData,
      status: 'draft',
      metadata: {
        ...processingData.metadata,
        savedAt: new Date().toISOString()
      }
    };

    const response = await instance.post('/purchase/save-draft', draftData);
    
    toast({
      title: 'Draft Saved',
      description: `Purchase order draft saved successfully. Draft ID: ${response.data.draftId}`,
      duration: 3000
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    toast({
      title: 'Error',
      description: 'Failed to save draft. Please try again.',
      variant: 'destructive'
    });
  } finally {
    setIsProcessing(false);
  }
};

const handleProceed = async () => {
  try {
    setIsProcessing(true);
    
    // If we have missing information, show a confirmation dialog
    if (processingState.missingInfo.length > 0) {
      const confirmMessage = 
        `This purchase order is missing the following information:\n` +
        `${processingState.missingInfo.join('\n')}\n\n` +
        `Do you want to proceed anyway?`;
        
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    // Proceed with the next stage based on current stage
    const nextStage = determineNextStage(processingData);
    setCurrentStage(nextStage);
    
    // If we're moving to final review, prepare the order
    if (nextStage === PROCESSING_STAGES.PURCHASE_ORDER_REVIEW) {
      await handleProcessOrder();
    }

  } catch (error) {
    console.error('Error proceeding:', error);
    handleProcessingError(error);
  } finally {
    setIsProcessing(false);
  }
};

    const calculateTaxWithDefaults = (analysisResult) => {
  // If we have a valid subtotal, calculate 6% tax
  if (analysisResult.financials?.subtotal) {
    return analysisResult.financials.subtotal * 0.06;
  }
  
  // If we have individual items but no subtotal
  if (analysisResult.extractedItems?.length) {
    const calculatedSubtotal = analysisResult.extractedItems.reduce(
      (sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 
      0
    );
    return calculatedSubtotal * 0.06;
  }
  
  // Default to 0 if no valid data
  return 0;
};

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

  const determineNextStage = (analysisResult) => {
    // Follow the business rules for stage determination
    if (!analysisResult.groupedItems) {
      return PROCESSING_STAGES.ERROR;
    }

    // Check if we need to add new products first
    if (analysisResult.groupedItems.newProducts?.length > 0) {
      return PROCESSING_STAGES.ADDING_PRODUCTS;
    }

    // Then check if we need to review stock levels
    if (analysisResult.groupedItems.insufficientStock?.length > 0) {
      return PROCESSING_STAGES.REVIEWING_STOCK;
    }

    // If all products exist and have sufficient stock
    return PROCESSING_STAGES.FINAL_REVIEW;
  };

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

const renderValidationErrorsFlow = (validationErrors) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Validation Issues Found</h3>
      <Alert variant="warning">
        <AlertTitle>Please Review The Following Issues</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-4 space-y-2">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">
                {error.item && <strong className="font-medium">{error.item}: </strong>}
                {error.details ? (
                  <div className="pl-4 mt-1">
                    {error.details.nameMatch === false && 
                      <p>- Product name mismatch</p>}
                    {error.details.skuMatch === false && 
                      <p>- SKU mismatch</p>}
                    {error.details.priceInRange === false && 
                      <p>- Price outside acceptable range</p>}
                    {error.details.unitsMatch === false && 
                      <p>- Unit mismatch</p>}
                  </div>
                ) : (
                  <span>{error.message}</span>
                )}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onProcessingCancel}
        >
          Cancel Processing
        </Button>
        <Button
          // onClick={() => handleNextStep('retry')}
        >
          Retry Validation
        </Button>
      </div>
    </div>
  );
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

const renderOrderReviewFlow = (existingProducts) => {
  if (!existingProducts || existingProducts.length === 0) {
    // Handle the case where we have no products to review
    return (
      <Alert variant="warning">
        <AlertTitle>No Products to Review</AlertTitle>
        <AlertDescription>
          No valid products were found for review. Please check your purchase order details.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Purchase Order</h3>
      <PurchaseOrderPreview
        items={existingProducts}
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

const validateInventoryItem = (item, existingProduct) => {
  // Price range calculation for validation
  const priceRange = {
    min: existingProduct.cost * 0.85, // 15% below cost
    max: existingProduct.cost * 1.15  // 15% above cost
  };

  // Return validation results
  return {
    nameMatch: item.productName === existingProduct.product_name,
    skuMatch: item.sku === existingProduct.sku_number,
    priceInRange: item.price >= priceRange.min && item.price <= priceRange.max,
    unitsMatch: item.unit === existingProduct.unit,
    currentStock: existingProduct.product_stock,
    manufacturer: existingProduct.manufacturer
  };
};

const handleInventoryChecks = async (groupedItems) => {
  try {
    const results = {
      validProducts: [],
      newProducts: [],
      validationErrors: []
    };

    for (const item of groupedItems) {
      const productResponse = await instance.get(`/inventory/product/${item.sku}`);
      
      if (productResponse.data) {
        const validation = validateInventoryItem(item, productResponse.data);
        
        if (Object.values(validation).every(v => v === true)) {
          results.validProducts.push({
            ...item,
            product_id: productResponse.data.product_id,
            currentStock: productResponse.data.product_stock
          });
        } else {
          results.validationErrors.push({
            sku: item.sku,
            validation
          });
        }
      } else {
        results.newProducts.push(item);
      }
    }

    return results;
  } catch (error) {
    console.error('Inventory check error:', error);
    throw new Error('Failed to verify inventory items');
  }
};

const handleModify = (modifiedData) => {
  // Update formData with the modified data
  setFormData(prev => ({
    ...prev,
    items: {
      existingProducts: modifiedData.items,
      newProducts: []
    },
    financials: modifiedData.financials
  }));

  // Also update processingData to keep them in sync
  setProcessingData(prev => ({
    ...prev,
    items: {
      existingProducts: modifiedData.items,
      newProducts: []
    },
    financials: modifiedData.financials
  }));
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

// Render current stage content
const renderStageContent = () => {
  if (isProcessing) {
    return <div>Processing...</div>;
  }

  if (currentView === 'create_products' && !isFormComplete) {
    return (
      <AddProductsForm
        products={formData.items.newProducts}
        onProductsAdded={handleProductsAdded}
        onCancel={onProcessingCancel}
        isProcessing={status.isProcessing}
        disabled={status.isProcessing}
      />
    );
  }

if (currentView === 'review_order' || isFormComplete) {
  // Get unique products by SKU to avoid duplicates
  const productMap = new Map();
  
  // Add existing products
  processingData.items.existingProducts.forEach(item => {
    const sku = item.sku || item.sku_number;
    if (!productMap.has(sku)) {
      productMap.set(sku, {
        productName: item.productName || item.product_name,
        sku: sku,
        quantity: parseInt(item.orderQuantity || item.quantity || 0),
        price: parseFloat(item.price || item.cost || 0),
        productId: item.productId,
        type: 'existing'
      });
    }
  });
  
  // Add newly added products, overwriting any duplicates
  formData?.items?.existingProducts?.forEach(item => {
    if (item.type === 'new') {
      const sku = item.sku || item.sku_number;
      productMap.set(sku, {
        productName: item.productName || item.product_name,
        sku: sku,
        quantity: parseInt(item.orderQuantity || item.quantity || 0),
        price: parseFloat(item.price || item.cost || 0),
        type: 'new'
      });
    }
  });

  // Convert map back to array
  const allProducts = Array.from(productMap.values());

  console.log('Preview Data - All Products:', allProducts); // For debugging

  const previewData = {
    items: allProducts,
    metadata: processingData.metadata,
    financials: {
      subtotal: allProducts.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0),
      tax: allProducts.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0) * 0.06,
      shipping: 500,
      total: (allProducts.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0) * 1.06) + 500
    }
  };

  return (
    <PurchaseOrderPreview
      extractedData={previewData}
      onConfirm={handleProcessOrder}
      onCancel={onProcessingCancel}
      isProcessing={isProcessing}
    />
  );
}

  return null;
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
        {currentView === 'create_products' && !isProcessing ? (
            <AddProductsForm
                products={formData.items.newProducts}
                onProductsAdded={handleProductsAdded}
                onCancel={onProcessingCancel}
                isProcessing={status.isProcessing}
                disabled={status.isProcessing} // Add this to prevent multiple submissions
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