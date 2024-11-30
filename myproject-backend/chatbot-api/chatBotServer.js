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

const maxOutputTokens = 1000

// Rate limiting configuration moved to a separate object for better organization
const rateLimiter = {
    tokens: 0,
    lastReset: Date.now(),
    maxTokens: 30000,
    resetInterval: 60000,
    maxRequestSize: 15000,
    
    // Method to check and update rate limit
    async checkLimit(requiredTokens) {
        const now = Date.now();
        if (now - this.lastReset >= this.resetInterval) {
            this.tokens = 0;
            this.lastReset = now;
        }
        
        if (this.tokens + requiredTokens > this.maxTokens) {
            const waitTime = Math.ceil((this.resetInterval - (now - this.lastReset)) / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
        }
        
        this.tokens += requiredTokens;
    }
};

// Token estimation function
function estimateTokens(text, images = []) {
    // Rough estimation: 1 token ≈ 4 characters for text
    const textTokens = Math.ceil(text.length / 4);
    // Image tokens estimation (if any)
    const imageTokens = images.length * 1000; // Rough estimate per image
    return textTokens + imageTokens;
}

function generateAnalysisMessage(analysisResult) {
    const { metadata, groupedItems, financials } = analysisResult;
    let message = `I've analyzed your purchase order from ${metadata.vendorName}.\n\n`;
    
    // Start with a positive summary of what was found
    const totalItems = Object.values(groupedItems)
        .reduce((sum, group) => sum + group.length, 0);
    message += `📦 Found ${totalItems} items in the purchase order.\n\n`;

    // First mention products that are ready to process (if any)
    if (groupedItems.readyToProcess.length > 0) {
        message += `✅ ${groupedItems.readyToProcess.length} items are ready to process\n`;
    }

    // Mention new products as an action item, not an error
    if (groupedItems.newProducts.length > 0) {
        message += `📝 ${groupedItems.newProducts.length} new products need to be added to inventory:\n`;
        groupedItems.newProducts.forEach(product => {
            message += `   • ${product.productName}\n`;
        });
        message += "\n";
    }

    // Mention stock issues if any
    if (groupedItems.insufficientStock.length > 0) {
        message += `⚠️ ${groupedItems.insufficientStock.length} items need stock adjustment:\n`;
        groupedItems.insufficientStock.forEach(product => {
            message += `   • ${product.productName} (Current: ${product.currentStock}, Needed: ${product.quantity})\n`;
        });
        message += "\n";
    }

    // Add financial summary
    message += "💰 Financial Summary:\n";
    message += `• Subtotal: RM${financials.subtotal.toFixed(2)}\n`;
    message += `• Tax (6%): RM${financials.tax.toFixed(2)}\n`;
    message += `• Shipping: RM${financials.shipping.toFixed(2)}\n`;
    message += `• Total: RM${financials.grandTotal.toFixed(2)}\n\n`;

    // Add next steps based on what was found
    message += "📋 Next Steps:\n";
    if (groupedItems.newProducts.length > 0) {
        message += "1. Add the new products to inventory\n";
    }
    if (groupedItems.insufficientStock.length > 0) {
        message += `${groupedItems.newProducts.length > 0 ? '2' : '1'}. Update stock levels for insufficient items\n`;
    }
    message += `${groupedItems.readyToProcess.length > 0 ? 'Then proceed with processing the order' : 'Once completed, we can process the order'}`;

    return message;
}

async function validateExtractedData(data, models) {
    const warnings = [];
    const { Product, Vendor } = models;

    // Validate vendor
    if (data.vendor) {
        const vendor = await Vendor.findOne({ 
            where: { 
                vendor_name: { [Op.iLike]: `%${data.vendor.name}%` }
            }
        });
        if (!vendor) {
            warnings.push({
                field: 'vendor',
                message: 'Vendor not found in database'
            });
        }
    }

    // Validate items
    if (data.items) {
        for (const item of data.items) {
            const product = await Product.findOne({
                where: {
                    [Op.or]: [
                        { sku_number: item.sku },
                        { product_name: { [Op.iLike]: `%${item.name}%` }}
                    ]
                }
            });

            if (!product) {
                warnings.push({
                    field: 'item',
                    item: item.name,
                    message: 'Product not found in database'
                });
            }
        }
    }

    // Validate required fields based on document type
    const requiredFields = {
        purchase_order: ['vendor', 'items', 'metadata.date'],
        invoice: ['vendor', 'items', 'metadata.date'],
        delivery_note: ['vendor', 'items']
    };

    if (data.documentType in requiredFields) {
        for (const field of requiredFields[data.documentType]) {
            if (!getNestedValue(data, field)) {
                warnings.push({
                    field,
                    message: 'Required field missing'
                });
            }
        }
    }

    return {
        hasWarnings: warnings.length > 0,
        warnings,
        suggestedActions: generateSuggestedActions(warnings)
    };
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

// Helper to extract actions from AI response
function extractActions(response) {
    const actions = [];
    
    if (response.toLowerCase().includes('upload')) {
        actions.push('upload');
    }
    if (response.toLowerCase().includes('confirm')) {
        actions.push('confirm');
    }
    // Add more action detection as needed

    return actions;
}

// Helper function for inventory insights
async function getInventoryInsights(username) {
  try {
    const allInventory = await userService.getAllInventory(username);
    
    const insights = {
      lowStockItems: [],
      expiringItems: [],
      totalValue: 0,
      productCount: allInventory.length,
      categories: {},
      recentMovement: []
    };
    
    allInventory.forEach(item => {
      // Track low stock
      if (item.product_stock < 10) {
        insights.lowStockItems.push({
          name: item.product_name,
          sku: item.sku_number,
          stock: item.product_stock,
          reorderPoint: 10 
        });
      }
      
      // Track expiring items
      if (item.is_expiry_goods && item.expiry_date) {
        const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          insights.expiringItems.push({
            name: item.product_name,
            sku: item.sku_number,
            expiryDate: item.expiry_date,
            daysRemaining: daysUntilExpiry
          });
        }
      }
      
      // Calculate total value
      insights.totalValue += item.price * item.product_stock;
      
      // Group by manufacturer
      if (!insights.categories[item.manufacturer]) {
        insights.categories[item.manufacturer] = {
          count: 0,
          totalValue: 0
        };
      }
      insights.categories[item.manufacturer].count++;
      insights.categories[item.manufacturer].totalValue += item.price * item.product_stock;
    });

    return insights;
  } catch (error) {
    console.error('Error getting inventory insights:', error);
    throw error;
  }
}

// File processing endpoint
router.post('/process-file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get username from auth middleware
        const username = req.user.username;

        // Process the document using the document processor
        const processingResult = await documentProcessor.processDocument(req.file);
        
        // Ensure we have items to process
        if (!processingResult.extractedItems?.length) {
            throw new Error('No valid items extracted from document');
        }

        // Classify the extracted items using userService
        const groupedItems = await classifyItems(processingResult.extractedItems, username);
        
        const analysisResult = {
            metadata: processingResult.metadata,
            groupedItems,
            financials: processingResult.financials,
            warnings: [],
            suggestedActions: []
        };

        // Add warnings based on classification results
        if (groupedItems.newProducts.length > 0) {
            analysisResult.warnings.push({
                type: 'new_products',
                message: `${groupedItems.newProducts.length} new products need to be added`,
                items: groupedItems.newProducts
            });
        }

        if (groupedItems.insufficientStock.length > 0) {
            analysisResult.warnings.push({
                type: 'insufficient_stock',
                message: `${groupedItems.insufficientStock.length} products have insufficient stock`,
                items: groupedItems.insufficientStock
            });
        }

        res.json({
            success: true,
            analysisResult,
            message: generateAnalysisMessage(analysisResult),
            nextSteps: determineNextSteps(groupedItems),
            suggestedActions: generateSuggestedActions(groupedItems, analysisResult.warnings)
        });

    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            explanation: generateErrorExplanation(error)
        });
    }
});

