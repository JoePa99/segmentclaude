import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from './auth.js';
import Upload from '../models/Upload.js';
import Project from '../models/Project.js';
import { processDocument } from '../services/upload/documentProcessor.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload a document
router.post('/', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { projectId } = req.body;
    
    // Check if project exists and belongs to user
    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        user: req.user.id
      });
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }
    
    // Create upload record
    const uploadDoc = new Upload({
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.id,
      project: projectId || null,
      status: 'uploaded'
    });
    
    const savedUpload = await uploadDoc.save();
    
    // Process document asynchronously
    processDocument(savedUpload._id)
      .then(async (result) => {
        // If the upload is associated with a project, add it to the project
        if (projectId) {
          await Project.findByIdAndUpdate(
            projectId,
            { 
              $push: { uploadedFiles: savedUpload._id },
              $set: { extractedText: result.extractedText }
            }
          );
        }
      })
      .catch(error => {
        console.error('Error processing document:', error);
      });
    
    res.status(201).json(savedUpload);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get uploads for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists and belongs to user
    const project = await Project.findOne({
      _id: projectId,
      user: req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get uploads for the project
    const uploads = await Upload.find({ project: projectId });
    
    res.status(200).json(uploads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific upload
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    res.status(200).json(upload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an upload
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    
    // Remove the file from disk
    if (fs.existsSync(upload.path)) {
      fs.unlinkSync(upload.path);
    }
    
    // If the upload is associated with a project, remove it from the project
    if (upload.project) {
      await Project.findByIdAndUpdate(
        upload.project,
        { $pull: { uploadedFiles: upload._id } }
      );
    }
    
    // Delete the upload from the database
    await Upload.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Upload deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;