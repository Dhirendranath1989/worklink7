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
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('Rejected file type:', file.mimetype);
      cb(new Error(`File type ${file.mimetype} not allowed. Only images and documents are accepted.`), false);
    }
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Too many files or unexpected field name.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message && error.message.includes('not allowed')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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

// Import User model
const User = require('./models/User');

// Routes

// Import routes
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');

// Register routes
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

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
        availabilityStatus: user.availabilityStatus || 'available',
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

// Google authentication endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.email) {
      return res.status(400).json({ error: 'User data is required' });
    }

    // Find or create user
    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: userData.email });
      
      if (!user) {
        // Create new user
        user = new User({
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          password: '', // Empty password for Google users
          userType: 'worker', // Default to worker, can be changed later
          profilePhoto: userData.photoURL || '',
          emailVerified: userData.emailVerified || false,
          firebaseUid: userData.uid,
          profileCompleted: false
        });
        await user.save();
      } else {
        // Update existing user with Google data if needed
        if (userData.photoURL && !user.profilePhoto) {
          user.profilePhoto = userData.photoURL;
        }
        if (userData.uid && !user.firebaseUid) {
          user.firebaseUid = userData.uid;
        }
        user.emailVerified = userData.emailVerified || user.emailVerified;
        await user.save();
      }
    } else {
      // In-memory storage
      user = inMemoryUsers.find(u => u.email === userData.email);
      
      if (!user) {
        user = {
          id: Date.now().toString(),
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          userType: 'worker',
          profilePhoto: userData.photoURL || '',
          emailVerified: userData.emailVerified || false,
          firebaseUid: userData.uid,
          profileCompleted: false,
          skills: [],
          workExperience: [],
          languages: [],
          availability: '',
          hourlyRate: 0,
          description: '',
          businessName: '',
          rating: 0,
          reviewCount: 0,
          certificates: [],
          workPhotos: []
        };
        inMemoryUsers.push(user);
      } else {
        // Update existing user
        if (userData.photoURL && !user.profilePhoto) {
          user.profilePhoto = userData.photoURL;
        }
        if (userData.uid && !user.firebaseUid) {
          user.firebaseUid = userData.uid;
        }
        user.emailVerified = userData.emailVerified || user.emailVerified;
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful',
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
        availabilityStatus: user.availabilityStatus || 'available',
        hourlyRate: user.hourlyRate,
        description: user.description,
        businessName: user.businessName,
        rating: user.rating,
        reviewCount: user.reviewCount,
        profileCompleted: user.profileCompleted || false
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Failed to process Google login' });
  }
});

// Upload work photos endpoint
app.post('/api/auth/upload-work-photos', authenticateToken, upload.array('workPhotos', 10), async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Upload work photos request:', {
      userId,
      filesCount: req.files ? req.files.length : 0,
      files: req.files ? req.files.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size })) : []
    });

    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded for work photos');
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
app.post('/api/auth/upload-certificates', authenticateToken, upload.array('certificates', 10), async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Upload certificates request:', {
      userId,
      filesCount: req.files ? req.files.length : 0,
      files: req.files ? req.files.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size })) : []
    });

    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded for certificates');
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



