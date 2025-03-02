import express from 'express';
import { authenticateToken } from './auth.js';
import Project from '../models/Project.js';
import { generateFocusGroup } from '../services/llm/llmService.js';

const router = express.Router();

// Create a new focus group for a project
router.post('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions are required' });
    }
    
    // Get the project
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the project has segments
    if (!project.segments || project.segments.length === 0) {
      return res.status(400).json({ message: 'Project must have segments before creating a focus group' });
    }
    
    // Create a new focus group with the questions
    const focusGroup = {
      questions,
      createdAt: new Date()
    };
    
    // Generate focus group responses
    const result = await generateFocusGroup({
      provider: project.llmProvider,
      segments: project.segments,
      questions
    });
    
    // Add transcript to focus group
    focusGroup.transcript = result.focusGroup;
    
    // Add focus group to project
    project.focusGroups.push(focusGroup);
    const updatedProject = await project.save();
    
    // Return the newly created focus group
    const newFocusGroup = updatedProject.focusGroups[updatedProject.focusGroups.length - 1];
    
    res.status(201).json(newFocusGroup);
  } catch (error) {
    console.error('Error creating focus group:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all focus groups for a project
router.get('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get the project
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project.focusGroups || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific focus group
router.get('/:projectId/:focusGroupId', authenticateToken, async (req, res) => {
  try {
    const { projectId, focusGroupId } = req.params;
    
    // Get the project
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find the focus group
    const focusGroup = project.focusGroups.id(focusGroupId);
    
    if (!focusGroup) {
      return res.status(404).json({ message: 'Focus group not found' });
    }
    
    res.status(200).json(focusGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a focus group
router.delete('/:projectId/:focusGroupId', authenticateToken, async (req, res) => {
  try {
    const { projectId, focusGroupId } = req.params;
    
    // Get the project
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find the focus group
    const focusGroup = project.focusGroups.id(focusGroupId);
    
    if (!focusGroup) {
      return res.status(404).json({ message: 'Focus group not found' });
    }
    
    // Remove the focus group
    project.focusGroups.pull(focusGroupId);
    await project.save();
    
    res.status(200).json({ message: 'Focus group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;