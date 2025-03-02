// Simple serverless function for Vercel
import axios from 'axios';

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

// Simple health check handler
export async function GET(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  console.log('GET request received at path:', path);
  
  // Return appropriate response based on path
  if (path.endsWith('/api/health')) {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: corsHeaders
    });
  }
  
  if (path.endsWith('/api/test')) {
    return new Response(JSON.stringify({ message: 'API test endpoint is working!' }), {
      headers: corsHeaders
    });
  }
  
  if (path.endsWith('/api/test-claude')) {
    return new Response(JSON.stringify({ 
      message: 'Claude API test simplified',
      content: "Success" 
    }), {
      headers: corsHeaders
    });
  }
  
  // Default response if no specific path matched
  return new Response(JSON.stringify({ 
    message: 'API is running!',
    path: path,
    url: req.url
  }), {
    headers: corsHeaders
  });
}

// Handle POST requests for OpenAI and Anthropic
export async function POST(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  console.log('POST request received at path:', path);
  
  try {
    // Parse request body
    const body = await req.json();
    console.log('Request body structure:', Object.keys(body));
    
    // OpenAI proxy
    if (path.endsWith('/api/openai')) {
      console.log('OpenAI proxy request received');
      const { endpoint, data } = body;
      
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key missing!');
        return new Response(JSON.stringify({ 
          error: 'OpenAI API key not found in environment variables' 
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      // Make sure we have a valid model
      if (data && !data.model) {
        data.model = 'gpt-4';
      }
      
      try {
        console.log(`Forwarding request to OpenAI API: ${endpoint}`);
        // Forward the request to OpenAI
        const response = await axios.post(`https://api.openai.com/v1/${endpoint}`, data, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('OpenAI API response received successfully');
        // Return the OpenAI response
        return new Response(JSON.stringify(response.data), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Error from OpenAI API:', error.message);
        return new Response(JSON.stringify({
          error: error.response?.data || { message: error.message }
        }), {
          status: error.response?.status || 500,
          headers: corsHeaders
        });
      }
    }
    
    // Anthropic proxy
    if (path.endsWith('/api/anthropic')) {
      console.log('Anthropic proxy request received');
      const { endpoint, data } = body;
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Anthropic API key missing!');
        return new Response(JSON.stringify({ 
          error: 'Anthropic API key not found in environment variables' 
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      // Validate model name
      const modelName = data?.model || 'claude-3-5-sonnet';
      data.model = modelName.includes('claude-3-5-sonnet-') ? 'claude-3-5-sonnet' : modelName;
      
      try {
        console.log(`Forwarding request to Anthropic API: ${endpoint}, model: ${data.model}`);
        // Forward the request to Anthropic
        const response = await axios.post(`https://api.anthropic.com/v1/${endpoint}`, data, {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Anthropic API response received successfully');
        // Return the Anthropic response
        return new Response(JSON.stringify(response.data), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Error from Anthropic API:', error.message);
        console.error('Error details:', error.response?.data?.error);
        return new Response(JSON.stringify({
          error: {
            message: error.response?.data?.error?.message || error.message,
            type: error.response?.data?.error?.type || 'api_error',
            details: error.response?.data || {}
          }
        }), {
          status: error.response?.status || 500,
          headers: corsHeaders
        });
      }
    }
    
    // Default response for unmatched POST paths
    console.warn('Invalid API endpoint requested:', path);
    return new Response(JSON.stringify({ 
      error: 'Invalid API endpoint',
      requestedPath: path,
      validEndpoints: ['/api/openai', '/api/anthropic']
    }), {
      status: 404,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Serverless function error:', error);
    return new Response(JSON.stringify({ 
      error: { message: 'Internal server error', details: error.message }
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}