// Update profile endpoint
app.put('/api/auth/update-profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'workPhotos', maxCount: 10 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      // Handle profile photo
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        updateData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
      }

      // Handle work photos - append to existing ones
      if (req.files.workPhotos && req.files.workPhotos.length > 0) {
        const newWorkPhotos = req.files.workPhotos.map(file => ({
          path: `/uploads/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }));
        
        // Get existing work photos and append new ones
        const existingUser = isMongoConnected 
          ? await User.findById(userId)
          : inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        const existingWorkPhotos = existingUser?.workPhotos || [];
        updateData.workPhotos = [...existingWorkPhotos, ...newWorkPhotos];
      }

      // Handle certificates - append to existing ones
      if (req.files.certificates && req.files.certificates.length > 0) {
        const newCertificates = req.files.certificates.map(file => ({
          path: `/uploads/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }));
        
        // Get existing certificates and append new ones
        const existingUser = isMongoConnected 
          ? await User.findById(userId)
          : inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        const existingCertificates = existingUser?.certificates || [];
        updateData.certificates = [...existingCertificates, ...newCertificates];
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof updateData.skills === 'string') {
      try {
        updateData.skills = JSON.parse(updateData.skills);
      } catch (e) {
        updateData.skills = updateData.skills.split(',').map(s => s.trim());
      }
    }

    if (typeof updateData.languagesSpoken === 'string') {
      try {
        updateData.languagesSpoken = JSON.parse(updateData.languagesSpoken);
      } catch (e) {
        updateData.languagesSpoken = updateData.languagesSpoken.split(',').map(s => s.trim());
      }
    }

    // Handle workExperience - should be a string, not array
    if (Array.isArray(updateData.workExperience)) {
      updateData.workExperience = updateData.workExperience.join(', ');
    } else if (typeof updateData.workExperience !== 'string') {
      updateData.workExperience = String(updateData.workExperience || '');
    }

    // Convert hourlyRate to number if it's a string
    if (updateData.hourlyRate && typeof updateData.hourlyRate === 'string') {
      updateData.hourlyRate = parseFloat(updateData.hourlyRate);
    }

    // Update user in database or memory
    let updatedUser;
    if (isMongoConnected) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      // In-memory storage
      const userIndex = inMemoryUsers.findIndex(u => (u._id || u.id) === userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updateData };
      updatedUser = inMemoryUsers[userIndex];
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      updatedUser = userWithoutPassword;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id || updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        userType: updatedUser.userType,
        profilePhoto: updatedUser.profilePhoto,
        workPhotos: updatedUser.workPhotos || [],
        certificates: updatedUser.certificates || [],
        skills: updatedUser.skills || [],
        workExperience: updatedUser.workExperience || '',
        languagesSpoken: updatedUser.languagesSpoken || [],
        availability: updatedUser.availability || '',
        availabilityStatus: updatedUser.availabilityStatus || 'available',
        hourlyRate: updatedUser.hourlyRate || 0,
        description: updatedUser.description || '',
        businessName: updatedUser.businessName || '',
        businessType: updatedUser.businessType || '',
        mobile: updatedUser.mobile || '',
        address: updatedUser.address || '',
        pincode: updatedUser.pincode || '',
        rating: updatedUser.rating || 0,
        reviewCount: updatedUser.reviewCount || 0,
        profileCompleted: updatedUser.profileCompleted || false
      }
    });
  } catch (error) {
    console.error('Error updating profile:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      body: req.body,
      files: req.files ? Object.keys(req.files) : []
    });
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Complete profile endpoint
app.post('/api/auth/complete-profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'workPhotos', maxCount: 10 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = { ...req.body };
    
    // Mark profile as completed
    updateData.profileCompleted = true;

    // Handle file uploads
    if (req.files) {
      // Handle profile photo
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        updateData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
      }

      // Handle work photos - append to existing ones
      if (req.files.workPhotos && req.files.workPhotos.length > 0) {
        const newWorkPhotos = req.files.workPhotos.map(file => ({
          path: `/uploads/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }));
        
        // Get existing work photos and append new ones
        const existingUser = isMongoConnected 
          ? await User.findById(userId)
          : inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        const existingWorkPhotos = existingUser?.workPhotos || [];
        updateData.workPhotos = [...existingWorkPhotos, ...newWorkPhotos];
      }

      // Handle certificates - append to existing ones
      if (req.files.certificates && req.files.certificates.length > 0) {
        const newCertificates = req.files.certificates.map(file => ({
          path: `/uploads/${file.filename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }));
        
        // Get existing certificates and append new ones
        const existingUser = isMongoConnected 
          ? await User.findById(userId)
          : inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        const existingCertificates = existingUser?.certificates || [];
        updateData.certificates = [...existingCertificates, ...newCertificates];
      }
    }

    // Parse JSON fields if they come as strings
    if (typeof updateData.skills === 'string') {
      try {
        updateData.skills = JSON.parse(updateData.skills);
      } catch (e) {
        updateData.skills = updateData.skills.split(',').map(s => s.trim());
      }
    }

    if (typeof updateData.languagesSpoken === 'string') {
      try {
        updateData.languagesSpoken = JSON.parse(updateData.languagesSpoken);
      } catch (e) {
        updateData.languagesSpoken = updateData.languagesSpoken.split(',').map(s => s.trim());
      }
    }

    // Handle workExperience - should be a string, not array
    if (Array.isArray(updateData.workExperience)) {
      updateData.workExperience = updateData.workExperience.join(', ');
    } else if (typeof updateData.workExperience !== 'string') {
      updateData.workExperience = String(updateData.workExperience || '');
    }

    // Convert hourlyRate to number if it's a string
    if (updateData.hourlyRate && typeof updateData.hourlyRate === 'string') {
      updateData.hourlyRate = parseFloat(updateData.hourlyRate);
    }

    // Update user in database or memory
    let updatedUser;
    if (isMongoConnected) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      // In-memory storage
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updateData };
      updatedUser = inMemoryUsers[userIndex];
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      updatedUser = userWithoutPassword;
    }

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser._id || updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        userType: updatedUser.userType,
        profilePhoto: updatedUser.profilePhoto,
        workPhotos: updatedUser.workPhotos || [],
        certificates: updatedUser.certificates || [],
        skills: updatedUser.skills || [],
        workExperience: updatedUser.workExperience || '',
        languagesSpoken: updatedUser.languagesSpoken || [],
        availability: updatedUser.availability || '',
        availabilityStatus: updatedUser.availabilityStatus || 'available',
        hourlyRate: updatedUser.hourlyRate || 0,
        description: updatedUser.description || '',
        businessName: updatedUser.businessName || '',
        businessType: updatedUser.businessType || '',
        mobile: updatedUser.mobile || '',
        address: updatedUser.address || '',
        pincode: updatedUser.pincode || '',
        rating: updatedUser.rating || 0,
        reviewCount: updatedUser.reviewCount || 0,
        profileCompleted: true
      }
    });
  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// Get current user endpoint (for authentication)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
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
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        skills: user.skills || [],
        workExperience: user.workExperience || [],
        languages: user.languages || [],
        availability: user.availability || '',
        availabilityStatus: user.availabilityStatus || 'available',
        hourlyRate: user.hourlyRate || 0,
        description: user.description || '',
        businessName: user.businessName || '',
        businessType: user.businessType || '',
        mobile: user.mobile || '',
        address: user.address || '',
        pincode: user.pincode || '',
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        certificates: user.certificates || [],
        workPhotos: user.workPhotos || [],
        profileCompleted: user.profileCompleted || false
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
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