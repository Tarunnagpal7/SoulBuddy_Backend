require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendURL = process.env.FRONTEND_URL;

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Remove any trailing slashes from the origin
  const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';

  res.header('Access-Control-Allow-Origin', cleanOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// CORS configuration for your frontend
app.use(cors({
  origin: (origin, callback) => {
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : '';
    callback(null, cleanOrigin);
  },
  credentials: true
}));

// Route handler for the astrologer endpoint
app.post('/api/astrologer', async (req, res) => {
  try {
    const { name, gender, date, month, year, hour, minute, state, city } = req.body;

    // Validate required fields
    if (!name || !gender || !date || !month || !year || !hour || !minute || !state || !city) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  

    // Get the LangFlow API token from environment variables
    const apiToken = process.env.LANGFLOW_API_TOKEN;
    if (!apiToken) {
      return res.status(500).json({ error: 'API token not configured' });
    }

    // Dynamically create the message string
    const message = `
      My name is ${name},
      My Day of Birth is ${date}-${month}-${year},
      Time of my birth is ${hour}:${minute},
      I live in ${city} of state ${state}
    `;

    // Prepare request payload for LangFlow API
    const payload = {
      input_value: message,
      output_type: 'chat',
      input_type: 'chat',
      tweaks: {
        "ChatInput-HZc7X": {},
        "ParseData-BGx54": {},
        "Prompt-I5txs": {},
        "SplitText-NYSX1": {},
        "OpenAIModel-MsrVd": {},
        "ChatOutput-Kp9Il": {},
        "AstraDB-dDc5d": {},
        "OpenAIEmbeddings-g1gFq": {},
        "AstraDB-QCLBQ": {},
        "OpenAIEmbeddings-yswla": {},
        "File-QzQnI": {}
      }
    };

    // Make the request to the LangFlow API
    const response = await axios({
      method: 'POST',
      url: "https://api.langflow.astra.datastax.com/lf/ba9544c6-3c50-4e41-b3cf-7aeb2789beeb/api/v1/run/4d316a95-9ce9-4856-acb5-eaee4e97ea6e?stream=false",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      data: payload
    });

    // Send the response from LangFlow back to the client
    res.json(response.data);

  } catch (error) {
    console.error('Error processing request:', error);

    // Handle different types of errors
    if (error.response) {
      // LangFlow API error
      res.status(error.response.status).json({
        error: 'LangFlow API error',
        details: error.response.data
      });
    } else if (error.request) {
      // Network error
      res.status(503).json({
        error: 'Network error',
        message: 'Unable to reach LangFlow API'
      });
    } else {
      // Other errors
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
