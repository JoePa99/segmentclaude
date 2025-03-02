import express from 'express';
import { authenticateToken } from './auth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(rootDir, '.env') });

const router = express.Router();

// Proxy calls to OpenAI API
router.post('/openai', authenticateToken, async (req, res) => {
  try {
    const { prompt, systemPrompt, model = 'gpt-4-turbo' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured on the server' });
    }
    
    const response = await fetch(openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(response.status).json({ 
        error: 'Error from OpenAI API', 
        details: data
      });
    }
    
    return res.status(200).json({ 
      content: data.choices[0].message.content
    });
  } catch (error) {
    console.error('Error proxying to OpenAI:', error);
    return res.status(500).json({ error: 'Error proxying to OpenAI API' });
  }
});

// Proxy calls to Anthropic API
router.post('/anthropic', authenticateToken, async (req, res) => {
  try {
    const { prompt, systemPrompt, model = 'claude-3-sonnet-20240229' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured on the server' });
    }
    
    const response = await fetch(anthropicEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt || 'You are a helpful assistant.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ 
        error: 'Error from Anthropic API', 
        details: data
      });
    }
    
    return res.status(200).json({ 
      content: data.content[0].text 
    });
  } catch (error) {
    console.error('Error proxying to Anthropic:', error);
    return res.status(500).json({ error: 'Error proxying to Anthropic API' });
  }
});

export default router;