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
import axiosInstance from '../axiosConfig';
import { Alert } from "../ui/alert";

const CONNECTION_CHECK_INTERVAL = 30000;
const SESSION_MESSAGES_KEY = 'stocksavvy_current_messages';

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
          <Chatbot isMobile={isMobile} />
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

  const [automationState, setAutomationState] = useState({
    isActive: false,
    currentStep: null,
    processedData: null
  });

  const [status, setStatus] = useState({
    isTyping: false,
    isOnline: true,
    authError: false,
    retryCount: 0,
    isRetrying: false,
    isProcessingFile: false
  });

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

  const handleProcessingError = (error) => {
    // Create a user-friendly error message
    const errorMessage = {
      type: 'bot',
      text: `I encountered an error while processing your document: ${
        error.response?.data?.message || error.message || 'Unknown error occurred'
      }. Please ensure your document is in the correct format and try again.`,
      isError: true,
      timestamp: new Date().toISOString()
    };

    // Add the error message to the chat
    setMessages(prev => [...prev, errorMessage]);

    // Reset the automation state
    setAutomationState(prev => ({
      ...prev,
      step: 'error',
      data: null
    }));
  };

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
  if (!automationState.isActive) {
    return handleRegularFileUpload(file);
  }

  setStatus(prev => ({ ...prev, isProcessingFile: true }));
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Initial processing message
    setMessages(prev => [...prev, {
      type: 'bot',
      text: "I'm analyzing your purchase order document. This will just take a moment...",
      timestamp: new Date().toISOString()
    }]);

    const response = await axiosInstance.post("/chatbot/process-file", formData);
    const { fileAnalysis, analysis } = response.data;
    const extractedItems = fileAnalysis?.metadata?.extractedItems || [];

    // Calculate financial details
    const subtotal = extractedItems.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    );
    const tax = subtotal * 0.06;
    const shipping = 500; // Default shipping
    const total = subtotal + tax + shipping;

    // Generate a more user-friendly response
    let analysisMessage = {
      type: 'bot',
      text: `I've reviewed your purchase order and found that we need to set up these batteries in your inventory system before we can process the order.

Here's what I found in your document:

${extractedItems.map(item => 
  `• ${item.productName}
   Quantity: ${item.quantity} units
   Unit Price: RM${parseFloat(item.price).toFixed(2)}
   Total: RM${(item.quantity * item.price).toFixed(2)}`
).join('\n\n')}

Financial Summary:
• Subtotal: RM${subtotal.toFixed(2)}
• Tax (6%): RM${tax.toFixed(2)}
• Shipping: RM${shipping.toFixed(2)}
• Total: RM${total.toFixed(2)}

To proceed, I can help you:
1. Add these batteries to your inventory system now
2. Save this as a draft purchase order and add the products later
3. Modify the order to use existing products

Which option would you prefer?`,
      fileAnalysis: fileAnalysis,
      actions: [
        {
          label: "Add to Inventory",
          action: "add_products",
          variant: "default"
        },
        {
          label: "Save as Draft",
          action: "save_draft",
          variant: "outline"
        },
        {
          label: "Modify Order",
          action: "modify_order",
          variant: "outline"
        }
      ],
      showPreview: true,
      timestamp: new Date().toISOString()
    };

    // Update messages with the new analysis
    setMessages(prev => [...prev, analysisMessage]);

    // Update automation state
    setAutomationState(prev => ({
      ...prev,
      step: 'product_decision',
      data: {
        extractedItems,
        analysis,
        financials: {
          subtotal,
          tax,
          shipping,
          total
        },
        pendingProducts: extractedItems.map(item => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }));

  } catch (error) {
    console.error('File processing error:', error);
    // Provide a more helpful error message
    setMessages(prev => [...prev, {
      type: 'bot',
      text: "I encountered an issue while processing your document. Would you like to try uploading it again, or should we create the purchase order manually?",
      actions: [
        {
          label: "Upload Again",
          action: "retry_upload",
          variant: "default"
        },
        {
          label: "Create Manually",
          action: "create_manual",
          variant: "outline"
        }
      ],
      isError: true,
      timestamp: new Date().toISOString()
    }]);
  } finally {
    setStatus(prev => ({ ...prev, isProcessingFile: false }));
  }
};

