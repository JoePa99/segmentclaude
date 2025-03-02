import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
const rootDir = path.resolve(__dirname, '../../');
console.log('Root directory for .env:', rootDir);
dotenv.config({ path: path.join(rootDir, '.env') });

// Debug environment variables
console.log('OPENAI_API_KEY present:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// Create Express app
const app = express();
const port = 8000; // Force to use port 8000 regardless of environment variable

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OpenAI proxy endpoint
app.post('/api/openai', async (req, res) => {
  try {
    const { endpoint, data } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not found in environment variables' 
      });
    }
    
    console.log(`Proxying request to OpenAI endpoint: ${endpoint}`);
    
    // Forward the request to OpenAI
    const response = await axios.post(`https://api.openai.com/v1/${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Return the response from OpenAI
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to OpenAI:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || { message: error.message }
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint is working!' });
});

// For non-Vercel environments, start the server
if (process.env.VERCEL !== '1') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`OpenAI API key loaded:`, process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  });
}

// Export the Express API for Vercel serverless functions
export default app;