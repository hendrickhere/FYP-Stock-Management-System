const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const userService = require("../service/userService");
const { Op } = require("sequelize");
const authMiddleware = require("../backend-middleware/authMiddleware");
const multer = require('multer');
const PDFParser = require('pdf-parse');
const { createChatbotServices } = require('./serviceFactory');
const services = createChatbotServices();
const { documentProcessor, chatbotService, chatbotIntelligence } = services;
const conversations = new Map();

const SYSTEM_PROMPT = `You are StockSavvy, an intelligent inventory management assistant specializing in purchase order analysis. Your tasks include:

DOCUMENT ANALYSIS CAPABILITIES:
1. Purchase Order Structure Recognition:
   - Identify standard PO components (header, line items, totals)
   - Extract vendor information and payment terms
   - Recognize item specifications and pricing

2. Product Information Extraction:
   - Parse battery model numbers in format "BAT-[MODEL]"
   - Identify product categories (Car Battery, Truck Battery)
   - Extract quantities, unit prices, and totals
   - Validate price calculations

3. Validation Rules:
   - Verify total = quantity × unit price
   - Check for reasonable quantity ranges (1-1000)
   - Validate price ranges (100-10000)
   - Ensure model numbers follow standard formats

RESPONSE GUIDELINES:
1. Always provide structured analysis:
   - Product details with confidence scores
   - Financial calculations with verification
   - Identified issues or discrepancies
   - Suggested actions for resolution

2. When reporting issues:
   - Explain the specific problem
   - Provide the relevant section from the document
   - Suggest potential corrections
   - List required actions

3. Format responses with:
   - Clear section headings
   - Itemized findings
   - Highlighted warnings
   - Actionable next steps

Current context: {contextData}`;

// Usage in chat completion
const chatCompletion = async (messages, contextData = {}) => {
    const systemMessage = {
        role: "system",
        content: ENHANCED_SYSTEM_PROMPT.replace('{contextData}', 
            JSON.stringify(contextData, null, 2))
    };

    return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
    });
};

// Configure file upload settings with error handling
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'), false);
        }
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function generateAnalysisMessage(analysisResult) {
    const { metadata, items, financials } = analysisResult;
    
    let message = `I've analyzed your purchase order from ${metadata.vendorName}.\n\n`;
    
    // First check if all products exist in our system
    if (items.newProducts.length > 0) {
        message += `⚠️ Before recording this purchase order, ${items.newProducts.length} products need to be added to our inventory system first:\n`;
        items.newProducts.forEach(product => {
            message += `   • ${product.productName} (will be recorded with quantity: ${product.orderQuantity})\n`;
        });
        message += "\nPlease add these products to the inventory system before proceeding.\n\n";
    } else {
        message += `✅ All products are registered in the inventory system. We can create the purchase order immediately.\n\n`;
    }

    // Show all products from the purchase order document
    message += `📦 Purchase Order Details:\n`;
    items.existingProducts.forEach(product => {
        message += `   • ${product.productName}: ${product.orderQuantity} units\n`;
    });
    message += "\n";

    // Financial summary
    message += "💰 Order Summary:\n";
    message += `• Subtotal: RM${financials.subtotal}\n`;
    message += `• Tax (6%): RM${financials.tax}\n`;
    message += `• Shipping: RM${financials.shipping}\n`;
    message += `• Total: RM${financials.total}\n`;

    return message;
}

async function getContextData(message, username) {
    const contextData = {};
    
    if (message.toLowerCase().includes('inventory') || 
        message.toLowerCase().includes('stock')) {
        contextData.inventory = await userService.getAllInventory(username);
    }
    
    if (message.toLowerCase().includes('purchase') || 
        message.toLowerCase().includes('order')) {
        contextData.recentOrders = await userService.getRecentPurchaseOrders(username);
    }

    return contextData;
}

// File processing endpoint
router.post('/process-file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        // Process the document
        const processingResult = await documentProcessor.processDocument(req.file);
        
        // Validate the processing result
        if (!processingResult?.success || !processingResult?.analysisResult) {
            throw new Error('Document processing failed to return valid results');
        }

        // Generate response using the analysis result directly
        const response = {
            success: true,
            analysisResult: processingResult.analysisResult,  // Pass the entire analysis result
            message: generateAnalysisMessage(processingResult.analysisResult),  // Pass just the analysis result part
            nextSteps: determineNextSteps(processingResult.analysisResult.items),
            suggestedActions: generateSuggestedActions(processingResult.analysisResult.items)
        };

        res.json(response);

    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code || 'PROCESSING_ERROR',
            explanation: generateErrorExplanation(error)
        });
    }
});

async function classifyItems(items, username) {
    // First, add defensive validation
    if (!items) {
        console.warn('Items parameter is undefined or null');
        return {
            newProducts: [],
            existingProducts: []  
        };
    }

    // Ensure items is an array
    if (!Array.isArray(items)) {
        console.warn('Invalid items input:', items);
        return {
            newProducts: [],
            existingProducts: []  
        };
    }

    try {
        // The items should already be classified by DocumentProcessor
        // Just need to format them properly for the response
        const groupedItems = {
            newProducts: items.filter(item => !item.productId),
            existingProducts: items.filter(item => item.productId)
        };

        // Add any additional business logic here
        // For example, checking stock levels
        groupedItems.existingProducts = groupedItems.existingProducts.map(item => {
            const hasEnoughStock = item.currentStock >= item.quantity;
            return {
                ...item,
                stockStatus: hasEnoughStock ? 'sufficient' : 'insufficient',
                stockDifference: hasEnoughStock ? 0 : item.quantity - item.currentStock
            };
        });

        return groupedItems;

    } catch (error) {
        console.error('Error in classifyItems:', error);
        throw new Error('System error while classifying items: ' + error.message);
    }
}

