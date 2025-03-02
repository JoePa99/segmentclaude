import express from 'express';
import { authenticateToken } from './auth.js';
import Project from '../models/Project.js';
import Upload from '../models/Upload.js';
import { generateSegmentation, generateFocusGroup } from '../services/llm/llmService.js';
import { summarizeDocument } from '../services/upload/documentProcessor.js';

const router = express.Router();

// Create a new segmentation project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      businessType,
      industry,
      region,
      weights,
      llmProvider
    } = req.body;
    
    // Create new project
    const project = new Project({
      name,
      user: req.user.id,
      businessType,
      industry,
      region,
      weights: weights || {
        demographics: 25,
        psychographics: 25,
        behaviors: 25,
        geography: 25
      },
      llmProvider: llmProvider || 'openai',
      status: 'draft'
    });
    
    const savedProject = await project.save();
    
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all segmentation projects for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific segmentation project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('uploadedFiles');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a segmentation project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      businessType,
      industry,
      region,
      weights,
      llmProvider
    } = req.body;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update fields if provided
    if (name) project.name = name;
    if (businessType) project.businessType = businessType;
    if (industry) project.industry = industry;
    if (region) project.region = region;
    if (weights) project.weights = weights;
    if (llmProvider) project.llmProvider = llmProvider;
    
    const updatedProject = await project.save();
    
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a segmentation project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate segmentation for a project
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('uploadedFiles');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update status to processing
    project.status = 'processing';
    await project.save();
    
    // Get uploaded content if available
    let uploadedContent = '';
    if (project.uploadedFiles && project.uploadedFiles.length > 0) {
      // If there are multiple uploads, concatenate a summary of each
      for (const upload of project.uploadedFiles) {
        if (upload.extractedText) {
          const summary = await summarizeDocument(upload.extractedText);
          uploadedContent += `${summary}\n\n`;
        }
      }
    } else if (project.extractedText) {
      // If there's already extracted text on the project itself
      uploadedContent = project.extractedText;
    }
    
    // Call LLM service to generate segmentation
    const result = await generateSegmentation({
      provider: project.llmProvider,
      businessType: project.businessType,
      industry: project.industry,
      region: project.region,
      weights: project.weights,
      uploadedContent
    });
    
    // Update project with segments
    project.segments = result.segments;
    project.status = 'completed';
    const updatedProject = await project.save();
    
    res.status(200).json(updatedProject);
  } catch (error) {
    // Update project status to error
    await Project.findByIdAndUpdate(req.params.id, {
      status: 'error'
    });
    
    console.error('Error generating segmentation:', error);
    res.status(500).json({ message: error.message });
  }
});

// New route to proxy API calls to OpenAI
router.post('/api/openai', authenticateToken, async (req, res) => {
  try {
    const { prompt, systemPrompt, model } = req.body;
    
    const openai = await import('openai');
    const OpenAI = openai.default;
    
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openaiClient.chat.completions.create({
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
    res.status(500).json({ message: error.message });
  }
});

// New route to proxy API calls to Anthropic
router.post('/api/anthropic', authenticateToken, async (req, res) => {
  try {
    const { prompt, systemPrompt, model } = req.body;
    
    const anthropic = await import('@anthropic-ai/sdk');
    const Anthropic = anthropic.default;
    
    const anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    const response = await anthropicClient.messages.create({
      model: model || 'claude-3-5-sonnet-latest',
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
    res.status(500).json({ message: error.message });
  }
});

export default router;