const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ChatGPT API endpoint
router.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const botResponse = response.data.choices[0].message.content;
    res.json({ message: botResponse });
  } catch (error) {
    console.error('Error connecting to OpenAI API:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.response ? error.response.data : error.message 
    });
  }
});

module.exports = router;