async function createPurchaseOrder(orderData, groupedItems) {
    // Start transaction
    const transaction = await db.sequelize.transaction();
    
    try {
        const purchaseOrder = await db.PurchaseOrder.create({
            vendor_id: orderData.vendorId,
            order_date: new Date(),
            total_amount: orderData.totalAmount,
            status_id: 1, // Initial status
            payment_terms: orderData.paymentTerms,
            delivery_method: orderData.deliveryMethod,
            user_id: orderData.userId,
            subtotal: orderData.subtotal,
            total_tax: orderData.totalTax,
            grand_total: orderData.grandTotal
        }, { transaction });

        // Create PO items for both new and existing products
        const poItems = [...groupedItems.newProducts, ...groupedItems.existingProducts]
            .map(item => ({
                purchase_order_id: purchaseOrder.purchase_order_id,
                product_id: item.productId || null,  // Will be null for new products
                quantity: item.quantity,
                unregistered_quantity: item.quantity, // All items start as unregistered
                total_price: item.price * item.quantity,
                tax: item.tax || 0,
                discount: item.discount || 0
            }));

        await db.PurchaseOrderItem.bulkCreate(poItems, { transaction });
        
        await transaction.commit();
        return purchaseOrder;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function processPurchaseOrder(orderData, groupedItems, username) {
    const transaction = await db.sequelize.transaction();
    
    try {
        // First add any new products to inventory
        if (groupedItems.newProducts.length > 0) {
            const newProducts = await db.Product.bulkCreate(
                groupedItems.newProducts.map(product => ({
                    ...product,
                    product_stock: 0, // Initial stock is 0
                    user_id: username,
                    status_id: 1 // Active status
                })),
                { transaction }
            );
            
            // Update groupedItems with new product IDs
            groupedItems.existingProducts.push(...newProducts.map(p => ({
                ...p.toJSON(),
                quantity: groupedItems.newProducts.find(np => np.sku === p.sku_number).quantity
            })));
        }

        // Create purchase order
        const purchaseOrder = await createPurchaseOrder(orderData, groupedItems, transaction);

        await transaction.commit();
        return purchaseOrder;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const username = req.user.username;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get services from request object
        const { chatbotIntelligence } = req.services;

        // Get context for the chat
        const contextData = await getContextData(message, username);

        // Get response from chatbot
        const response = await chatbotIntelligence.handleUserMessage(message, contextData);

        res.json({
            success: true,
            message: response.message,
            suggestions: response.suggestions
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Process purchase order endpoint
router.post('/process-order', authMiddleware, async (req, res) => {
    try {
        const { orderData, groupedItems } = req.body;
        const username = req.user.username;

        const purchaseOrder = await processPurchaseOrder(orderData, groupedItems, username);

        res.json({
            success: true,
            purchaseOrder,
            message: 'Purchase order created successfully'
        });

    } catch (error) {
        console.error('Purchase order processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Determine next steps based on analysis
function determineNextSteps(groupedItems) {
    const steps = [];
    
    if (groupedItems.newProducts.length > 0) {
        steps.push({
            type: 'add_products',
            description: 'Add new products to inventory system',
            items: groupedItems.newProducts
        });
    }
    
    steps.push({
        type: 'review_order',
        description: 'Review purchase order details',
        items: [...groupedItems.newProducts, ...groupedItems.existingProducts]
    });
    
    return steps;
}

// Generate suggested actions based on analysis
function generateSuggestedActions(groupedItems, warnings) {
    const actions = [];
    
    if (groupedItems.newProducts.length > 0) {
        actions.push({
            type: 'add_products',
            label: 'Add New Products',
            priority: 'high'
        });
    }
    
    // Replace stock update action with review action
    actions.push({
        type: 'review_order',
        label: 'Review Purchase Order',
        priority: groupedItems.newProducts.length > 0 ? 'normal' : 'high'
    });

    actions.push({
        type: 'confirm_order',
        label: 'Confirm Purchase Order',
        priority: 'normal',
        disabled: groupedItems.newProducts.length > 0 // Disable until new products are added
    });
    
    return actions;
}

// Generate error explanations
function generateErrorExplanation(error) {
  const errorTypes = {
    'VALIDATION_ERROR': 'There were issues validating the purchase order data',
    'PROCESSING_ERROR': 'There was an error processing the document',
    'STOCK_ERROR': 'There were issues with stock levels',
    'DEFAULT': 'An unexpected error occurred'
  };

  const errorType = error.code || 'DEFAULT';
  return `${errorTypes[errorType]}: ${error.message}`;
}

// Helper function to get context data for chat
async function getContextData(message, username) {
    const contextData = {};
    
    if (message.toLowerCase().includes('inventory') || 
        message.toLowerCase().includes('stock')) {
        contextData.inventory = await userService.getAllInventory(username);
    }
    
    return contextData;
}

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Chatbot server error:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        type: err.type || 'server_error'
    });
});

module.exports = router;