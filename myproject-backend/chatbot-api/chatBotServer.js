const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const path = require('path');
const fs = require('fs');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Add debug logging
console.log('Environment loaded from:', envPath);
console.log('API Key present:', !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ChatGPT API endpoint
router.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {"role": "system", "content": "You are an assistant in helping user to find out stock level and ledger. Avoid answering unrelated questions."},
        {"role": "user", "content": userMessage}
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    // Extract the response from the completion
    const botResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      message: botResponse
    });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Error processing your request'
    });
  }
});

module.exports = router;