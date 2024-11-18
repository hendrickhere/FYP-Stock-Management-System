const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const userService = require("../service/userService");
const path = require('path');
const fs = require('fs');
const db = require("../models");
const { Op } = require("sequelize");
const authMiddleware = require("../backend-middleware/authMiddleware");

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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;
    const username = req.user.username;
    
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
      max_tokens: 500
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

module.exports = router;