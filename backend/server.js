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

const mongoService = require('./services/mongoService');

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Using MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
console.log(`Server will run on port: ${process.env.PORT || 5000}`);

// Initialize Firebase Admin SDK - TEMPORARILY DISABLED FOR TESTING
// if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL
//       })
//     });
//     console.log('Firebase Admin SDK initialized successfully');
//   } catch (error) {
//     console.log('Firebase Admin SDK initialization error:', error.message);
//   }
// } else {
console.log('Firebase Admin SDK not configured - some features may not work');
// }

const app = express();
const server = http.createServer(app);


const PORT = process.env.PORT || 5000;

// In-memory user storage for demo (when no MongoDB)
let inMemoryUsers = [];
let isMongoConnected = false;

// Configure CORS with better Google OAuth support
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Google OAuth domains
    if (origin.includes('accounts.google.com') || origin.includes('googleapis.com')) {
      return callback(null, true);
    }
    
    // For production, add your domain here
    // if (origin === 'https://yourdomain.com') {
    //   return callback(null, true);
    // }
    
    // Allow all origins for testing (remove in production)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// Add security headers to reduce COOP conflicts
app.use((req, res, next) => {
  // Set Cross-Origin-Opener-Policy to same-origin-allow-popups for Google OAuth
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Set Cross-Origin-Embedder-Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

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
  console.log(`🔐 Auth middleware called for ${req.method} ${req.path}`);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔑 Token received:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ No token provided, returning 401');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('✅ Token verified successfully for user:', user.userId);
    req.user = user;
    next();
  });
};



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
const ConsolidatedUser = require('./models/ConsolidatedUser');

// Routes

// Import routes
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const workersRouter = require('./routes/workers');
const authRouter = require('./routes/auth');


// Set global references for routes
usersRouter.setGlobalReferences({
  isMongoConnected,
  inMemoryUsers
});

authRouter.setGlobalReferences({
  isMongoConnected,
  inMemoryUsers
});



