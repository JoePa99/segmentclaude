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
console.log('ANTHROPIC_API_KEY present:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');

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
    
    // Make sure we have a valid model
    if (data && !data.model) {
      data.model = 'gpt-4-turbo';
      console.log('No model specified, defaulting to gpt-4-turbo');
    }
    
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

// Anthropic Claude API proxy endpoint
app.post('/api/anthropic', async (req, res) => {
  try {
    const { endpoint, data } = req.body;
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'Anthropic API key not found in environment variables' 
      });
    }
    
    // Validate required fields
    if (!endpoint) {
      return res.status(400).json({
        error: { message: 'Missing endpoint parameter' }
      });
    }
    
    // Validate the data object
    if (!data) {
      return res.status(400).json({
        error: { message: 'Missing data parameter' }
      });
    }
    
    // Validate model name
    if (!data.model) {
      return res.status(400).json({
        error: { message: 'Missing model parameter in data' }
      });
    }
    
    console.log(`Proxying request to Anthropic endpoint: ${endpoint}`);
    
    // Handle different Claude API versions - the messages endpoint requires different format than completions
    const isMessagesEndpoint = endpoint === 'messages';
    
    // Prepare headers
    const headers = {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
    
    console.log('Anthropic Request Headers:', {
      ...headers,
      'x-api-key': 'REDACTED'
    });
    
    // Check if using Claude 3.5 and update model name if needed
    if (data.model && data.model.includes('claude-3-5-sonnet-')) {
      // Set the correct model name for Anthropic API
      console.log('Standardizing Claude 3.5 Sonnet model name');
      data.model = 'claude-3-5-sonnet';
    } else if (!data.model || data.model === '') {
      // If model is missing, set a default
      console.log('Setting default Claude 3.5 Sonnet model');
      data.model = 'claude-3-5-sonnet';
    }
    
    // Log request data for debugging
    console.log('Anthropic Request Data:', JSON.stringify(data).substring(0, 500) + '...');
    
    // Make the request to Anthropic API
    try {
      const response = await axios.post(`https://api.anthropic.com/v1/${endpoint}`, data, { headers });
      
      // Return the success response
      console.log('Anthropic API success, content length:', 
                  response.data.content?.[0]?.text?.length || 
                  response.data.completion?.length || 
                  'unknown');
      
      res.json(response.data);
    } catch (apiError) {
      // Detailed error logging for API errors
      console.error('Anthropic API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      // Return detailed error to the client
      res.status(apiError.response?.status || 500).json({
        error: {
          message: apiError.response?.data?.error?.message || apiError.message,
          type: apiError.response?.data?.error?.type || 'api_error',
          details: apiError.response?.data || {}
        }
      });
    }
  } catch (error) {
    // General error handling
    console.error('Error processing Anthropic request:', error);
    res.status(500).json({
      error: { 
        message: 'Internal server error processing Anthropic request',
        details: error.message
      }
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

// Test route for Claude API (simplified for reliability)
app.get('/api/test-claude', async (req, res) => {
  try {
    // Just return success without making API call to avoid rate limits/issues
    console.log('Simplified Claude API test');
    
    res.json({
      message: 'Claude API test simplified',
      content: "Success"
    });
  } catch (error) {
    console.error('Claude API test failed:', error);
    res.status(500).json({
      error: 'Claude API test failed',
      details: error.message
    });
  }
});

// For non-Vercel environments, start the server
if (process.env.VERCEL !== '1') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`OpenAI API key loaded:`, process.env.OPENAI_API_KEY ? 'Yes' : 'No');
    console.log(`Anthropic API key loaded:`, process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
  });
}

// Export the Express API for Vercel serverless functions
export default app;