const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: functions.config().anthropic.key,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: functions.config().openai?.key,
});

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

// Helper function to download file from URL
async function downloadFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return await response.buffer();
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Helper function to generate segmentation using different LLM providers
async function generateSegmentationWithLLM(modelProvider, modelName, combinedText, projectData) {
  // Create a system prompt with project details
  let systemPrompt = `You are a market segmentation expert specializing in ${projectData.industry || 'various industries'}. 
Your task is to analyze market research data and identify distinct customer segments for a ${projectData.businessType || 'business'}.

For each segment, provide a detailed profile including:
- Demographics
- Psychographics
- Behaviors
- Needs and pain points
- Key differentiators

Generate 3-5 segments with clear differentiation between them.`;

  // Build a prompt with project objective if available
  let prompt = `Please analyze the following market research data and create a detailed market segmentation for ${projectData.name || 'this project'}.`;
  
  if (projectData.objective) {
    prompt += `\n\nThe main objective of this segmentation is: ${projectData.objective}`;
  }
  
  if (projectData.description) {
    prompt += `\n\nProject description: ${projectData.description}`;
  }
  
  // Add the research data to the prompt
  prompt += `\n\nHere is the market research data:\n\n${combinedText.substring(0, 20000)}`;
  
  // Use the appropriate LLM
  if (modelProvider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: modelName || 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.content[0].text;
  } 
  else if (modelProvider === 'openai') {
    const response = await openai.chat.completions.create({
      model: modelName || 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
  
  throw new Error(`Unsupported model provider: ${modelProvider}`);
}

// Function to generate market segmentation
exports.generateSegmentation = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { projectId, uploadIds, modelProvider = 'anthropic', modelName } = data;
  
  try {
    // Get project data
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    
    const projectData = {
      ...projectDoc.data(),
      id: projectId
    };
    
    // Check if user is authorized to access this project
    if (projectData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to access this project'
      );
    }
    
    // Get uploads data
    const uploads = [];
    for (const uploadId of uploadIds) {
      const uploadDoc = await admin.firestore().collection('uploads').doc(uploadId).get();
      if (uploadDoc.exists) {
        uploads.push({
          ...uploadDoc.data(),
          id: uploadId
        });
      }
    }
    
    if (uploads.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'No valid uploads provided'
      );
    }
    
    // Extract text from uploads
    const extractedTexts = [];
    for (const upload of uploads) {
      const fileBuffer = await downloadFile(upload.downloadURL);
      
      let extractedText;
      if (upload.fileType === 'application/pdf') {
        extractedText = await extractTextFromPDF(fileBuffer);
      } else if (upload.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await extractTextFromDOCX(fileBuffer);
      } else {
        // For plain text files
        extractedText = fileBuffer.toString('utf-8');
      }
      
      extractedTexts.push(extractedText);
    }
    
    // Combine all text
    const combinedText = extractedTexts.join('\n\n');
    
    // Generate market segmentation using selected model and project data
    const segmentationText = await generateSegmentationWithLLM(modelProvider, modelName, combinedText, projectData);
    
    // Parse the segmentation text to extract segments and summary
    const segments = [];
    let summary = '';
    
    // Simple parsing logic
    const lines = segmentationText.split('\n');
    let currentSegment = null;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('segment') && line.match(/segment \d+/i)) {
        // New segment found
        if (currentSegment) {
          segments.push(currentSegment);
        }
        
        currentSegment = {
          name: line.trim(),
          description: '',
          characteristics: []
        };
      } else if (currentSegment) {
        // Add line to current segment
        currentSegment.description += line + '\n';
        
        // Extract characteristics (bullet points)
        if (line.trim().startsWith('- ')) {
          currentSegment.characteristics.push(line.trim().substring(2));
        }
      } else if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('overview')) {
        // This might be the summary section
        summary = line + '\n';
      } else if (summary) {
        // Continue adding to summary
        summary += line + '\n';
      }
    }
    
    // Add the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    // Return the segmentation data
    return {
      segments,
      summary,
      rawText: segmentationText,
      model: {
        provider: modelProvider,
        name: modelName
      }
    };
  } catch (error) {
    console.error('Error generating segmentation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to generate focus group using different LLM providers
async function generateFocusGroupWithLLM(modelProvider, modelName, segment, prompt, projectData) {
  // Create a more detailed system prompt with project information
  const systemPrompt = `You are a market research expert conducting a focus group for ${projectData.industry || 'a company'}.
  
Create a realistic focus group transcript with 5-7 participants discussing the given topic. Each participant should have a consistent personality and demographic profile matching the market segment described.

For this ${projectData.businessType || 'business'} focus group:
- Make the conversation natural with back-and-forth discussion
- Include disagreements and unique insights
- Ensure participants mention their specific needs and pain points
- Include a moderator guiding the discussion
- Format as a transcript with clear speaker labels
- Each response should be realistic in length and tone

The focus group is exploring: ${projectData.objective || 'market needs and preferences'}`;

  // Enhanced user prompt with more segment details
  const userPrompt = `Create a synthetic focus group transcript for the following market segment: ${segment.description}

The topic or question for discussion is: ${prompt}

${projectData.description ? `Project context: ${projectData.description}` : ''}`;
  
  if (modelProvider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: modelName || 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });
    
    return response.content[0].text;
  } 
  else if (modelProvider === 'openai') {
    const response = await openai.chat.completions.create({
      model: modelName || 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
  
  throw new Error(`Unsupported model provider: ${modelProvider}`);
}

// Helper function to generate summary using different LLM providers
async function generateSummaryWithLLM(modelProvider, modelName, focusGroupText, projectData, segmentData, discussionPrompt) {
  const systemPrompt = `You are a market research analyst specializing in ${projectData?.industry || 'various industries'}. 
Your task is to summarize the key insights from focus group transcripts in a concise and actionable format.

For this ${projectData?.businessType || 'business'} focus group summary:
- Extract the most important insights and themes
- Identify consensus points and areas of disagreement
- Note any surprising or unexpected findings
- Highlight actionable recommendations based on the discussion`;

  const userPrompt = `Please summarize the key insights from this focus group transcript. 

The focus group represented the following market segment: ${segmentData?.name || 'A customer segment'}
${segmentData?.description ? `Segment description: ${segmentData.description.substring(0, 500)}...` : ''}

The topic discussed was: ${discussionPrompt || 'market needs and preferences'}

${projectData?.objective ? `The business objective is: ${projectData.objective}` : ''}

Here is the transcript:
${focusGroupText}`;
  
  if (modelProvider === 'anthropic') {
    const response = await anthropic.messages.create({
      model: modelName || 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });
    
    return response.content[0].text;
  } 
  else if (modelProvider === 'openai') {
    const response = await openai.chat.completions.create({
      model: modelName || 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
  
  throw new Error(`Unsupported model provider: ${modelProvider}`);
}

// Function to generate synthetic focus group
// Simple AI proxy functions that don't require auth for direct frontend usage
exports.proxyOpenAI = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { prompt, systemPrompt, model } = req.body;
      
      // Validate required parameters
      if (!prompt) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }
      
      const response = await openai.chat.completions.create({
        model: model || 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      res.status(200).json({ content: response.choices[0].message.content });
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  });
});

exports.proxyAnthropic = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { prompt, systemPrompt, model } = req.body;
      
      // Validate required parameters
      if (!prompt) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
      }
      
      const response = await anthropic.messages.create({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: systemPrompt || 'You are a helpful assistant.',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });
      
      res.status(200).json({ content: response.content[0].text });
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  });
});

