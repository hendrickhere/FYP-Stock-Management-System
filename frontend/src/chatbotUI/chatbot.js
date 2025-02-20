import React, { useState, useEffect, useRef } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Messages from "./messages";
import Input from "./input";
import ChatbotHeader from "./chatbotHeader";
import ChatErrorBoundary from "./chatErrorBoundary";
import { PurchaseOrderProvider } from './purchase_order_automation/purchaseOrderContext';
import axiosInstance from '../axiosConfig';
import { Alert } from "../ui/alert";
import { useToast } from '../ui/use-toast';

const SESSION_MESSAGES_KEY = 'stocksavvy_current_messages';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

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
  const userRole = JSON.parse(sessionStorage.getItem('userData'))?.role;
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
          {userRole?.toLowerCase() === 'staff' ? (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <motion.div 
                  className="p-6 h-full"
                  animate={{ 
                    marginLeft: isMobile ? '0' : '13rem',
                  }}
                  transition={springTransition}
                >
                  <div className="flex items-center justify-center h-full">
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white/50 rounded-lg p-8">
                        <FaLock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
                        <p className="text-gray-600 max-w-md">
                          You don't have permission to access the chatbot. This feature is not available for staff members.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <PurchaseOrderProvider>
              <Chatbot isMobile={isMobile} />
            </PurchaseOrderProvider>
          )}
        </ChatErrorBoundary>
      </div>
    </div>
  );
}

