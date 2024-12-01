import React, { useState, useEffect, useRef } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import BotMessage from "./botMessage";
import UserMessage from "./userMessage";
import Messages from "./messages";
import Input from "./input";
import ChatbotHeader from "./chatbotHeader";
import ChatLoader from './chatLoader';
import ChatErrorBoundary from "./chatErrorBoundary";
import ChatbotProcessing from './purchase_order_automation/chatbotProcessing';
import { usePurchaseOrder } from './purchase_order_automation/purchaseOrderContext';
import { PurchaseOrderProvider } from './purchase_order_automation/purchaseOrderContext';
import axiosInstance from '../axiosConfig';
import { Alert } from "../ui/alert";
import { useToast } from '../ui/use-toast';

const CONNECTION_CHECK_INTERVAL = 30000;
const SESSION_MESSAGES_KEY = 'stocksavvy_current_messages';

const AUTOMATION_STATES = {
  IDLE: 'idle',
  STARTING: 'starting',
  PROCESSING_DOCUMENT: 'processing_document',
  ANALYZING: 'analyzing',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
};

function ChatbotUI() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header/>
      <div className="flex flex-row flex-grow">
        {!isMobile && <Sidebar/>}
        <ChatErrorBoundary>
          <PurchaseOrderProvider>
            <Chatbot isMobile={isMobile} />
          </PurchaseOrderProvider>
        </ChatErrorBoundary>
      </div>
    </div>
  );
}

