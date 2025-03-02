// Simple serverless function for Vercel
import axios from 'axios';

// Simple health check handler
export async function GET(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Return appropriate response based on path
  if (path.endsWith('/api/health')) {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (path.endsWith('/api/test')) {
    return new Response(JSON.stringify({ message: 'API test endpoint is working!' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (path.endsWith('/api/test-claude')) {
    return new Response(JSON.stringify({ 
      message: 'Claude API test simplified',
      content: "Success" 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default response if no specific path matched
  return new Response(JSON.stringify({ message: 'API is running!' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle POST requests for OpenAI and Anthropic
export async function POST(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  try {
    // Parse request body
    const body = await req.json();
    
    // OpenAI proxy
    if (path.endsWith('/api/openai')) {
      const { endpoint, data } = body;
      
      if (!process.env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'OpenAI API key not found in environment variables' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Make sure we have a valid model
      if (data && !data.model) {
        data.model = 'gpt-4';
      }
      
      try {
        // Forward the request to OpenAI
        const response = await axios.post(`https://api.openai.com/v1/${endpoint}`, data, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Return the OpenAI response
        return new Response(JSON.stringify(response.data), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.response?.data || { message: error.message }
        }), {
          status: error.response?.status || 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Anthropic proxy
    if (path.endsWith('/api/anthropic')) {
      const { endpoint, data } = body;
      
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'Anthropic API key not found in environment variables' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validate model name
      const modelName = data?.model || 'claude-3-5-sonnet';
      data.model = modelName.includes('claude-3-5-sonnet-') ? 'claude-3-5-sonnet' : modelName;
      
      try {
        // Forward the request to Anthropic
        const response = await axios.post(`https://api.anthropic.com/v1/${endpoint}`, data, {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        });
        
        // Return the Anthropic response
        return new Response(JSON.stringify(response.data), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: {
            message: error.response?.data?.error?.message || error.message,
            type: error.response?.data?.error?.type || 'api_error',
            details: error.response?.data || {}
          }
        }), {
          status: error.response?.status || 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Default response for unmatched POST paths
    return new Response(JSON.stringify({ error: 'Invalid API endpoint' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: { message: 'Internal server error', details: error.message }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}