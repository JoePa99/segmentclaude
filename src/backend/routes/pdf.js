import express from 'express';
import { authenticateToken } from './auth.js';
import Project from '../models/Project.js';
import { generateSegmentationPdf, generateFocusGroupPdf } from '../services/pdf/pdfService.js';

const router = express.Router();

// Generate PDF for segmentation report
router.get('/segmentation/:projectId', authenticateToken, async (req, res) => {
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
    
    // Check if the project has segments
    if (!project.segments || project.segments.length === 0) {
      return res.status(400).json({ message: 'Project has no segments to export' });
    }
    
    // Generate PDF
    const pdfBuffer = await generateSegmentationPdf(project);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${project.name.replace(/\s+/g, '_')}_segments.pdf`);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating segmentation PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF for focus group transcript
router.get('/focus-group/:projectId/:focusGroupId', authenticateToken, async (req, res) => {
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
    
    // Generate PDF
    const pdfBuffer = await generateFocusGroupPdf(project, focusGroup);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${project.name.replace(/\s+/g, '_')}_focus_group.pdf`);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating focus group PDF:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;