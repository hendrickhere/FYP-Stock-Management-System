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
const { processDocument } = require('./documentProcessor');

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
        // First process the document with OCR
        const { extractedItems, metadata } = await processDocument(file);
        
        // If no items were extracted, throw an error
        if (!extractedItems || extractedItems.length === 0) {
            console.error('No items extracted from document');
            throw new Error('Could not extract any items from the document. Please check the format.');
        }

        console.log('Extracted items:', extractedItems);

        // Create a concise prompt for OpenAI that includes the full context
        const promptText = `Analyze this purchase order:
        Items:
        ${extractedItems.map(item => 
            `- ${item.productName} (SKU: ${item.sku}): ${item.quantity} units at RM${item.price}`
        ).join('\n')}

        Total items: ${extractedItems.length}
        Total value: RM${extractedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}

        Provide a brief analysis of these items, focusing on:
        1. Stock level implications
        2. Any notable quantities or values
        3. Suggested actions for inventory management`;

        // Get OpenAI analysis with minimal tokens
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a stock management assistant analyzing a purchase order. Give specific, actionable insights about the items and quantities."
                },
                {
                    role: "user",
                    content: promptText
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        });

        return {
            content: response.choices[0].message.content,
            metadata: {
                ...metadata,
                extractedItems,
                totalItems: extractedItems.length,
                totalValue: extractedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        };
    } catch (error) {
        console.error('File processing error:', error);
        throw new Error(`Error processing file: ${error.message}`);
    }
};

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

router.post('/process-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.originalname);
    
    // Single call to processFile which now handles both OCR and OpenAI analysis
    const { content, metadata } = await processFile(req.file);

    res.json({
      success: true,
      message: content,
      fileAnalysis: { metadata }
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error processing file'
    });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;
    const username = req.user.username;
    const estimatedTokens = estimateTokens(userMessage) + 500; // Message + buffer
    await checkRateLimit(estimatedTokens);
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize empty contextData
    let contextData = {};
    
    // Check message type and get only relevant data
    if (/low stock|reorder|running out/i.test(userMessage)) {
      const allInventory = await userService.getAllInventory(username);
      contextData.lowStockItems = allInventory
        .filter(item => item.product_stock < 10)
        .map(item => ({
          name: item.product_name,
          sku: item.sku_number,
          stock: item.product_stock,
          reorderPoint: 10
        }));
    }
    
    else if (/expir(y|ing)|expire/i.test(userMessage)) {
      const allInventory = await userService.getAllInventory(username);
      contextData.expiringItems = allInventory
        .filter(item => {
          if (item.is_expiry_goods && item.expiry_date) {
            const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30;
          }
          return false;
        })
        .map(item => ({
          name: item.product_name,
          sku: item.sku_number,
          expiryDate: item.expiry_date,
          daysRemaining: Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
        }));
    }
    
    else if (/total value|inventory value/i.test(userMessage)) {
      const allInventory = await userService.getAllInventory(username);
      contextData.totalValue = allInventory.reduce((sum, item) => sum + (item.price * item.product_stock), 0);
      contextData.productCount = allInventory.length;
    }
    
    else if (/distribution|manufacturer|brand/i.test(userMessage)) {
      const allInventory = await userService.getAllInventory(username);
      contextData.categories = allInventory.reduce((acc, item) => {
        if (!acc[item.manufacturer]) {
          acc[item.manufacturer] = {
            count: 0,
            totalValue: 0
          };
        }
        acc[item.manufacturer].count++;
        acc[item.manufacturer].totalValue += item.price * item.product_stock;
        return acc;
      }, {});
    }

    const systemPrompt = `You are StockSavvy, an intelligent stock management assistant with access to real-time inventory data.
    ${contextData ? `Current inventory insights: ${JSON.stringify(contextData)}` : ''}
    
    Provide clear, actionable insights about ONLY the specific information requested.
    Focus on the exact query and avoid including unrelated inventory information.
    Format your responses in a professional and easy-to-read manner using markdown.
    When mentioning numbers, use proper formatting (e.g., RM 1,234.56 for currency).
    
    If asked about specific products or data that isn't available in the current context,
    acknowledge the limitation and suggest what information would be helpful.
    
    Current user: ${username}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {"role": "system", "content": systemPrompt},
        {"role": "user", "content": userMessage}
      ],
      temperature: 0.7,
      max_tokens: maxOutputTokens
    });

    res.json({
      success: true,
      message: completion.choices[0].message.content,
      data: contextData
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error processing your request'
    });
  }
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