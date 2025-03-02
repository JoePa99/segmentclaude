import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  demographics: {
    type: Object,
    default: {}
  },
  psychographics: {
    type: Object,
    default: {}
  },
  behaviors: {
    type: Object,
    default: {}
  },
  painPoints: {
    type: [String],
    default: []
  },
  motivations: {
    type: [String],
    default: []
  },
  purchaseTriggers: {
    type: [String],
    default: []
  },
  marketingStrategies: {
    type: [String],
    default: []
  }
});

const focusGroupSchema = new mongoose.Schema({
  questions: {
    type: [String],
    required: true
  },
  transcript: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessType: {
    type: String,
    enum: ['B2B', 'B2C'],
    required: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    default: 'US'
  },
  weights: {
    demographics: {
      type: Number,
      default: 25
    },
    psychographics: {
      type: Number,
      default: 25
    },
    behaviors: {
      type: Number,
      default: 25
    },
    geography: {
      type: Number,
      default: 25
    }
  },
  uploadedFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }],
  extractedText: {
    type: String,
    default: ''
  },
  segments: {
    type: [segmentSchema],
    default: []
  },
  focusGroups: {
    type: [focusGroupSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'completed', 'error'],
    default: 'draft'
  },
  llmProvider: {
    type: String,
    enum: ['openai', 'anthropic'],
    default: 'openai'
  },
  settings: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project;