// Add helper function to handle the next steps
const handleNextStep = async (action) => {
  switch (action) {
    case 'add_products':
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Let's add the missing products to your inventory first. I'll guide you through the process for each product.",
        timestamp: new Date().toISOString()
      }]);
      setAutomationState(prev => ({
        ...prev,
        step: 'adding_products'
      }));
      break;
      
    case 'edit':
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "You can now edit any details of the purchase order. Click on the fields you want to modify.",
        timestamp: new Date().toISOString()
      }]);
      setAutomationState(prev => ({
        ...prev,
        step: 'editing'
      }));
      break;
      
    case 'proceed':
    case 'confirm':
      await handleConfirmPO(automationState.data);
      break;
      
    case 'cancel':
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I've cancelled the current process. Would you like to start over with a new purchase order?",
        timestamp: new Date().toISOString()
      }]);
      setAutomationState({
        isActive: false,
        step: null,
        data: null
      });
      break;
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

const handleConfirmPO = async (data) => {
  try {
    setStatus(prev => ({ ...prev, isProcessing: true }));
    
    setMessages(prev => [...prev, {
      type: 'bot',
      text: "Processing your purchase order...",
      timestamp: new Date().toISOString()
    }]);

    const response = await axiosInstance.post('/purchase/create', {
      vendorSn: data.vendorName,
      orderDate: data.poDate,
      paymentTerms: "Net 30",
      deliveryMethod: "Standard Shipping",
      totalAmount: data.grandTotal,
      itemsList: data.extractedItems.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        price: item.price
      }))
    });

    setMessages(prev => [...prev, {
      type: 'bot',
      text: `Purchase order has been successfully created!

Order Details:
• PO Number: ${response.data.purchase_order_id}
• Total Amount: RM${data.grandTotal.toFixed(2)}
• Items: ${data.extractedItems.length}

What would you like to do next?
1. View the purchase order details
2. Create another purchase order
3. Check inventory status`,
      timestamp: new Date().toISOString()
    }]);

    setAutomationState({
      isActive: false,
      step: null,
      data: null
    });

  } catch (error) {
    console.error('Error creating purchase order:', error);
    setMessages(prev => [...prev, {
      type: 'bot',
      text: 'Sorry, I encountered an error while processing the purchase order. Would you like to try again?',
      isError: true,
      timestamp: new Date().toISOString()
    }]);
  } finally {
    setStatus(prev => ({ ...prev, isProcessing: false }));
  }
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

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
      return;
    }

    setMessages(prev => [...prev, {
      type: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }]);

    if (await handleAutomationCommand(text)) {
      return;
    }

    setStatus(prev => ({ ...prev, isTyping: true }));

    if (text.toLowerCase().includes('automate purchase') || 
        text.toLowerCase().includes('create purchase order')) {
      handleAutomationCommand('start');
      return;
    }

    // Handle other automation commands
    if (automationState.isActive) {
      handleAutomationCommand(text);
      return;
    }

    try {
      // Check for automation commands first
      if (text.toLowerCase().includes('automate')) {
        await handleAutomate(text);
        setStatus(prev => ({ ...prev, isTyping: false }));
        return;
      }

      // Regular chat flow
      const response = await axiosInstance.post("/chatbot/chat", { message: text });
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.message,
        data: response.data.data,
        fileAnalysis: response.data.fileAnalysis,
        timestamp: new Date().toISOString()
      }]);
      
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        authError: false,
        retryCount: 0
      }));

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
          />
          <div ref={messageEndRef} />
        </div>

        <div className="flex-none bg-white border-t">
          <Input 
            onSend={send} 
            onFileUpload={handleFileUpload}
            disabled={!status.isOnline || status.authError || status.isRetrying}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;