exports.generateFocusGroup = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { 
    projectId, 
    segmentId, 
    prompt, 
    modelProvider = 'anthropic', 
    modelName,
    summaryModelProvider = 'anthropic',
    summaryModelName
  } = data;
  
  try {
    // Get project data
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    
    const projectData = projectDoc.data();
    
    // Check if user is authorized to access this project
    if (projectData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to access this project'
      );
    }
    
    // Get segmentation data
    const segmentationQuery = await admin.firestore()
      .collection('segmentations')
      .where('projectId', '==', projectId)
      .limit(1)
      .get();
    
    if (segmentationQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Segmentation not found for this project'
      );
    }
    
    const segmentationData = segmentationQuery.docs[0].data();
    
    // Find the specific segment
    const segment = segmentationData.segments.find(s => s.name.includes(segmentId));
    
    if (!segment) {
      throw new functions.https.HttpsError(
        'not-found',
        'Segment not found'
      );
    }
    
    // Add project ID to projectData
    projectData.id = projectId;
    
    // Generate synthetic focus group using selected model and project data
    const focusGroupText = await generateFocusGroupWithLLM(modelProvider, modelName, segment, prompt, projectData);
    
    // Parse the focus group text to extract participants and transcript
    const participants = [];
    const transcript = [];
    
    // Simple parsing logic (you may need to adjust based on the model's output format)
    const lines = focusGroupText.split('\n');
    let currentSpeaker = null;
    let currentDialogue = '';
    
    for (const line of lines) {
      // Check for speaker pattern (e.g., "John (35, Marketing Manager):")
      const speakerMatch = line.match(/^([^:]+):/);
      
      if (speakerMatch) {
        // Save previous dialogue
        if (currentSpeaker && currentDialogue) {
          transcript.push({
            speaker: currentSpeaker,
            text: currentDialogue.trim()
          });
        }
        
        // New speaker
        currentSpeaker = speakerMatch[1].trim();
        currentDialogue = line.substring(speakerMatch[0].length).trim();
        
        // Add participant if new
        if (!participants.includes(currentSpeaker)) {
          participants.push(currentSpeaker);
        }
      } else if (currentSpeaker) {
        // Continue dialogue
        currentDialogue += ' ' + line.trim();
      }
    }
    
    // Add the last dialogue
    if (currentSpeaker && currentDialogue) {
      transcript.push({
        speaker: currentSpeaker,
        text: currentDialogue.trim()
      });
    }
    
    // Generate a summary of the focus group using selected model
    const summary = await generateSummaryWithLLM(
      summaryModelProvider || modelProvider, 
      summaryModelName || (modelProvider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo'),
      focusGroupText,
      projectData,
      segment,
      prompt
    );
    
    // Return the focus group data
    return {
      participants,
      transcript,
      summary,
      rawText: focusGroupText,
      model: {
        provider: modelProvider,
        name: modelName,
        summaryProvider: summaryModelProvider || modelProvider,
        summaryName: summaryModelName || (modelProvider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo')
      }
    };
  } catch (error) {
    console.error('Error generating focus group:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});