const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const userService = require("../service/userService");
const { Op } = require("sequelize");
const authMiddleware = require("../backend-middleware/authMiddleware");
const { chatbotServiceMiddleware } = require("../backend-middleware/chatbotServiceMiddleware");
const multer = require('multer');
const PDFParser = require('pdf-parse');
const { createChatbotServices } = require('./serviceFactory');
const services = createChatbotServices();
const db = require('../models');
const conversations = new Map();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

router.use(async (req, res, next) => {
    try {
        // Check database connection
        await db.sequelize.authenticate();
        next();
    } catch (error) {
        console.error('Unable to connect to database:', error);
        return res.status(500).json({
            success: false,
            error: 'Database connection error'
        });
    }
});

router.use(authMiddleware);
router.use(chatbotServiceMiddleware);

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

// File processing endpoint
router.post('/process-file', authMiddleware, chatbotServiceMiddleware, upload.single('file'), async (req, res) => {
    try {

        console.log('Processing file request started');
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        console.log('Request state:', {
            hasServices: !!req.services,
            hasDocumentProcessor: req.services && !!req.services.documentProcessor,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        if (!req.services) {
            throw new Error('Services not found on request object');
        }

        if (!req.services.documentProcessor) {
            throw new Error('DocumentProcessor not found in services');
        }

        // Process the document
        const { documentProcessor } = req.services;

        if (typeof documentProcessor.processDocument !== 'function') {
            throw new Error('processDocument is not a function');
        }

        console.log('Starting document processing');

        const processingResult = await documentProcessor.processDocument(req.file);
        
        console.log('Document processing completed:', {
            success: !!processingResult,
            hasAnalysis: !!processingResult?.analysisResult
        });

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
            console.error('Route handler error:', {
                message: error.message,
                stack: error.stack,
                requestServices: req.services ? Object.keys(req.services) : 'no services',
                fileInfo: req.file ? {
                    mimetype: req.file.mimetype,
                    size: req.file.size
                } : 'no file'
            });

            res.status(500).json({
                success: false,
                error: error.message,
                code: 'PROCESSING_ERROR'
            });
    }
});

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

        // Get services from middleware
        const { chatbotIntelligence } = req.services;
        
        // Validate chatbotIntelligence service
        if (!chatbotIntelligence || typeof chatbotIntelligence.handleUserResponse !== 'function') {
            throw new Error('Chat service not properly initialized');
        }

        const response = await chatbotIntelligence.handleUserResponse(username, message);

        res.json({
            success: true,
            message: response.message,
            data: response.data,
            suggestions: response.suggestions
        });

    } catch (error) {
        console.error('Chat error:', {
            message: error.message,
            stack: error.stack,
            serviceStatus: req.services ? 'initialized' : 'not initialized'
        });
        
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


// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Chatbot server error:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        type: err.type || 'server_error'
    });
});

module.exports = router;