const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.log('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  console.log('Firebase Admin SDK not configured - some features may not work');
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// In-memory user storage for demo (when no MongoDB)
let inMemoryUsers = [];
let isMongoConnected = false;

// Configure CORS
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define uploads directory
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and documents
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed!'), false);
    }
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Socket.io connection handling
const connectedUsers = new Map(); // Store user socket connections

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication and join
  socket.on('join', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} joined with socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      isMongoConnected = true;
    })
    .catch((error) => {
      console.log('MongoDB connection error:', error.message);
      console.log('Using in-memory storage instead');
    });
} else {
  console.log('No MongoDB URI provided, using in-memory storage');
}

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['worker', 'employer'], required: true },
  profilePhoto: { type: String, default: '' },
  workPhotos: [{
    path: String,
    originalName: String,
    size: Number,
    mimetype: String
  }],
  certificates: [{
    path: String,
    originalName: String,
    size: Number,
    mimetype: String
  }],
  skills: [String],
  workExperience: [{
    jobTitle: String,
    company: String,
    duration: String,
    description: String
  }],
  languages: [String],
  availability: String,
  hourlyRate: Number,
  description: String,
  businessName: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: [{
    reviewerId: String,
    reviewerName: String,
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now },
    jobTitle: String
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, userType } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    let existingUser;
    if (isMongoConnected) {
      existingUser = await User.findOne({ email });
    } else {
      existingUser = inMemoryUsers.find(user => user.email === email);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      userType,
      profilePhoto: '',
      workPhotos: [],
      certificates: [],
      skills: [],
      workExperience: [],
      languages: [],
      availability: '',
      hourlyRate: 0,
      description: '',
      businessName: '',
      rating: 0,
      reviewCount: 0,
      reviews: []
    };

    let user;
    if (isMongoConnected) {
      user = new User(userData);
      await user.save();
    } else {
      userData._id = Date.now().toString();
      inMemoryUsers.push(userData);
      user = userData;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email });
    } else {
      user = inMemoryUsers.find(u => u.email === email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates,
        skills: user.skills,
        workExperience: user.workExperience,
        languages: user.languages,
        availability: user.availability,
        hourlyRate: user.hourlyRate,
        description: user.description,
        businessName: user.businessName,
        rating: user.rating,
        reviewCount: user.reviewCount,
        reviews: user.reviews
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Upload work photos endpoint
app.post('/api/auth/upload-work-photos', upload.array('workPhotos', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const workPhotos = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update work photos
    let user;
    if (isMongoConnected) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new work photos to existing ones
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
      await user.save();
    } else {
      // In-memory storage
      user = inMemoryUsers.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.workPhotos) {
        user.workPhotos = [];
      }
      user.workPhotos.push(...workPhotos);
    }

    res.json({
      message: 'Work photos uploaded successfully',
      workPhotos: user.workPhotos,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading work photos:', error);
    res.status(500).json({ error: 'Failed to upload work photos' });
  }
});

// Upload certificates endpoint
app.post('/api/auth/upload-certificates', upload.array('certificates', 10), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files
    const certificates = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Find user and update certificates
    let user;
    if (isMongoConnected) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add new certificates to existing ones
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
      await user.save();
    } else {
      // In-memory storage
      user = inMemoryUsers.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.certificates) {
        user.certificates = [];
      }
      user.certificates.push(...certificates);
    }

    res.json({
      message: 'Certificates uploaded successfully',
      certificates: user.certificates,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates
      }
    });
  } catch (error) {
    console.error('Error uploading certificates:', error);
    res.status(500).json({ error: 'Failed to upload certificates' });
  }
});

// Get user profile endpoint
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    if (isMongoConnected) {
      user = await User.findById(userId).select('-password');
    } else {
      user = inMemoryUsers.find(u => u._id === userId);
      if (user) {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id || user.id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      profilePhoto: user.profilePhoto,
      skills: user.skills || [],
      workExperience: user.workExperience || [],
      languages: user.languages || [],
      availability: user.availability || '',
      hourlyRate: user.hourlyRate || 0,
      description: user.description || '',
      businessName: user.businessName || '',
      rating: user.rating || 0,
      reviewCount: user.reviewCount || 0,
      certificates: user.certificates || [],
      workPhotos: user.workPhotos || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});