app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/workers', workersRouter);
app.use('/api/auth', authRouter);
app.use('/api/owner', require('./routes/owner'));
app.use('/api/saved-workers', require('./routes/saved-workers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));


// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'WorkLink Backend API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      ping: '/api/ping',
      test: '/api/test'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { fullName, firstName, lastName, email, password, userType, role, firebaseUid } = req.body;

    // Handle both fullName and firstName/lastName formats
    const finalFullName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : '');
    const finalUserType = userType || role;

    console.log('Processed values:', { finalFullName, email, password: '***', finalUserType });

    // Validate required fields
    if (!finalFullName || !email || !password || !finalUserType) {
      console.log('Validation failed:', { finalFullName: !!finalFullName, email: !!email, password: !!password, finalUserType: !!finalUserType });
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    let existingUser;
    if (isMongoConnected) {
      existingUser = await ConsolidatedUser.findOne({ email });
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
      fullName: finalFullName,
      email,
      password: hashedPassword,
      userType: finalUserType,
      firebaseUid,
      profilePhoto: '',
      workPhotos: [],
      certificates: [],
      skills: [],
      workExperience: '',
      languagesSpoken: [],
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
      user = new ConsolidatedUser(userData);
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

    return res.status(201).json({
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
    return res.status(500).json({ error: 'Failed to register user' });
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
      user = await ConsolidatedUser.findOne({ email });
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

    // For in-memory storage, ensure user is in the array and update if needed
    if (!isMongoConnected) {
      const existingUserIndex = inMemoryUsers.findIndex(u => u.email === email);
      if (existingUserIndex !== -1) {
        // Update the existing user data to ensure it's current
        inMemoryUsers[existingUserIndex] = { ...user };
      } else {
        // Add user to memory if not present
        inMemoryUsers.push(user);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        role: user.role,
        profilePhoto: user.profilePhoto,
        workPhotos: user.workPhotos,
        certificates: user.certificates,
        skills: user.skills,
        workExperience: user.workExperience,
        languagesSpoken: user.languagesSpoken,
        availability: user.availability,
        availabilityStatus: user.availabilityStatus || 'available',
        hourlyRate: user.hourlyRate,
        description: user.description,
        businessName: user.businessName,
        businessType: user.businessType || '',
        mobile: user.mobile || '',
        address: user.address || '',
        state: user.state || '',
        district: user.district || '',
        city: user.city || '',
        block: user.block || '',
        pincode: user.pincode || '',
        rating: user.rating,
        reviewCount: user.reviewCount,
        reviews: user.reviews,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
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
      user = await ConsolidatedUser.findOne({ email: userData.email });
      
      if (!user) {
        // Create new user
        user = new ConsolidatedUser({
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          password: '', // Empty password for Google users
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
          _id: Date.now().toString(),
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          password: '', // Empty password for Google users
          userType: 'worker', // Default to worker, can be changed during profile completion
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
          workPhotos: [],
          reviews: []
        };
        inMemoryUsers.push(user);
        console.log(`Created new Google user with ID: ${user._id}`);
      } else {
        // Update existing user
        if (userData.photoURL && !user.profilePhoto) {
          user.profilePhoto = userData.photoURL;
        }
        if (userData.uid && !user.firebaseUid) {
          user.firebaseUid = userData.uid;
        }
        user.emailVerified = userData.emailVerified || user.emailVerified;
        
        // Ensure user is properly updated in the array
        const userIndex = inMemoryUsers.findIndex(u => u.email === userData.email);
        if (userIndex !== -1) {
          inMemoryUsers[userIndex] = { ...user };
          console.log(`Updated existing Google user with ID: ${user._id}`);
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Debug logging
    console.log('Google auth response - user.password:', user.password);
    console.log('Google auth response - user.hasPassword:', user.hasPassword);
    console.log('Google auth response - calculated hasPassword:', user.hasPassword || (user.password && user.password.length > 0) || false);
    console.log('Google auth response - returning user object:', {
      id: user._id,
      email: user.email,
      authProvider: 'google',
      hasPassword: user.hasPassword || (user.password && user.password.length > 0) || false
    });
      
    return res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        firebaseUid: user.firebaseUid,
        workPhotos: user.workPhotos,
        certificates: user.certificates,
        skills: user.skills,
        workExperience: user.workExperience,
        languagesSpoken: user.languagesSpoken,
        languages: user.languages,
        availability: user.availability,
        availabilityStatus: user.availabilityStatus || 'available',
        hourlyRate: user.hourlyRate,
        description: user.description,
        businessName: user.businessName,
        businessType: user.businessType || '',
        mobile: user.mobile || '',
        address: user.address || '',
        state: user.state || '',
        district: user.district || '',
        city: user.city || '',
        block: user.block || '',
        pincode: user.pincode || '',
        rating: user.rating,
        reviewCount: user.reviewCount,
        reviews: user.reviews,
        profileCompleted: user.profileCompleted || false,
        authProvider: 'google',
        hasPassword: user.hasPassword || (user.password && user.password.length > 0) || false
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error - user may already exist:', error.keyPattern);
      
      // Try to find and return existing user
      try {
        if (isMongoConnected && userData && userData.email) {
          const existingUser = await ConsolidatedUser.findOne({ email: userData.email });
          if (existingUser) {
            console.log('Found existing user, returning user data');
            
            // Generate JWT token for existing user
            const token = jwt.sign(
              { userId: existingUser._id, email: existingUser.email },
              process.env.JWT_SECRET || 'fallback_secret',
              { expiresIn: '24h' }
            );
            
            return res.json({
              message: 'Google login successful',
              token,
              user: {
                id: existingUser._id,
                fullName: existingUser.fullName,
                email: existingUser.email,
                userType: existingUser.userType,
                profilePhoto: existingUser.profilePhoto,
                workPhotos: existingUser.workPhotos || [],
                certificates: existingUser.certificates || [],
                skills: existingUser.skills || [],
                workExperience: existingUser.workExperience || [],
                languagesSpoken: existingUser.languagesSpoken || [],
                availability: existingUser.availability,
                availabilityStatus: existingUser.availabilityStatus || 'available',
                hourlyRate: existingUser.hourlyRate || 0,
                description: existingUser.description,
                businessName: existingUser.businessName,
                businessType: existingUser.businessType || '',
                mobile: existingUser.mobile || '',
                address: existingUser.address || '',
                state: existingUser.state || '',
                district: existingUser.district || '',
                city: existingUser.city || '',
                block: existingUser.block || '',
                pincode: existingUser.pincode || '',
                rating: existingUser.rating || 0,
                reviewCount: existingUser.reviewCount || 0,
                profileCompleted: existingUser.profileCompleted || false
              }
            });
          } else {
            // User was deleted but unique constraint still exists
            // This is a known MongoDB issue - we need to handle this case
            console.log('Duplicate key error but user not found - likely deleted user with orphaned index');
            console.log('Attempting to recreate user with different approach...');
            
            // Try to create user with upsert to handle the constraint issue
            try {
              const recreatedUser = await ConsolidatedUser.findOneAndUpdate(
                { email: userData.email },
                {
                   fullName: `${userData.firstName} ${userData.lastName}`.trim(),
                   email: userData.email,
                   password: '',
                   profilePhoto: userData.photoURL || '',
                   emailVerified: userData.emailVerified || false,
                   firebaseUid: userData.uid,
                   profileCompleted: false
                 },
                { 
                  upsert: true, 
                  new: true, 
                  setDefaultsOnInsert: true 
                }
              );
              
              console.log('Successfully recreated user:', recreatedUser._id);
              
              // Generate JWT token for recreated user
              const token = jwt.sign(
                { userId: recreatedUser._id, email: recreatedUser.email },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '24h' }
              );
              
              return res.json({
                message: 'Google login successful',
                token,
                user: {
                  id: recreatedUser._id,
                  fullName: recreatedUser.fullName,
                  email: recreatedUser.email,
                  userType: recreatedUser.userType,
                  profilePhoto: recreatedUser.profilePhoto,
                  workPhotos: recreatedUser.workPhotos || [],
                  certificates: recreatedUser.certificates || [],
                  skills: recreatedUser.skills || [],
                  workExperience: recreatedUser.workExperience || [],
                  languages: recreatedUser.languages || [],
                  availability: recreatedUser.availability,
                  availabilityStatus: recreatedUser.availabilityStatus || 'available',
                  hourlyRate: recreatedUser.hourlyRate || 0,
                  description: recreatedUser.description,
                  businessName: recreatedUser.businessName,
                  rating: recreatedUser.rating || 0,
                  reviewCount: recreatedUser.reviewCount || 0,
                  profileCompleted: recreatedUser.profileCompleted || false
                }
              });
            } catch (upsertError) {
              console.error('Failed to recreate user with upsert:', upsertError);
            }
          }
        }
      } catch (findError) {
        console.error('Error finding existing user:', findError);
      }
      
      return res.status(409).json({ 
        error: 'User already exists with this email or Firebase UID',
        details: 'Please try logging in instead of creating a new account'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation error:', error.message);
      return res.status(400).json({ 
        error: 'Invalid user data',
        details: error.message
      });
    }
    
    // Generic error handling
    return res.status(500).json({ 
      error: 'Failed to process Google login',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
      user = await ConsolidatedUser.findById(userId);
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
      user = await ConsolidatedUser.findById(userId);
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
      message: 'Documents uploaded successfully',
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
    res.status(500).json({ error: 'Failed to upload documents' });
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
          ? await ConsolidatedUser.findById(userId)
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
          ? await ConsolidatedUser.findById(userId)
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
      updatedUser = await ConsolidatedUser.findByIdAndUpdate(
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
        state: updatedUser.state || '',
        district: updatedUser.district || '',
        city: updatedUser.city || '',
        block: updatedUser.block || '',
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
    let updateData = { ...req.body };
    
    // Parse profileData JSON if it exists
    if (req.body.profileData) {
      try {
        const profileData = JSON.parse(req.body.profileData);
        console.log('📋 Parsed profileData:', profileData);
        updateData = { ...updateData, ...profileData };
        delete updateData.profileData; // Remove the JSON string field
      } catch (e) {
        console.error('Error parsing profileData:', e);
      }
    }
    
    console.log('📝 Final updateData before saving:', {
      state: updateData.state,
      district: updateData.district,
      city: updateData.city,
      block: updateData.block,
      languagesSpoken: updateData.languagesSpoken
    });
    
    // Mark profile as completed
    updateData.profileCompleted = true;
    
    console.log('Profile completion data:', { userId, userType: updateData.userType, profileCompleted: updateData.profileCompleted });

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
          ? await ConsolidatedUser.findById(userId)
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
          ? await ConsolidatedUser.findById(userId)
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
      updatedUser = await ConsolidatedUser.findByIdAndUpdate(
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
        state: updatedUser.state || '',
        district: updatedUser.district || '',
        city: updatedUser.city || '',
        block: updatedUser.block || '',
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

// Change password endpoint
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Find user
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId || u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change password for social login accounts. Please set a password first.' 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    if (isMongoConnected) {
      await mongoService.updateUser(userId, { password: hashedNewPassword, hasPassword: true });
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId || u.id === userId);
      if (userIndex !== -1) {
        inMemoryUsers[userIndex].password = hashedNewPassword;
        inMemoryUsers[userIndex].hasPassword = true;
      }
    }

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Set password endpoint (for users who don't have a password yet)
app.put('/api/auth/set-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Set password endpoint called');
    const { newPassword } = req.body;
    const userId = req.user.userId;
    console.log('🔧 Set password - userId:', userId);
    console.log('🔧 Set password - newPassword provided:', !!newPassword);

    // Validation
    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find user
    console.log('🔧 Set password - Finding user...');
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId || u.id === userId);
    }
    console.log('🔧 Set password - User found:', !!user);

    if (!user) {
      console.log('🔧 Set password - User not found, returning 404');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user already has a password (exclude 'empty' placeholder)
    console.log('🔧 Set password - Current user password:', user.password);
    console.log('🔧 Set password - User hasPassword:', user.hasPassword);
    if (user.password && user.password.length > 0 && user.password !== 'empty') {
      console.log('🔧 Set password - User already has password, returning 400');
      return res.status(400).json({ 
        success: false, 
        message: 'User already has a password. Use change password instead.' 
      });
    }

    // Hash new password
    console.log('🔧 Set password - Hashing new password...');
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('🔧 Set password - Password hashed successfully');

    // Set password
    console.log('🔧 Set password - Updating user in database...');
    if (isMongoConnected) {
      await mongoService.updateUser(userId, { password: hashedNewPassword, hasPassword: true });
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId || u.id === userId);
      if (userIndex !== -1) {
        inMemoryUsers[userIndex].password = hashedNewPassword;
        inMemoryUsers[userIndex].hasPassword = true;
      }
    }
    console.log('🔧 Set password - User updated successfully');

    console.log('🔧 Set password - Sending success response');
    res.json({ 
      success: true, 
      message: 'Password set successfully' 
    });

  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get current user endpoint (for authentication)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`/auth/me called for user ID: ${userId}`);
    
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId).select('-password');
    } else {
      console.log(`Looking for user ${userId} in inMemoryUsers. Available users:`, inMemoryUsers.map(u => ({ id: u._id || u.id, email: u.email, fullName: u.fullName })));
      user = inMemoryUsers.find(u => (u._id || u.id) === userId);
      if (user) {
        console.log(`Found user in /auth/me:`, { id: user._id || user.id, fullName: user.fullName, profilePhoto: user.profilePhoto });
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      } else {
        console.log(`User ${userId} not found in inMemoryUsers`);
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Debug logging for /auth/me endpoint
    console.log('/auth/me - Found user:', {
      id: user._id || user.id,
      email: user.email,
      password: user.password ? 'exists' : 'empty',
      hasPassword: user.hasPassword,
      authProvider: user.authProvider
    });

    return res.json({
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        profilePhoto: user.profilePhoto,
        skills: user.skills || [],
        workExperience: user.workExperience || [],
        languagesSpoken: user.languagesSpoken || [],
        availability: user.availability || '',
        availabilityStatus: user.availabilityStatus || 'available',
        hourlyRate: user.hourlyRate || 0,
        description: user.description || '',
        businessName: user.businessName || '',
        businessType: user.businessType || '',
        mobile: user.mobile || '',
        address: user.address || '',
        state: user.state || '',
        district: user.district || '',
        city: user.city || '',
        block: user.block || '',
        pincode: user.pincode || '',
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        certificates: user.certificates || [],
        workPhotos: user.workPhotos || [],
        profileCompleted: user.profileCompleted || false,
        authProvider: user.authProvider || 'email',
        hasPassword: user.hasPassword || (user.password && user.password.length > 0) || false
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get user profile endpoint
app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId).select('-password');
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
      languagesSpoken: user.languagesSpoken || [],
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



// ============================================================================
// DELETE ROUTES
// ============================================================================

// Delete work photo route
app.delete('/api/auth/delete-work-photo/:userId/:photoIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, photoIndex } = req.params;
    const requestingUserId = req.user.userId;
    
    console.log(`Delete work photo request - User: ${requestingUserId}, Target: ${userId}, Photo Index: ${photoIndex}`);
    
    // Check if user is trying to delete their own photo
    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own work photos' });
    }
    
    const photoIndexNum = parseInt(photoIndex);
    if (isNaN(photoIndexNum) || photoIndexNum < 0) {
      return res.status(400).json({ error: 'Invalid photo index' });
    }
    
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.workPhotos || photoIndexNum >= user.workPhotos.length) {
      return res.status(404).json({ error: 'Work photo not found' });
    }
    
    // Remove the photo from the array
    const updatedWorkPhotos = [...user.workPhotos];
    updatedWorkPhotos.splice(photoIndexNum, 1);
    
    if (isMongoConnected) {
      await ConsolidatedUser.findByIdAndUpdate(userId, {
        workPhotos: updatedWorkPhotos
      });
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      if (userIndex !== -1) {
        inMemoryUsers[userIndex].workPhotos = updatedWorkPhotos;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Work photo deleted successfully',
      workPhotos: updatedWorkPhotos
    });
  } catch (error) {
    console.error('Error deleting work photo:', error);
    res.status(500).json({ error: 'Failed to delete work photo' });
  }
});

// Delete certificate route
app.delete('/api/auth/delete-certificate/:userId/:certIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, certIndex } = req.params;
    const requestingUserId = req.user.userId;
    
    console.log(`Delete certificate request - User: ${requestingUserId}, Target: ${userId}, Cert Index: ${certIndex}`);
    
    // Check if user is trying to delete their own certificate
    if (requestingUserId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own certificates' });
    }
    
    const certIndexNum = parseInt(certIndex);
    if (isNaN(certIndexNum) || certIndexNum < 0) {
      return res.status(400).json({ error: 'Invalid certificate index' });
    }
    
    let user;
    if (isMongoConnected) {
      user = await ConsolidatedUser.findById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.certificates || certIndexNum >= user.certificates.length) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Remove the certificate from the array
    const updatedCertificates = [...user.certificates];
    updatedCertificates.splice(certIndexNum, 1);
    
    if (isMongoConnected) {
      await ConsolidatedUser.findByIdAndUpdate(userId, {
        certificates: updatedCertificates
      });
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      if (userIndex !== -1) {
        inMemoryUsers[userIndex].certificates = updatedCertificates;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Certificate deleted successfully',
      certificates: updatedCertificates
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

// ============================================================================
// REVIEW ROUTES
// ============================================================================

// Create a review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { workerId, rating, comment, jobId } = req.body;
    const reviewerId = req.user.userId;

    // Validate required fields
    if (!workerId || !rating || !comment) {
      return res.status(400).json({ error: 'Worker ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get reviewer information
    let reviewer;
    if (isMongoConnected) {
      reviewer = await ConsolidatedUser.findById(reviewerId);
    } else {
      reviewer = inMemoryUsers.find(u => u._id === reviewerId);
    }

    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }

    // Check if worker exists
    let worker;
    if (isMongoConnected) {
      worker = await ConsolidatedUser.findById(workerId);
    } else {
      worker = inMemoryUsers.find(u => u._id === workerId);
    }

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const reviewData = {
      reviewerId,
      workerId,
      jobId: jobId || null,
      rating: parseInt(rating),
      comment: comment.trim(),
      reviewerName: reviewer.fullName || reviewer.firstName + ' ' + reviewer.lastName,
      reviewerProfilePicture: reviewer.profilePhoto || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedReview;
    if (isMongoConnected) {
      // Use mongoService to create review
      savedReview = await mongoService.createReview(reviewData);
    } else {
      // For in-memory storage, we'll simulate review creation
      savedReview = {
        _id: Date.now().toString(),
        ...reviewData
      };
      
      // Update worker's rating and review count
      const workerIndex = inMemoryUsers.findIndex(u => u._id === workerId);
      if (workerIndex !== -1) {
        const currentReviews = inMemoryUsers[workerIndex].reviews || [];
        currentReviews.push(savedReview);
        
        const totalRating = currentReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / currentReviews.length;
        
        inMemoryUsers[workerIndex].reviews = currentReviews;
        inMemoryUsers[workerIndex].averageRating = averageRating;
        inMemoryUsers[workerIndex].totalReviews = currentReviews.length;
        inMemoryUsers[workerIndex].reviewCount = currentReviews.length;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: savedReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get reviews for a specific worker
app.get('/api/reviews/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let reviews = [];
    let totalReviews = 0;

    if (isMongoConnected) {
      reviews = await mongoService.getWorkerReviews(workerId);
      totalReviews = reviews.length;
      
      // Apply pagination
      reviews = reviews.slice(skip, skip + limit);
    } else {
      // For in-memory storage
      const worker = inMemoryUsers.find(u => u._id === workerId);
      if (worker && worker.reviews) {
        reviews = worker.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        totalReviews = reviews.length;
        
        // Apply pagination
        reviews = reviews.slice(skip, skip + limit);
      }
    }

    res.json({
      success: true,
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching worker reviews:', error);
    res.status(500).json({ error: 'Failed to fetch worker reviews' });
  }
});

// Get reviews written by the current user
app.get('/api/reviews/my-reviews', authenticateToken, async (req, res) => {
  try {
    const reviewerId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let reviews = [];
    let totalReviews = 0;

    if (isMongoConnected) {
      const Review = require('./models/Review');
      totalReviews = await Review.countDocuments({ reviewerId });
      reviews = await Review.find({ reviewerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      // For in-memory storage, collect all reviews by this user
      const allReviews = [];
      inMemoryUsers.forEach(user => {
        if (user.reviews) {
          const userReviews = user.reviews.filter(review => review.reviewerId === reviewerId);
          allReviews.push(...userReviews);
        }
      });
      
      reviews = allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      totalReviews = reviews.length;
      
      // Apply pagination
      reviews = reviews.slice(skip, skip + limit);
    }

    res.json({
      success: true,
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Get reviews received by the current user (for workers)
app.get('/api/reviews/received', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let reviews = [];
    let totalReviews = 0;

    if (isMongoConnected) {
      reviews = await mongoService.getWorkerReviews(workerId);
      totalReviews = reviews.length;
      
      // Apply pagination
      reviews = reviews.slice(skip, skip + limit);
    } else {
      // For in-memory storage
      const worker = inMemoryUsers.find(u => u._id === workerId);
      if (worker && worker.reviews) {
        reviews = worker.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        totalReviews = reviews.length;
        
        // Apply pagination
        reviews = reviews.slice(skip, skip + limit);
      }
    }

    res.json({
      success: true,
      reviews,
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching received reviews:', error);
    res.status(500).json({ error: 'Failed to fetch received reviews' });
  }
});

// Health check and confirmation endpoint for Pi testing
app.get('/api/health', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  const serverInfo = {
    status: 'OK',
    message: 'WorkLink Backend Server is running successfully',
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      mongoConnected: isMongoConnected
    },
    client: {
      ip: clientIP,
      userAgent: req.get('User-Agent')
    },
    confirmation: 'Backend server is accessible and ready for Pi testing'
  };
  
  console.log(`Health check accessed from IP: ${clientIP}`);
  res.json(serverInfo);
});

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Pong! Server is alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Export inMemoryUsers for use in other modules
module.exports = { inMemoryUsers };

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WorkLink Backend Server running on port ${PORT}`);
  console.log(`📡 Server accessible at http://localhost:${PORT}`);
  console.log(`🔍 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🏓 Ping endpoint available at http://localhost:${PORT}/api/ping`);
  console.log(`🌐 Server listening on all interfaces (0.0.0.0) for Pi testing`);
});
