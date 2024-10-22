const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); 

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Specify the model
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
    res.status(500).json({ error: 'Internal Server Error', details: error.response ? error.response.data : error.message });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
