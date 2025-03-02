import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
const rootDir = path.resolve(__dirname, '../../');
console.log('Root directory for .env:', rootDir);
dotenv.config({ path: path.join(rootDir, '.env') });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('OPENAI_API_KEY present:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
console.log('MONGODB_URI present:', process.env.MONGODB_URI ? 'Yes' : 'No');
console.log('JWT_SECRET present:', process.env.JWT_SECRET ? 'Yes' : 'No');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mock database
const users = [];
const projects = [];

// Mock authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password // In a real app, this would be hashed
    };
    
    users.push(user);
    
    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email
  });
});

// Project routes
app.get('/api/segmentation', authenticateToken, (req, res) => {
  const userProjects = projects.filter(p => p.userId === req.user.id);
  res.status(200).json(userProjects);
});

app.post('/api/segmentation', authenticateToken, (req, res) => {
  try {
    const { name, businessType, industry, region, weights } = req.body;
    
    const project = {
      id: Date.now().toString(),
      userId: req.user.id,
      name,
      businessType,
      industry,
      region,
      weights,
      segments: [],
      focusGroups: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    projects.push(project);
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/segmentation/:id', authenticateToken, (req, res) => {
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  res.status(200).json(project);
});

app.post('/api/segmentation/:id/generate', authenticateToken, (req, res) => {
  const project = projects.find(p => p.id === req.params.id && p.userId === req.user.id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Generate mock segments
  project.segments = [
    {
      name: "Tech Enthusiasts",
      description: "Early adopters who love new technology",
      size: "25%",
      demographics: {
        age: "25-34",
        income: "75,000-100,000",
        education: "College degree or higher"
      },
      psychographics: {
        values: "Innovation, Status, Efficiency",
        interests: "Technology, Gadgets, Gaming"
      },
      behaviors: {
        purchase_frequency: "High",
        brand_loyalty: "Medium",
        research_habit: "Extensive"
      },
      painPoints: ["Price sensitivity", "Feature overwhelm", "Compatibility issues"],
      motivations: ["Latest features", "Social status", "Productivity gain"],
      purchaseTriggers: ["New release", "Special promotion", "Peer recommendation"],
      marketingStrategies: ["Technical spec focus", "Early access programs", "Influencer marketing"]
    },
    {
      name: "Practical Buyers",
      description: "Value-conscious consumers who prioritize functionality",
      size: "40%",
      demographics: {
        age: "35-50",
        income: "50,000-75,000",
        education: "High school or some college"
      },
      psychographics: {
        values: "Reliability, Value, Simplicity",
        interests: "Home improvement, Family activities, DIY"
      },
      behaviors: {
        purchase_frequency: "Medium",
        brand_loyalty: "High",
        research_habit: "Moderate"
      },
      painPoints: ["Complex features", "Short product lifespan", "Poor customer service"],
      motivations: ["Reliability", "Good value", "Ease of use"],
      purchaseTriggers: ["Product failure", "Positive reviews", "Family recommendation"],
      marketingStrategies: ["Value proposition", "Warranty highlights", "Customer testimonials"]
    },
    {
      name: "Premium Seekers",
      description: "Quality-focused customers willing to pay for premium experience",
      size: "15%",
      demographics: {
        age: "40-60",
        income: "100,000+",
        education: "Advanced degree"
      },
      psychographics: {
        values: "Quality, Exclusivity, Aesthetics",
        interests: "Luxury goods, Travel, Fine dining"
      },
      behaviors: {
        purchase_frequency: "Low",
        brand_loyalty: "Very high",
        research_habit: "Thorough"
      },
      painPoints: ["Lack of premium options", "Poor customer experience", "Inconsistent quality"],
      motivations: ["Best quality", "Status symbol", "Exceptional service"],
      purchaseTriggers: ["Exclusive offers", "Brand reputation", "Luxury packaging"],
      marketingStrategies: ["Premium positioning", "Concierge service", "Limited editions"]
    }
  ];
  
  project.status = 'completed';
  project.updatedAt = new Date();
  
  res.status(200).json(project);
});

// Focus group routes
app.post('/api/focus-group/:projectId', authenticateToken, (req, res) => {
  const project = projects.find(p => p.id === req.params.projectId && p.userId === req.user.id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  const { questions } = req.body;
  
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions are required' });
  }
  
  const focusGroup = {
    id: Date.now().toString(),
    questions,
    createdAt: new Date(),
    transcript: {
      participants: [
        {
          name: "Michael Lee",
          segment: "Tech Enthusiasts",
          description: "Software developer, loves gadgets and new tech"
        },
        {
          name: "Sarah Johnson",
          segment: "Tech Enthusiasts",
          description: "Digital marketing manager, early adopter"
        },
        {
          name: "Robert Davis",
          segment: "Practical Buyers",
          description: "School teacher, looks for value and durability"
        },
        {
          name: "Jennifer Miller",
          segment: "Practical Buyers",
          description: "Nurse, mother of two, budget-conscious"
        },
        {
          name: "William Chen",
          segment: "Premium Seekers",
          description: "Executive, values quality and brand reputation"
        },
        {
          name: "Elizabeth Taylor",
          segment: "Premium Seekers",
          description: "Business owner, prioritizes premium experiences"
        }
      ],
      transcript: questions.map(question => ({
        question,
        responses: [
          {
            participant: "Michael Lee",
            segment: "Tech Enthusiasts",
            response: "I'm always looking for the latest features and cutting-edge technology. Price is secondary to having the newest capabilities on the market."
          },
          {
            participant: "Sarah Johnson",
            segment: "Tech Enthusiasts",
            response: "I research extensively before buying and want products that integrate well with my existing tech ecosystem. I'll pay more for seamless connectivity."
          },
          {
            participant: "Robert Davis",
            segment: "Practical Buyers",
            response: "I need something reliable that does the job without complications. I don't need fancy features if they drive up the price without adding real value."
          },
          {
            participant: "Jennifer Miller",
            segment: "Practical Buyers",
            response: "Long-term reliability and ease of use are my priorities. If it's too complex, I'll look for something simpler even if it has fewer features."
          },
          {
            participant: "William Chen",
            segment: "Premium Seekers",
            response: "Quality and customer service are non-negotiable for me. I expect premium materials, thoughtful design, and white-glove support when I pay top dollar."
          },
          {
            participant: "Elizabeth Taylor",
            segment: "Premium Seekers",
            response: "I look for exclusive options and personalized experiences. Mass-market products don't appeal to me, even if they have similar specifications."
          }
        ]
      }))
    }
  };
  
  project.focusGroups.push(focusGroup);
  project.updatedAt = new Date();
  
  res.status(201).json(focusGroup);
});

app.get('/api/focus-group/:projectId/:focusGroupId', authenticateToken, (req, res) => {
  const project = projects.find(p => p.id === req.params.projectId && p.userId === req.user.id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  const focusGroup = project.focusGroups.find(fg => fg.id === req.params.focusGroupId);
  
  if (!focusGroup) {
    return res.status(404).json({ message: 'Focus group not found' });
  }
  
  res.status(200).json(focusGroup);
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;