function Chatbot({ isMobile }) {
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem(SESSION_MESSAGES_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  });

  const [messageContext, setMessageContext] = useState({
    type: null,  // 'add_products', 'review_stock', etc.
    data: null,
    awaitingResponse: false
});

  const [automationState, setAutomationState] = useState({
      state: AUTOMATION_STATES.IDLE,
      currentStep: null,
      processedData: null,
      error: null,
      isActive: false,
      progress: {
          current: 0,
          total: 0,
          stage: null
      }
  });

  const [automationProgress, setAutomationProgress] = useState({
    totalSteps: 0,
    completedSteps: 0,
    currentStage: null,
    stages: {
      documentAnalysis: { status: 'pending' },
      productAddition: { status: 'pending' },
      stockUpdate: { status: 'pending' },
      finalReview: { status: 'pending' }
    }
  });

  // Add progress update function
  const updateAutomationProgress = (stage, status) => {
    setAutomationProgress(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: { status }
      },
      completedSteps: status === 'completed' 
        ? prev.completedSteps + 1 
        : prev.completedSteps,
      currentStage: stage
    }));

    // Add progress message to chat
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `${status === 'completed' ? '✅' : '🔄'} ${getStageDescription(stage)}`,
      isProgress: true,
      timestamp: new Date().toISOString()
    }]);
  };

  const [status, setStatus] = useState({
    isTyping: false,
    isOnline: true,
    authError: false,
    retryCount: 0,
    isRetrying: false,
    isProcessingFile: false,
    isProcessing: false
  });

  const determineRecoveryActions = (error, context) => {
    const actions = [];

    // Add retry action for recoverable errors
    if (isRecoverableError(error)) {
      actions.push({
        label: "Try Again",
        action: "retry",
        variant: "default"
      });
    }

    // Always add start over option
    actions.push({
      label: "Start Over",
      action: "restart",
      variant: "outline"
    });

    // Add cancel option
    actions.push({
      label: "Cancel",
      action: "cancel",
      variant: "outline"
    });

    return actions;
  };

  const getStageDescription = (stage) => {
    const descriptions = {
      documentAnalysis: "Analyzing purchase order document",
      productAddition: "Adding new products to inventory",
      stockUpdate: "Updating stock levels",
      finalReview: "Reviewing final details",
      processing: "Processing purchase order",
      completed: "Purchase order processing completed"
    };

    return descriptions[stage] || stage;
  };

  const startAutomation = () => {
    const welcomeMessage = {
      type: 'bot',
      text: `I can help you automate your purchase order processing. Here's how it works:

1. First, upload your purchase order document (PDF)
2. I'll extract and analyze the information
3. You can review and edit the details
4. Finally, confirm to process the order

Would you like to start by uploading your purchase order document?`,
      actions: ['upload'], // To show upload button
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, welcomeMessage]);
    setAutomationState({
      isActive: true,
      step: 'start',
      data: null
    });
  };

  const handleProcessingError = (error, context) => {
    const errorMessage = {
      type: 'bot',
      text: generateErrorMessage(error, context),
      isError: true,
      actions: determineRecoveryActions(error, context),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, errorMessage]);
  };

  const generateErrorMessage = (error, context) => {
    switch (error.code) {
      case 'PRODUCT_VALIDATION_ERROR':
        return `There were some issues with the product details:\n${error.details.join('\n')}`;
      case 'STOCK_UPDATE_ERROR':
        return `Unable to update stock levels: ${error.message}\nCurrent stock levels will remain unchanged.`;
      default:
        return `An error occurred while ${context}: ${error.message}`;
    }
  };

  const isRecoverableError = (error) => {
      // Define recoverable error types
      const recoverableErrors = [
          'NETWORK_ERROR',
          'TIMEOUT_ERROR',
          'VALIDATION_ERROR'
      ];
      return recoverableErrors.includes(error.code);
  };

  const { toast } = useToast();
  const messageEndRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [messages]);

  const handleRegularFileUpload = async (file) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
    return;
  }

  setStatus(prev => ({ ...prev, isProcessingFile: true }));

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add file message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      text: `Uploaded file: ${file.name}`,
      timestamp: new Date().toISOString()
    }]);

    const response = await axiosInstance.post("/chatbot/process-file", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    setMessages(prev => [...prev, {
      type: 'bot',
      text: response.data.message,
      data: response.data.data,
      timestamp: new Date().toISOString()
    }]);

  } catch (error) {
    console.error('File processing error:', error);
    setMessages(prev => [...prev, {
      type: 'bot',
      text: 'Sorry, I encountered an error processing your file. Please try again.',
      isError: true,
      timestamp: new Date().toISOString()
    }]);
  } finally {
    setStatus(prev => ({ ...prev, isProcessingFile: false }));
  }
  };

  const calculateFinancials = (items) => {
    // Calculate all financial aspects of the purchase order
    const subtotal = items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    );
    const tax = subtotal * 0.06; // 6% tax rate
    const shipping = 500; // Default shipping fee

    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
      itemizedTotals: items.map(item => ({
        productName: item.productName,
        lineTotal: parseFloat(item.price) * parseInt(item.quantity)
      }))
    };
  };

  const handleConfirmation = async (data) => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    try {
      // Format the data for the purchase order
      const purchaseOrderData = {
        vendorSn: "VEN-001", // This would come from vendor selection
        orderDate: new Date().toISOString(),
        paymentTerms: "Net 30",
        deliveryMethod: "Standard Shipping",
        totalAmount: data.extractedItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        ),
        itemsList: data.extractedItems.map(item => ({
          uuid: item.sku,
          quantity: parseInt(item.quantity)
        }))
      };

      // Send the purchase order to the backend
      const response = await axiosInstance.post('/purchase/create', purchaseOrderData);
      
      // Add success message
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Purchase order created successfully! 
  Order ID: ${response.data.purchase_order_id}
  Total Amount: RM${response.data.total_amount}

  Would you like to do anything else with this purchase order?`,
        actions: ['view_details', 'new_order'],
        timestamp: new Date().toISOString()
      }]);

      // Reset automation state
      setAutomationState({
        isActive: false,
        step: null,
        data: null
      });

    } catch (error) {
      console.error('Error creating purchase order:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error creating the purchase order. Please try again or contact support.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setStatus(prev => ({ ...prev, isProcessingFile: true }));
      updateAutomationProgress('documentAnalysis', 'processing');

      const formData = new FormData();
      formData.append('file', file);

      // Send file to backend for processing
      const response = await axiosInstance.post("/chatbot/process-file", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Get analysis result from response
      const { analysisResult, message } = response.data;

      // Add the initial analysis message
      setMessages(prev => [...prev, {
        type: 'bot',
        text: message,
        fileAnalysis: analysisResult,
        analysisResult: analysisResult, // Add this to trigger automation
        showPreview: true,
        actions: determineAvailableActions(analysisResult),
        timestamp: new Date().toISOString()
      }]);

      // Set automation state based on analysis
      setAutomationState({
        state: AUTOMATION_STATES.ANALYZING,
        currentStep: getInitialStep(analysisResult),
        processedData: analysisResult,
        isActive: true,
        error: null
      });

      updateAutomationProgress('documentAnalysis', 'completed');
      return analysisResult;

    } catch (error) {
      console.error('Purchase order processing error:', error);
      handleProcessingError(error);
    } finally {
      setStatus(prev => ({ ...prev, isProcessingFile: false }));
    }
  };

  // Helper function to determine initial step
  const getInitialStep = (analysisResult) => {
    if (analysisResult.groupedItems.newProducts.length > 0) {
      return 'adding_products';
    } else if (analysisResult.groupedItems.insufficientStock.length > 0) {
      return 'reviewing_stock';
    } else {
      return 'final_review';
    }
  };

  //helper function to validate state transitions
  const validateStateTransition = (currentState, nextState) => {
      const validTransitions = {
          [AUTOMATION_STATES.IDLE]: [AUTOMATION_STATES.STARTING, AUTOMATION_STATES.PROCESSING_DOCUMENT],
          [AUTOMATION_STATES.STARTING]: [AUTOMATION_STATES.PROCESSING_DOCUMENT],
          [AUTOMATION_STATES.PROCESSING_DOCUMENT]: [AUTOMATION_STATES.ANALYZING, AUTOMATION_STATES.ERROR],
          [AUTOMATION_STATES.ANALYZING]: [AUTOMATION_STATES.PROCESSING, AUTOMATION_STATES.ERROR],
          [AUTOMATION_STATES.PROCESSING]: [AUTOMATION_STATES.COMPLETED, AUTOMATION_STATES.ERROR],
          [AUTOMATION_STATES.COMPLETED]: [AUTOMATION_STATES.IDLE],
          [AUTOMATION_STATES.ERROR]: [AUTOMATION_STATES.IDLE, AUTOMATION_STATES.STARTING]
      };

      return validTransitions[currentState]?.includes(nextState) ?? false;
  };


  const handleProcessingComplete = (result) => {
    // Update automation state
    setAutomationState({
      state: AUTOMATION_STATES.COMPLETED,
      currentStep: null,
      processedData: result,
      isActive: false,
      error: null
    });

    // Add success message
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `Purchase order #${result.purchaseOrderId} has been created successfully. Is there anything else I can help you with?`,
      timestamp: new Date().toISOString()
    }]);

    toast({
      title: 'Success',
      description: `Purchase order #${result.purchaseOrderId} has been created successfully.`
    });
  };

  const handleProcessingCancel = () => {
    setAutomationState({
      state: AUTOMATION_STATES.IDLE,
      currentStep: null,
      processedData: null,
      isActive: false,
      error: null
    });

    setMessages(prev => [...prev, {
      type: 'bot',
      text: 'Purchase order processing has been cancelled. Is there anything else I can help you with?',
      timestamp: new Date().toISOString()
    }]);
  };

  // Helper function to create analysis message
  const createInitialAnalysisMessage = (analysisResult) => {
    let message = "I've analyzed your purchase order document. Here's what I found:\n\n";
    
    // Add document metadata summary
    message += `📄 Document Details:\n`;
    message += `• PO Number: ${analysisResult.metadata.poNumber}\n`;
    message += `• Date: ${analysisResult.metadata.poDate}\n`;
    message += `• Vendor: ${analysisResult.metadata.vendorName}\n\n`;
    
    // Add inventory analysis
    if (analysisResult.groupedItems.newProducts.length > 0) {
      message += "🆕 New Products to Add:\n";
      analysisResult.groupedItems.newProducts.forEach(product => {
        message += `• ${product.productName}\n`;
        message += `  - Suggested SKU: ${product.sku}\n`;
        message += `  - Quantity: ${product.quantity} units\n`;
        message += `  - Unit Price: RM${product.price}\n`;
      });
      message += "\n";
    }

    // Add stock level warnings if any
    if (analysisResult.groupedItems.insufficientStock.length > 0) {
      message += "⚠️ Stock Level Warnings:\n";
      analysisResult.groupedItems.insufficientStock.forEach(item => {
        message += `• ${item.productName}\n`;
        message += `  - Current Stock: ${item.currentStock} units\n`;
        message += `  - Needed: ${item.quantity} units\n`;
        message += `  - Shortage: ${item.quantity - item.currentStock} units\n`;
      });
      message += "\n";
    }

    return message;
  };

  // First, let's define all the handler functions needed for our actions
  const handleAddProducts = async (newProducts) => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Show a processing message
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Let's add these new products to your inventory. I'll guide you through the process.",
        timestamp: new Date().toISOString()
      }]);

      // Update the automation state
      setAutomationState(prev => ({
        ...prev,
        step: 'adding_products',
        pendingProducts: newProducts
      }));

      // Show the add products form
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Please review and fill in any additional details for these products:",
        component: 'AddProductsForm',
        data: { products: newProducts },
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error starting add products process:', error);
      handleProcessingError(error);
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const setAutomationStateWithValidation = (newState) => {
    if (!validateStateTransition(automationState.state, newState.state)) {
      console.warn(`Invalid state transition from ${automationState.state} to ${newState.state}`);
      return false;
    }

    // Update progress when state changes
    updateAutomationProgress(newState.state, 'processing');

    setAutomationState(newState);
    return true;
  };

  const getStateTransitionMessage = (fromState, toState) => {
      const transitionMessages = {
          [`${AUTOMATION_STATES.IDLE}_${AUTOMATION_STATES.STARTING}`]: "Starting purchase order automation...",
          [`${AUTOMATION_STATES.STARTING}_${AUTOMATION_STATES.PROCESSING_DOCUMENT}`]: "Processing your document...",
          [`${AUTOMATION_STATES.PROCESSING_DOCUMENT}_${AUTOMATION_STATES.ANALYZING}`]: "Analyzing the purchase order...",
          [`${AUTOMATION_STATES.ANALYZING}_${AUTOMATION_STATES.PROCESSING}`]: "Processing the purchase order...",
          [`${AUTOMATION_STATES.PROCESSING}_${AUTOMATION_STATES.COMPLETED}`]: "Purchase order processing completed!"
      };

      return transitionMessages[`${fromState}_${toState}`] || 
            `Moving from ${fromState} to ${toState}...`;
  };

  const handleReviewStock = async (insufficientStock) => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Show current stock levels and options
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Here are the current stock levels for the affected products. You can:",
        component: 'StockReviewForm',
        data: { products: insufficientStock },
        actions: [
          {
            label: "Update Stock Levels",
            action: "update_stock",
            variant: "default"
          },
          {
            label: "Modify Order Quantities",
            action: "modify_quantities",
            variant: "outline"
          }
        ],
        timestamp: new Date().toISOString()
      }]);

      setAutomationState(prev => ({
        ...prev,
        step: 'reviewing_stock',
        stockIssues: insufficientStock
      }));

    } catch (error) {
      console.error('Error starting stock review:', error);
      handleProcessingError(error);
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSaveDraft = async () => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axiosInstance.post('/purchase/save-draft', {
        ...automationState.data,
        status: 'draft'
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `I've saved this purchase order as a draft. You can find it in your drafts with ID: ${response.data.draftId}. Would you like to continue editing it now or come back later?`,
        actions: [
          {
            label: "Continue Editing",
            action: "edit_draft",
            variant: "default"
          },
          {
            label: "Done for Now",
            action: "finish",
            variant: "outline"
          }
        ],
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error saving draft:', error);
      handleProcessingError(error);
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleModifyOrder = () => {
    setAutomationState(prev => ({
      ...prev,
      step: 'editing'
    }));

    setMessages(prev => [...prev, {
      type: 'bot',
      text: "You can now edit the order details. Click on any field to modify it.",
      component: 'PurchaseOrderForm',
      data: automationState.data,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleConfirmOrder = async () => {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axiosInstance.post('/purchase/create', {
        ...automationState.data,
        status: 'confirmed'
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Purchase order has been successfully created!
        
  Order Details:
  • PO Number: ${response.data.poNumber}
  • Total Amount: RM${response.data.totalAmount.toFixed(2)}
  • Total Items: ${response.data.items.length}

  What would you like to do next?`,
        actions: [
          {
            label: "View Order Details",
            action: "view_order",
            variant: "default"
          },
          {
            label: "Create New Order",
            action: "new_order",
            variant: "outline"
          }
        ],
        timestamp: new Date().toISOString()
      }]);

      setAutomationState({
        isActive: false,
        step: null,
        data: null
      });

    } catch (error) {
      console.error('Error confirming order:', error);
      handleProcessingError(error);
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleEditOrder = () => {
    setAutomationState(prev => ({
      ...prev,
      step: 'editing'
    }));

    setMessages(prev => [...prev, {
      type: 'bot',
      text: "You can now edit any details of the purchase order. Make your changes and click 'Save' when you're done.",
      component: 'PurchaseOrderForm',
      data: automationState.data,
      timestamp: new Date().toISOString()
    }]);
  };

const determineAvailableActions = (analysisResult) => {
  const actions = [];
  
  // Add products action
  if (analysisResult.groupedItems.newProducts.length > 0) {
    actions.push({
      label: "Add New Products",
      action: "add_products",
      variant: "default",
      description: `Add ${analysisResult.groupedItems.newProducts.length} new products to inventory`,
      priority: "high"
    });
  }
  
  // Stock management action
  if (analysisResult.groupedItems.insufficientStock.length > 0) {
    actions.push({
      label: "Update Stock Levels",
      action: "review_stock",
      variant: "default",
      description: "Review and update insufficient stock levels",
      priority: "high"
    });
  }

  // Add review action if ready to process
  if (analysisResult.groupedItems.readyToProcess.length > 0) {
    actions.push({
      label: "Review Order Details",
      action: "review",
      variant: analysisResult.groupedItems.newProducts.length === 0 ? "default" : "outline",
      description: "Review the complete purchase order",
      priority: "normal"
    });
  }

  return actions;
};

// Add helper function to handle the next steps
const handleNextStep = async (action) => {
  // First validate the transition
  const nextState = {
    add_products: AUTOMATION_STATES.PROCESSING,
    review_stock: AUTOMATION_STATES.PROCESSING,
    confirm: AUTOMATION_STATES.PROCESSING,
    cancel: AUTOMATION_STATES.IDLE
  }[action.type];

  if (!validateStateTransition(automationState.state, nextState)) {
    console.error('Invalid state transition attempted');
    return;
  }

  try {
    switch (action.type) {
      case 'add_products':
        setAutomationState(prev => ({
          ...prev,
          state: AUTOMATION_STATES.PROCESSING,
          currentStep: 'adding_products'
        }));
        await handleAddProducts(automationState.processedData.groupedItems.newProducts);
        break;
        
      case 'review_stock':
        setAutomationState(prev => ({
          ...prev,
          state: AUTOMATION_STATES.PROCESSING,
          currentStep: 'reviewing_stock'
        }));
        await handleReviewStock(automationState.processedData.groupedItems.insufficientStock);
        break;
        
      case 'confirm':
        setAutomationState(prev => ({
          ...prev,
          state: AUTOMATION_STATES.PROCESSING,
          currentStep: 'processing'
        }));

        break;
        
      case 'cancel':
        handleProcessingCancel();
        break;
    }

    // Update progress
    updateAutomationProgress(automationState.currentStep, 'completed');

  } catch (error) {
    handleProcessingError(error, action.type);
    setAutomationState(prev => ({
      ...prev,
      state: AUTOMATION_STATES.ERROR,
      error
    }));
  }
};

  const generatePreviewMessage = (metadata) => {
    const { extractedItems, subtotal, tax, shipping, grandTotal } = metadata;
    
    return {
      type: 'bot',
      text: `Please review the purchase order details:

  1. Items:
  ${extractedItems.map(item => 
    `   • ${item.productName}: ${item.quantity} units at RM${item.price} each (Total: RM${item.quantity * item.price})`
  ).join('\n')}

  2. Summary:
    • Subtotal: RM${subtotal}
    • Tax (6%): RM${tax}
    • Shipping: RM${shipping}
    • Grand Total: RM${grandTotal}

  Would you like to:
  1. Confirm and process this order
  2. Edit the details
  3. Cancel and start over`,
      fileAnalysis: { metadata },
      showPreview: true,
      actions: ['confirm', 'edit', 'cancel'],
      timestamp: new Date().toISOString()
    };
  };

  const handleAutomationCommand = async (text) => {
    const command = text.toLowerCase();
    
    if (automationState.isActive) {
      switch (automationState.step) {
        case 'review':
          if (command === 'yes') {
            const lastFileData = messages
              .slice()
              .reverse()
              .find(msg => msg.fileAnalysis?.metadata)?.fileAnalysis.metadata;

            if (!lastFileData) {
              setMessages(prev => [...prev, {
                type: 'bot',
                text: "Sorry, I couldn't find the purchase order data. Please try uploading the document again.",
                timestamp: new Date().toISOString()
              }]);
              return true;
            }

            setMessages(prev => [...prev, {
              type: 'bot',
              text: renderPreview(lastFileData),
              fileAnalysis: { metadata: lastFileData },
              showPreview: true,
              actions: ['confirm', 'edit', 'cancel'],
              timestamp: new Date().toISOString()
            }]);

            setAutomationState(prev => ({
              ...prev,
              step: 'confirm',
              data: lastFileData
            }));
            return true;
          }
          break;
      }
    }
    return false;
  };  

  const renderPreview = (data) => {
    const { extractedItems, subtotal, tax, shipping, grandTotal } = data;
    return `Here's the purchase order preview:

  Items:
  ${extractedItems.map(item => 
    `• ${item.productName}: ${item.quantity} units at RM${item.price} (Total: RM${item.total})`
  ).join('\n')}

  Summary:
  • Subtotal: RM${subtotal}
  • Tax (6%): RM${tax}
  • Shipping: RM${shipping}
  • Grand Total: RM${grandTotal}

  Please review and confirm to proceed.`;
  };

  const showVendorSelection = () => {
    setMessages(prev => [...prev, {
      type: 'bot',
      text: "Please select a vendor for this purchase order:",
      component: 'VendorSelection',
      timestamp: new Date().toISOString()
    }]);
    setAutomationState(prev => ({
      ...prev,
      currentStep: 'vendor'
    }));
  };

  const handleAutomate = async (command) => {
  if (command.toLowerCase().includes('purchase order')) {
    // Check if we have recently processed file data in the messages
    const recentFileMessage = messages.slice(-3).find(msg => 
      msg.fileAnalysis?.metadata?.extractedItems?.length > 0
    );

    if (recentFileMessage) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I've found the purchase order data. Would you like me to help you process it?",
        data: recentFileMessage.fileAnalysis.metadata,
        showPreview: true, // New flag to trigger preview
        timestamp: new Date().toISOString()
      }]);
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "To automate a purchase order, please first upload a purchase order document and I'll help you process it. You can upload a PDF or image file.",
        timestamp: new Date().toISOString()
      }]);
    }
  }
  };

  const send = async (text) => {
      if (!text.trim()) return;

      // Add user message immediately for better UX
      setMessages(prev => [...prev, {
          type: 'user',
          text: text,
          timestamp: new Date().toISOString()
      }]);

      setStatus(prev => ({ ...prev, isTyping: true }));

      try {
          // Check if we're awaiting a specific response
          if (messageContext.awaitingResponse) {
              switch (messageContext.type) {
                  case 'add_products':
                      if (text.toLowerCase() === 'yes') {
                          // Immediately show processing message
                          setMessages(prev => [...prev, {
                              type: 'bot',
                              text: "Great! I'll help you add these products to inventory. Please fill in any additional details needed.",
                              timestamp: new Date().toISOString()
                          }]);

                          // Start product addition flow immediately
                          handleAddProducts(messageContext.data);
                          
                          // Clear context since we're handling it
                          setMessageContext({ type: null, data: null, awaitingResponse: false });
                          return;
                      }
                      break;
                  // Add other context cases here
              }
          }

          // If no special context or not a 'yes', proceed with regular chat
          const response = await axiosInstance.post("/chatbot/chat", { message: text });
          
          setMessages(prev => [...prev, {
              type: 'bot',
              text: response.data.message,
              data: response.data.data,
              timestamp: new Date().toISOString()
          }]);

      } catch (error) {
          console.error('Chat error:', error);
          setMessages(prev => [...prev, {
              type: 'bot',
              text: 'Sorry, I encountered an error. Please try again.',
              isError: true,
              timestamp: new Date().toISOString()
          }]);
      } finally {
          setStatus(prev => ({ ...prev, isTyping: false }));
      }
  };

  return (
    <div className={`
      flex-1 flex flex-col h-full bg-gray-50 custom-scrollbar
      transition-all duration-300 ease-in-out
      ${isMobile ? 'w-full' : 'ml-[13rem]'}
    `}>
      <div className="flex flex-col h-full relative">
        <ChatbotHeader 
          isOnline={status.isOnline}
          isMobile={isMobile}
          automationState={automationState.state}
        />

        {(status.authError || !status.isOnline) && (
          <Alert variant="warning" className="mx-4 my-2">
            {status.authError 
              ? "Please log in to use the chat feature."
              : "Connection lost. Attempting to reconnect..."}
          </Alert>
        )}

        <div className="flex-1 relative"> 
          <Messages 
            messages={messages} 
            isTyping={status.isTyping || status.isProcessingFile}
            isMobile={isMobile}
            automationState={automationState}
            onProcessingComplete={handleProcessingComplete}
            onProcessingCancel={handleProcessingCancel}
            onActionClick={(action) => {
              if (action.handler) {
                action.handler();
              } else {
                handleNextStep(action.type);
              }
            }}
          />
          <div ref={messageEndRef} />
        </div>

        <div className="flex-none bg-white border-t">
          <Input 
            onSend={send} 
            onFileUpload={handleFileUpload}
            disabled={!status.isOnline || 
                     status.authError || 
                     status.isRetrying ||
                     automationState.state === AUTOMATION_STATES.PROCESSING}
            isMobile={isMobile}
            showUpload={automationState.state === AUTOMATION_STATES.STARTING}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;