function Chatbot({ isMobile, onProcessingComplete = () => {} }) {
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

const [processingError, setProcessingError] = useState(null);

const handleProcessingError = (error) => {
    setProcessingError(error);
    // Don't automatically cancel
    setMessages(prev => [...prev, {
        type: 'bot',
        text: 'An error occurred while processing the purchase order. Would you like to try again?',
        actions: [
            { label: 'Try Again', action: 'retry' },
            { label: 'Start Over', action: 'cancel' }
        ],
        isError: true,
        timestamp: new Date().toISOString()
    }]);
};

  const handleProcessingMessage = (message) => {
      // Prevent duplicate messages
      setMessages(prev => {
          const isDuplicate = prev.some(m => 
              m.timestamp === message.timestamp && 
              m.text === message.text
          );
          if (isDuplicate) return prev;
          return [...prev, message];
      });
  };

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

const handleProcessingComplete = (result) => {
    if (!result?.purchaseOrder?.purchase_order_id) return;
    
    // Update messages to mark the analysis as completed
    setMessages(prev => prev.map(msg => {
      if (msg.fileAnalysis && msg.analysisResult) {
        return {
          ...msg,
          fileAnalysis: {
            ...msg.fileAnalysis,
            status: { ...msg.fileAnalysis.status, completed: true }
          },
          analysisResult: {
            ...msg.analysisResult,
            status: { ...msg.analysisResult.status, completed: true }
          }
        };
      }
      return msg;
    }));

    // Add success message
    const successMessage = {
      type: 'bot',
      text: `Purchase order #${result.purchaseOrder.purchase_order_id} created successfully. Need anything else?`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, successMessage]);
  };

  const validateAnalysisResult = (result) => {
  if (!result) {
    return { 
      isValid: false, 
      error: 'No analysis result provided' 
    };
  }

    // Validate metadata
    if (!result.metadata || typeof result.metadata !== 'object') {
      return {
        isValid: false,
        error: 'Missing or invalid metadata'
      };
    }

    // Validate items structure
    if (!result.items || typeof result.items !== 'object') {
      return {
        isValid: false,
        error: 'Missing or invalid items structure'
      };
    }

    // Check existingProducts and newProducts arrays
    if (!Array.isArray(result.items.existingProducts) || !Array.isArray(result.items.newProducts)) {
      return {
        isValid: false,
        error: 'Invalid products arrays structure'
      };
    }

    // Validate financials
    if (!result.financials || typeof result.financials !== 'object') {
      return {
        isValid: false,
        error: 'Missing or invalid financials'
      };
    }

    // Validate status flags
    if (!result.status || typeof result.status !== 'object') {
      return {
        isValid: false,
        error: 'Missing or invalid status flags'
      };
    }

    // If all validations pass
    return {
      isValid: true
    };
  };

  const { toast } = useToast();
  const messageEndRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    try {
      if (isSubscribed) {
        sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }

    return () => {
      isSubscribed = false;
    };
  }, [messages]);

  const handleFileUpload = async (file) => {
    try {
      setStatus(prev => ({ ...prev, isProcessingFile: true }));
      updateAutomationProgress('documentAnalysis', 'processing');

      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post("/chatbot/process-file", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to process file');
      }

      // Add validation before creating the message
      const validationResult = validateAnalysisResult(response.data.analysisResult);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Structure the bot message with all required data
      const botMessage = {
        type: 'bot',
        text: response.data.message,
        fileAnalysis: response.data.analysisResult,
        analysisResult: response.data.analysisResult,
        showPreview: true,
        actions: response.data.suggestedActions,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      
      updateAutomationProgress('documentAnalysis', 'completed');
      return response.data.analysisResult;

    } catch (error) {
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

  const handleProcessingCancel = () => {
    const wasActive = automationState.state !== AUTOMATION_STATES.IDLE;
  
    // Clear automation state
    setAutomationState(prev => ({
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
    }));
  
    // Clear processing data from session storage
    try {
      const currentMessages = JSON.parse(sessionStorage.getItem(SESSION_MESSAGES_KEY) || '[]');
      // Remove messages with fileAnalysis and analysis results
      const updatedMessages = currentMessages.filter(msg => !msg.fileAnalysis && !msg.analysisResult);
      sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(updatedMessages));
      sessionStorage.removeItem('chatbot_processing_state');
    } catch (error) {
      console.error('Error clearing session storage:', error);
    }
  
    // Only add cancellation message if automation was actually active
    if (wasActive) {
      setMessages(prev => {
        // Check if we already have a cancellation message
        const hasCancellation = prev.some(msg => 
          msg.text?.includes('Purchase order processing cancelled')
        );
        
        if (!hasCancellation) {
          return [...prev, {
            type: 'bot',
            text: 'Purchase order processing cancelled. You can upload a new document to start again.',
            timestamp: new Date().toISOString()
          }];
        }
        return prev;
      });
    }
  
    // Clear message context
    setMessageContext({
      type: null,
      data: null,
      awaitingResponse: false
    });
  };

  const handleExplicitCancel = () => {
    handleProcessingCancel();
    // Clear any remaining form state
    setMessageContext({
      type: null,
      data: null,
      awaitingResponse: false
    });
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
  const userMessage = {
    type: 'user',
    text: text,
    timestamp: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);

  setStatus(prev => ({ ...prev, isTyping: true }));

  try {
    // Get username from localStorage for context
    const username = localStorage.getItem('username')?.trim();
    if (!username) {
      throw new Error('User not authenticated');
    }

    const response = await axiosInstance.post("/chatbot/chat", { 
      message: text,
      context: {
        username,
        messageType: messageContext.type || null,
        previousMessages: messages.slice(-3) // Send last 3 messages for context
      }
    });

    // Enhanced response handling
    const botMessage = {
      type: 'bot',
      text: response.data.message,
      data: response.data.data,
      suggestions: response.data.suggestions,
      intent: response.data.intent, // New field from intent analysis
      metrics: response.data.metrics, // New field from query results
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, botMessage]);

    // Handle suggestions if present
    if (response.data.suggestions?.length > 0) {
      setMessageContext(prev => ({
        ...prev,
        suggestions: response.data.suggestions
      }));
    }

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
            onProcessingCancel={handleExplicitCancel}
            onMessage={handleProcessingMessage}
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