async function classifyItems(items, username) {
    if (!Array.isArray(items)) {
        console.warn('Invalid items input:', items);
        return {
            newProducts: [],
            insufficientStock: [],
            readyToProcess: []
        };
    }

    try {
        const groupedItems = {
            newProducts: [],      // Products that need to be added to inventory
            insufficientStock: [], // Products with insufficient stock
            readyToProcess: []    // Products ready for processing
        };

        for (const item of items) {
            try {
                const existingProduct = await userService.findProductBySku(item.sku);
                
                if (!existingProduct) {
                    console.log(`Product with SKU ${item.sku} not found - will need to be added`);
                    groupedItems.newProducts.push({
                        ...item,
                        suggestedSku: item.sku,
                        manufacturer: item.productType.includes('Truck') ? 'Truck Battery Co.' : 'Car Battery Co.',
                        category: `${item.productType} Battery`,
                        initialStock: item.quantity
                    });
                    continue;
                }

                // Check stock levels
                if (existingProduct.product_stock < item.quantity) {
                    console.log(`Insufficient stock for SKU ${item.sku}`);
                    groupedItems.insufficientStock.push({
                        ...item,
                        currentStock: existingProduct.product_stock,
                        shortageAmount: item.quantity - existingProduct.product_stock,
                        productId: existingProduct.product_id
                    });
                    continue;
                }

                // Product exists and has sufficient stock
                groupedItems.readyToProcess.push({
                    ...item,
                    productId: existingProduct.product_id,
                    currentStock: existingProduct.product_stock
                });

            } catch (error) {
                console.error(`Error processing item ${item.sku}:`, error);
            }
        }

        return groupedItems;

    } catch (error) {
        console.error('Error in classifyItems:', error);
        throw new Error('System error while classifying items: ' + error.message);
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

function generateProcessingResponse(analysisResult) {
  const { metadata, groupedItems, financials, warnings } = analysisResult;
  
  let message = `I've analyzed your purchase order from ${metadata.vendorName} dated ${metadata.poDate}.\n\n`;
  
  // Add financial summary
  message += "💰 Financial Summary:\n";
  message += `• Subtotal: RM${financials.subtotal.toFixed(2)}\n`;
  message += `• Tax (6%): RM${financials.tax.toFixed(2)}\n`;
  message += `• Shipping: RM${financials.shipping.toFixed(2)}\n`;
  message += `• Total: RM${financials.grandTotal.toFixed(2)}\n\n`;
  
  // Add item summary
  const totalItems = Object.values(groupedItems).reduce((sum, group) => sum + group.length, 0);
  message += `📦 Found ${totalItems} items in total:\n`;
  
  if (groupedItems.readyToProcess.length > 0) {
    message += `• ${groupedItems.readyToProcess.length} items ready for processing\n`;
  }
  if (groupedItems.newProducts.length > 0) {
    message += `• ${groupedItems.newProducts.length} new products to be added\n`;
  }
  if (groupedItems.insufficientStock.length > 0) {
    message += `• ${groupedItems.insufficientStock.length} items with insufficient stock\n`;
  }

  // Determine next steps
  const nextSteps = determineNextSteps(groupedItems);
  
  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(groupedItems, warnings);

  return {
    message,
    nextSteps,
    suggestedActions
  };
}

// Determine next steps based on analysis
function determineNextSteps(groupedItems) {
    const steps = [];
    
    if (groupedItems.newProducts.length > 0) {
        steps.push({
            type: 'add_products',
            description: 'Add new products to inventory',
            items: groupedItems.newProducts
        });
    }
    
    if (groupedItems.insufficientStock.length > 0) {
        steps.push({
            type: 'review_stock',
            description: 'Review and update stock levels',
            items: groupedItems.insufficientStock
        });
    }
    
    if (groupedItems.readyToProcess.length > 0) {
        steps.push({
            type: 'process_order',
            description: 'Process purchase order',
            items: groupedItems.readyToProcess
        });
    }
    
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
    
    if (groupedItems.insufficientStock.length > 0) {
        actions.push({
            type: 'update_stock',
            label: 'Update Stock Levels',
            priority: 'high'
        });
    }
    
    // Always add review action
    actions.push({
        type: 'review',
        label: 'Review Details',
        priority: 'normal'
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

async function getMinimalContext(message, username) {
    const contextData = {};
    const queryType = message.toLowerCase();
    
    if (queryType.includes('stock') || queryType.includes('inventory')) {
        const inventory = await userService.getAllInventory(username);
        contextData.inventory = inventory.slice(0, 10); // Limit to 10 items
    }
    
    return contextData;
}

module.exports = router;