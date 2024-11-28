const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const userService = require("../service/userService");
const path = require('path');
const fs = require('fs');
const db = require("../models");
const { Op } = require("sequelize");
const authMiddleware = require("../backend-middleware/authMiddleware");
const multer = require('multer');
const PDFParser = require('pdf-parse');
const { 
  processDocument,
  extractTextFromImage,
  extractTextFromPDF,
  parseInventoryInfo 
} = require('./documentProcessor');
const chatbotIntelligence = require('./chatBotIntelligence');

// Environment setup
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

console.log('Environment loaded from:', envPath);
console.log('API Key present:', !!process.env.OPENAI_API_KEY);

const SYSTEM_PROMPT = `You are StockSavvy, an intelligent inventory management assistant. You can:
1. Process and analyze purchase orders
2. Provide inventory insights
3. Answer questions about stock management
4. Guide users through business processes

For purchase orders:
- Extract and validate item details
- Calculate totals and taxes
- Generate summaries
- Guide users through confirmation

Format responses professionally using markdown.
If you can't help with something, explain why and suggest alternatives.`;

const chatCompletion = async (messages, contextData = {}) => {
    const systemMessage = {
        role: "system",
        content: SYSTEM_PROMPT + (contextData ? `\nCurrent context: ${JSON.stringify(contextData)}` : '')
    };

    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [systemMessage, ...messages],
        temperature: 0.7
    });

    return response.choices[0].message.content;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const parseItems = (text) => {
  const items = [];
  const lines = text.split('\n');
  
  // Regular expression to match item patterns
  const itemPattern = /(\d{3})\s+([\w\s-]+)\s+(\d+)\s+(\d+\.\d{2})\s+(\d+(?:\.\d{2})?)/g;
  
  // Find all matches in the text
  let match;
  while ((match = itemPattern.exec(text)) !== null) {
    try {
      const item = {
        sku: `PO-${match[1]}`,
        productName: match[2].trim(),
        quantity: parseInt(match[3]),
        price: parseFloat(match[4]),
        total: parseFloat(match[5])
      };
      
      // Validate the item data
      if (item.quantity > 0 && item.price > 0 && item.total > 0) {
        items.push(item);
      }
    } catch (error) {
      console.error('Error parsing item:', error);
    }
  }

  return items;
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const maxOutputTokens = 1000

// Rate limiting configuration
const rateLimiter = {
    tokens: 0,
    lastReset: Date.now(),
    maxTokens: 30000, // OpenAI's limit per minute
    resetInterval: 60000, // 1 minute in milliseconds
    maxRequestSize: 15000 // Safe limit for single request
};

// Token estimation function
function estimateTokens(text, images = []) {
    // Rough estimation: 1 token ≈ 4 characters for text
    const textTokens = Math.ceil(text.length / 4);
    // Image tokens estimation (if any)
    const imageTokens = images.length * 1000; // Rough estimate per image
    return textTokens + imageTokens;
}

const processFile = async (file) => {
  try {
    if (file.mimetype === 'application/pdf') {
      // Add options to handle problematic PDFs
      const options = {
        pagerender: render_page,
        max: 2, // Process max 2 pages
        version: 'v2.0.550'  // Use newer PDF.js version
      };

      // Function to handle page rendering
      function render_page(pageData) {
        let render_options = {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(render_options)
          .then(function(textContent) {
            let text = "";
            for (let item of textContent.items) {
              text += item.str + " ";
            }
            return text;
          });
      }

      // Process the PDF with error handling
      const dataBuffer = file.buffer;
      let pdfData;
      
      try {
        pdfData = await new Promise((resolve, reject) => {
          PDFParser(dataBuffer, options).then(function(data) {
            resolve(data);
          }).catch(function(error) {
            // Try alternate parsing method if first fails
            const pdf = require('pdf-parse');
            return pdf(dataBuffer).then(data => resolve(data));
          });
        });
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        throw new Error('Unable to parse PDF. Please ensure the file is not corrupted.');
      }

      // Extract text content
      const textContent = pdfData.text || '';

      // Parse items using more flexible regex pattern
      const items = [];
      const itemRegex = /(\d{3})\s*(Car|Truck)\s*Battery\s*-\s*Model\s*([A-Z]\d+)\s*(\d+)\s*(\d+(?:\.\d{2})?)/g;
      
      let match;
      while ((match = itemRegex.exec(textContent)) !== null) {
        const item = {
          sku: `BAT-${match[3]}`,
          productName: `${match[2]} Battery - Model ${match[3]}`,
          quantity: parseInt(match[4]),
          price: parseFloat(match[5]),
          total: parseInt(match[4]) * parseFloat(match[5])
        };
        items.push(item);
      }

      // Extract PO metadata
      const poNumber = textContent.match(/PO Number:\s*([\w-]+)/)?.[1] || '';
      const poDate = textContent.match(/Date:\s*([\d\s\w]+)/)?.[1] || '';
      const vendorName = textContent.match(/Vendor Name:\s*([^\\n]+)/)?.[1] || '';

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.06; // 6% tax rate from PO
      const shipping = 500.00; // From PO
      const grandTotal = subtotal + tax + shipping;

      const metadata = {
        poNumber,
        poDate,
        vendorName,
        extractedItems: items,
        subtotal,
        tax,
        shipping,
        grandTotal
      };

      return {
        content: generateAnalysis(metadata),
        metadata,
        success: true
      };

    } else {
      throw new Error('Unsupported file type. Please upload a PDF file.');
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error(`Error processing file: ${error.message}`);
  }
};

const generateAnalysis = (result) => {
  // Ensure we're accessing the correct data structure
  const items = result.extractedItems || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.06;
  const shipping = 500.00;
  const grandTotal = subtotal + tax + shipping;

  const itemDetails = items.map(item => 
    `   • ${item.productName}: ${item.quantity} units at RM${item.price.toFixed(2)} each (Total: RM${(item.quantity * item.price).toFixed(2)})`
  ).join('\n');

  return {
    analysis: `I've analyzed your purchase order document. Here's what I found:

1. Number of items: ${items.length}
2. Items detail:
${itemDetails}

3. Summary:
   • Subtotal: RM${subtotal.toFixed(2)}
   • Tax (6%): RM${tax.toFixed(2)}
   • Shipping: RM${shipping.toFixed(2)}
   • Grand Total: RM${grandTotal.toFixed(2)}`,
    metadata: { items, subtotal, tax, shipping, grandTotal }
  };
};

// Update the itemRegex pattern in processFile function:
const itemRegex = /(\d{3})\s+(Car|Truck)\s*Battery\s*-\s*Model\s*([A-Z0-9]+)\s*(\d+)\s*(\d+(?:\.\d{2})?)\s*(\d+(?:\.\d{2})?)/g;

async function checkRateLimit(requiredTokens) {
    const now = Date.now();
    
    // Reset tokens if interval passed
    if (now - rateLimiter.lastReset >= rateLimiter.resetInterval) {
        rateLimiter.tokens = 0;
        rateLimiter.lastReset = now;
    }
    
    // Check if single request is too large
    if (requiredTokens > rateLimiter.maxRequestSize) {
        throw new Error(`Request too large. Maximum allowed tokens per request is ${rateLimiter.maxRequestSize}`);
    }
    
    // Check if we would exceed rate limit
    if (rateLimiter.tokens + requiredTokens > rateLimiter.maxTokens) {
        const waitTime = rateLimiter.resetInterval - (now - rateLimiter.lastReset);
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime/1000)} seconds. Required tokens: ${requiredTokens}, Remaining capacity: ${rateLimiter.maxTokens - rateLimiter.tokens}`);
    }
    
    // If we reach here, update token count
    rateLimiter.tokens += requiredTokens;
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
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        // Use chatbotIntelligence to process the file
        const conversationId = req.user.user_id;
        const result = await chatbotIntelligence.analyzeDocument(req.file, conversationId);

        if (result.success) {
            res.json({
                success: true,
                message: result.explanation,
                analysis: result.analysis,
                suggestedActions: result.suggestedActions
            });
        } else {
            res.status(422).json({
                success: false,
                error: result.error,
                explanation: result.explanation
            });
        }

    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error processing file'
        });
    }
});

// Chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const username = req.user.username;
        const conversationId = req.user.user_id;

        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Use chatbotIntelligence for chat handling
        const response = await chatbotIntelligence.handleUserResponse(
            conversationId,
            message,
            { username }
        );

        res.json({
            success: true,
            message: response.message,
            suggestedActions: response.suggestedActions,
            context: response.context
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing chat request'
        });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Chatbot error:', error);
    
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: 'File upload error: ' + error.message
        });
    }

    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
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