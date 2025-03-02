import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables from root directory
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
console.log('LLM Service - Root directory for .env:', rootDir);
dotenv.config({ path: path.join(rootDir, '.env') });

// Debug - log to see if we're getting the API key
console.log('LLM Service - OPENAI_API_KEY present:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// Initialize API clients with explicit config
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Get the appropriate LLM client based on the provider
 * @param {string} provider - The LLM provider (openai or anthropic)
 * @returns {object} - The LLM client
 */
const getLLMClient = (provider) => {
  switch (provider) {
    case 'openai':
      return openai;
    case 'anthropic':
      return anthropic;
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
};

/**
 * Generate a market segmentation based on user inputs
 * @param {Object} params - Parameters for segmentation
 * @param {string} params.provider - LLM provider (openai or anthropic)
 * @param {string} params.businessType - B2B or B2C
 * @param {string} params.industry - The industry
 * @param {string} params.region - The geographic region (US)
 * @param {Object} params.weights - Weighting preferences
 * @param {string} params.uploadedContent - Text extracted from uploaded documents
 * @returns {Promise<Object>} - The generated segmentation
 */
export const generateSegmentation = async (params) => {
  const {
    provider = 'openai',
    businessType,
    industry,
    region,
    weights,
    uploadedContent = ''
  } = params;
  
  // Construct the prompt
  let prompt = `Generate a comprehensive market segmentation for a ${businessType} business in the ${industry} industry, focusing on the ${region} market.

Based on the following weighting preferences (out of 100 total):
- Demographics: ${weights.demographics}%
- Psychographics: ${weights.psychographics}%
- Behaviors: ${weights.behaviors}%
- Geography: ${weights.geography}%

`;

  // Add any uploaded content if available
  if (uploadedContent && uploadedContent.trim() !== '') {
    prompt += `\nIncorporate insights from the following market research:\n${uploadedContent}\n`;
  }

  prompt += `\nPlease provide:
1. 3-5 distinct market segments with clear names
2. For each segment:
   - Detailed description
   - Approximate size or market share (percentage)
   - Demographic profile
   - Psychographic characteristics (values, attitudes, interests)
   - Behavioral patterns (purchasing behaviors, usage patterns)
   - Key pain points and motivations
   - Purchase triggers
   - Recommended marketing strategies

Format the response as structured JSON data with the following schema:
{
  "segments": [
    {
      "name": "Segment name",
      "description": "Detailed description",
      "size": "Approximate size (percentage)",
      "demographics": {
        // Demographic details as key-value pairs
      },
      "psychographics": {
        // Psychographic details as key-value pairs
      },
      "behaviors": {
        // Behavioral details as key-value pairs
      },
      "painPoints": ["Pain point 1", "Pain point 2", ...],
      "motivations": ["Motivation 1", "Motivation 2", ...],
      "purchaseTriggers": ["Trigger 1", "Trigger 2", ...],
      "marketingStrategies": ["Strategy 1", "Strategy 2", ...]
    },
    // More segments...
  ]
}`;

  try {
    let result;
    
    if (provider === 'openai') {
      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a market research expert specializing in segmentation analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      
      result = JSON.parse(response.choices[0].message.content);
    } else if (provider === 'anthropic') {
      // Call Anthropic
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        system: 'You are a market research expert specializing in segmentation analysis. Always respond in valid JSON format matching the requested schema.',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });
      
      result = JSON.parse(response.content[0].text);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating segmentation:', error);
    throw new Error(`Failed to generate segmentation: ${error.message}`);
  }
};

/**
 * Generate a synthetic focus group based on segments and questions
 * @param {Object} params - Parameters for the focus group
 * @param {string} params.provider - LLM provider (openai or anthropic)
 * @param {Array} params.segments - The segments to simulate
 * @param {Array} params.questions - The questions to ask
 * @returns {Promise<Object>} - The generated focus group transcript
 */
export const generateFocusGroup = async (params) => {
  const {
    provider = 'openai',
    segments,
    questions
  } = params;
  
  // Create persona shorthand for each segment
  const personas = segments.map(segment => ({
    name: segment.name,
    description: segment.description
  }));
  
  // Construct the prompt
  let prompt = `Simulate a focus group with participants from the following market segments:

${personas.map((p, i) => `${i+1}. ${p.name}: ${p.description}`).join('\n')}

For each segment, create 2-3 distinct personas with names, and simulate their responses to the following questions:

${questions.map((q, i) => `${i+1}. ${q}`).join('\n')}

For each question, provide responses from each persona that reflect their segment's characteristics, pain points, and motivations. Make the responses conversational and realistic.

Format the response as structured JSON data with the following schema:
{
  "focusGroup": {
    "participants": [
      {
        "name": "First Last",
        "segment": "Segment name",
        "description": "Brief description of this specific person"
      },
      // More participants...
    ],
    "transcript": [
      {
        "question": "The question text",
        "responses": [
          {
            "participant": "Participant name",
            "segment": "Segment name",
            "response": "Their response to the question"
          },
          // More responses...
        ]
      },
      // More questions...
    ]
  }
}`;

  try {
    let result;
    
    if (provider === 'openai') {
      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a market research moderator skilled at simulating focus groups.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      
      result = JSON.parse(response.choices[0].message.content);
    } else if (provider === 'anthropic') {
      // Call Anthropic
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        system: 'You are a market research moderator skilled at simulating focus groups. Always respond in valid JSON format matching the requested schema.',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      });
      
      result = JSON.parse(response.content[0].text);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating focus group:', error);
    throw new Error(`Failed to generate focus group: ${error.message}`);
  }
};

export default {
  generateSegmentation,
  generateFocusGroup
};