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
      
      // Notify others that user is online
      socket.broadcast.emit('user_online', userId);
    }
  });

  // Handle joining conversation rooms
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle leaving conversation rooms
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      conversationId,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
      
      // Notify others that user is offline
      socket.broadcast.emit('user_offline', socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Ensure uploads directory exists
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
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Import MongoDB models
const User = require('./models/User');
const Worker = require('./models/Worker');
const Owner = require('./models/Owner');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const mongoService = require('./services/mongoService');

// In-memory storage for demo (fallback when MongoDB is not available)
let inMemoryReviews = [];
let inMemoryConversations = [];
let inMemoryMessages = [];
let inMemoryNotifications = [];



// Function to fetch user data from MongoDB (replaces Firestore)
const fetchUserFromMongoDB = async (firebaseUid) => {
  try {
    if (!isMongoConnected) {
      console.log('MongoDB not connected, using in-memory storage');
      return inMemoryUsers.find(u => u.firebaseUid === firebaseUid) || null;
    }

    const user = await mongoService.getUserByFirebaseUid(firebaseUid);
    if (user) {
      console.log('User data fetched from MongoDB:', user.email);
      return {
        ...user.toObject(),
        id: firebaseUid,
        firebaseUid: firebaseUid
      };
    } else {
      console.log('No user document found in MongoDB for UID:', firebaseUid);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user from MongoDB:', error);
    return null;
  }
};

// Function to save user data to MongoDB (replaces Firestore)
const saveUserToMongoDB = async (firebaseUid, userData) => {
  try {
    if (!isMongoConnected) {
      console.log('MongoDB not connected, using in-memory storage');
      const userIndex = inMemoryUsers.findIndex(u => u.firebaseUid === firebaseUid);
      if (userIndex >= 0) {
        inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...userData };
      } else {
        inMemoryUsers.push({ ...userData, firebaseUid });
      }
      return true;
    }

    await mongoService.updateUserByFirebaseUid(firebaseUid, userData);
    console.log('User data saved to MongoDB:', userData.email);
    return true;
  } catch (error) {
    console.error('Error saving user to MongoDB:', error);
    return false;
  }
};

// JWT middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // First try to verify as JWT token
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', async (err, user) => {
    if (err) {
      // If JWT verification fails, try Firebase token verification as fallback
      try {
        if (admin.apps.length > 0) {
          console.log('JWT verification failed, trying Firebase token...');
          const decodedToken = await admin.auth().verifyIdToken(token);
          
          // Find user by Firebase UID
          let foundUser;
          if (isMongoConnected) {
            foundUser = await User.findOne({ firebaseUid: decodedToken.uid });
          } else {
            foundUser = inMemoryUsers.find(u => u.firebaseUid === decodedToken.uid);
          }
          
          if (foundUser) {
            req.user = {
              userId: foundUser._id,
              email: foundUser.email,
              role: foundUser.role,
              firebaseUid: foundUser.firebaseUid
            };
            return next();
          }
        }
        
        return res.status(403).json({ message: 'Invalid token' });
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError);
        return res.status(403).json({ message: 'Invalid token' });
      }
    } else {
      req.user = user;
      next();
    }
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, firebaseUid } = req.body;

    let existingUser;
    let user;

    if (isMongoConnected) {
      // Check if user already exists in MongoDB
      const query = {};
      if (email) query.email = email;
      if (firebaseUid) query.firebaseUid = firebaseUid;
      
      if (Object.keys(query).length > 0) {
        existingUser = await User.findOne({ 
          $or: Object.keys(query).map(key => ({ [key]: query[key] })) 
        });
        
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
      }

      // Hash password if provided
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Create user in MongoDB
      user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'worker',
        firebaseUid,
        profileCompleted: false
      });

      await user.save();
    } else {
      // Check if user already exists in memory
      existingUser = inMemoryUsers.find(u => 
        (email && u.email === email) || (firebaseUid && u.firebaseUid === firebaseUid)
      );
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user in memory
      user = {
        _id: Date.now().toString(),
        email,
        password: password, // In demo, we'll store plain text (not recommended for production)
        firstName,
        lastName,
        role: role || 'worker',
        firebaseUid,
        profileCompleted: false
      };
      inMemoryUsers.push(user);
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        firebaseUid: user.firebaseUid,
        fullName: `${user.firstName} ${user.lastName}`,
        profilePhoto: user.profilePhoto
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileCompleted: user.profileCompleted || false,
        firebaseUid: user.firebaseUid
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, firebaseUid } = req.body;

    let user;
    
    if (isMongoConnected) {
      // Use MongoDB
      if (firebaseUid) {
        // Firebase UID based login
        user = await User.findOne({ firebaseUid });
      } else if (email) {
        // Email/password login
        user = await User.findOne({ email });
        
        if (user && password) {
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }
        } else if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
    } else {
      // Use in-memory storage
      if (firebaseUid) {
        // Firebase UID based login
        user = inMemoryUsers.find(u => u.firebaseUid === firebaseUid);
      } else if (email) {
        // Email/password login
        user = inMemoryUsers.find(u => u.email === email);
        
        if (user && password && user.password !== password) {
          return res.status(401).json({ message: 'Invalid credentials' });
        } else if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user.email);
    console.log('User object profilePhoto:', user.profilePhoto);

    // Fetch latest user data from MongoDB if available
    let mongoUser = null;
    if (user.firebaseUid) {
      mongoUser = await fetchUserFromMongoDB(user.firebaseUid);
      console.log('MongoDB user profilePhoto:', mongoUser?.profilePhoto);
    }

    // Merge local user data with MongoDB data (MongoDB takes priority)
    const finalUserData = mongoUser ? {
      ...user,
      ...mongoUser,
      _id: user._id, // Keep local ID for backend compatibility
      id: user._id
    } : user;
    
    console.log('Final user data profilePhoto:', finalUserData.profilePhoto);

    // Generate token
    const token = jwt.sign(
      { 
        userId: finalUserData._id, 
        email: finalUserData.email, 
        role: finalUserData.role, 
        firebaseUid: finalUserData.firebaseUid,
        fullName: `${finalUserData.firstName} ${finalUserData.lastName}`,
        profilePhoto: finalUserData.profilePhoto
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('Login successful with MongoDB data for user:', finalUserData.email);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: finalUserData._id,
        email: finalUserData.email,
        firstName: finalUserData.firstName,
        lastName: finalUserData.lastName,
        fullName: finalUserData.fullName,
        mobile: finalUserData.mobile,
        address: finalUserData.address,
        pincode: finalUserData.pincode,
        userType: finalUserData.userType,
        role: finalUserData.role,
        profileCompleted: finalUserData.profileCompleted || false,
        skills: finalUserData.skills,
        workExperience: finalUserData.workExperience,
        languagesSpoken: finalUserData.languagesSpoken,
        availabilityStatus: finalUserData.availabilityStatus,
        hourlyRate: finalUserData.hourlyRate,
        description: finalUserData.description,
        businessName: finalUserData.businessName,
        profilePhoto: finalUserData.profilePhoto,
        certificates: finalUserData.certificates,
        workPhotos: finalUserData.workPhotos,
        firebaseUid: finalUserData.firebaseUid
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.email) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    const { email, firstName, lastName, uid, photoURL, emailVerified } = userData;
    console.log('Google login attempt for user:', email);

    let user;

    if (isMongoConnected) {
      // Use MongoDB
      user = await User.findOne({ $or: [{ email }, { firebaseUid: uid }] });

      if (!user) {
        // Create new user
        user = new User({
          email,
          firstName,
          lastName,
          firebaseUid: uid,
          isEmailVerified: true,
          role: 'worker',
          profileCompleted: false
        });
        await user.save();
      }
    } else {
      // Use in-memory storage
      user = inMemoryUsers.find(u => u.email === email || u.firebaseUid === uid);

      if (!user) {
        // Create new user
        user = {
          _id: Date.now().toString(),
          email,
          firstName,
          lastName,
          firebaseUid: uid,
          isEmailVerified: true,
          role: 'worker',
          profileCompleted: false
        };
        inMemoryUsers.push(user);
      }
    }

    // Fetch latest user data from MongoDB if available
    let mongoUser = null;
    if (user.firebaseUid) {
      mongoUser = await fetchUserFromMongoDB(user.firebaseUid);
    }

    // Merge local user data with MongoDB data (MongoDB takes priority)
    const finalUserData = mongoUser ? {
      ...user,
      ...mongoUser,
      _id: user._id, // Keep local ID for backend compatibility
      id: user._id
    } : user;

    // Generate token
    const token = jwt.sign(
      { 
        userId: finalUserData._id, 
        email: finalUserData.email, 
        role: finalUserData.role, 
        firebaseUid: finalUserData.firebaseUid,
        fullName: `${finalUserData.firstName} ${finalUserData.lastName}`,
        profilePhoto: finalUserData.profilePhoto
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: finalUserData._id,
        email: finalUserData.email,
        firstName: finalUserData.firstName,
        lastName: finalUserData.lastName,
        fullName: finalUserData.fullName,
        mobile: finalUserData.mobile,
        address: finalUserData.address,
        pincode: finalUserData.pincode,
        userType: finalUserData.userType,
        role: finalUserData.role,
        profileCompleted: finalUserData.profileCompleted,
        skills: finalUserData.skills,
        workExperience: finalUserData.workExperience,
        languagesSpoken: finalUserData.languagesSpoken,
        availabilityStatus: finalUserData.availabilityStatus,
        hourlyRate: finalUserData.hourlyRate,
        description: finalUserData.description,
        businessName: finalUserData.businessName,
        profilePhoto: finalUserData.profilePhoto,
        certificates: finalUserData.certificates,
        workPhotos: finalUserData.workPhotos,
        firebaseUid: finalUserData.firebaseUid
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    let user;
    
    if (isMongoConnected) {
      user = await User.findById(req.user.userId).select('-password');
    } else {
      user = inMemoryUsers.find(u => u._id === req.user.userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch latest user data from MongoDB if available
    let mongoUser = null;
    if (user.firebaseUid) {
      mongoUser = await fetchUserFromMongoDB(user.firebaseUid);
    }

    // Merge local user data with MongoDB data (MongoDB takes priority)
    const finalUserData = mongoUser ? {
      ...user,
      ...mongoUser,
      _id: user._id, // Keep local ID for backend compatibility
      id: user._id
    } : user;

    res.json({
      user: {
        id: finalUserData._id,
        email: finalUserData.email,
        firstName: finalUserData.firstName,
        lastName: finalUserData.lastName,
        fullName: finalUserData.fullName,
        mobile: finalUserData.mobile,
        address: finalUserData.address,
        pincode: finalUserData.pincode,
        role: finalUserData.role,
        userType: finalUserData.userType || finalUserData.role,
        profileCompleted: finalUserData.profileCompleted,
        phoneNumber: finalUserData.phoneNumber,
        profilePhoto: finalUserData.profilePhoto,
        bio: finalUserData.bio,
        description: finalUserData.description,
        skills: finalUserData.skills,
        languagesSpoken: finalUserData.languagesSpoken,
        workExperience: finalUserData.workExperience,
        certificates: finalUserData.certificates,
        workPhotos: finalUserData.workPhotos,
        hourlyRate: finalUserData.hourlyRate,
        availability: finalUserData.availability,
        availabilityStatus: finalUserData.availabilityStatus,
        location: finalUserData.location,
        companyName: finalUserData.companyName,
        businessName: finalUserData.businessName,
        companyDescription: finalUserData.companyDescription,
        website: finalUserData.website,
        firebaseUid: finalUserData.firebaseUid
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Complete profile endpoint
app.post('/api/auth/complete-profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
  { name: 'workPhotos', maxCount: 20 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Parse the profileData JSON string from FormData
    let profileData = {};
    if (req.body.profileData) {
      try {
        profileData = JSON.parse(req.body.profileData);
      } catch (e) {
        console.error('Error parsing profileData JSON:', e);
        return res.status(400).json({ message: 'Invalid profile data format' });
      }
    } else {
      // Fallback to direct body parsing for backward compatibility
      profileData = req.body;
    }
    
    console.log('Completing profile for user:', userId);
    console.log('Profile data received:', profileData);
    console.log('Files received:', req.files);
    
    // Parse JSON fields that were stringified
    if (profileData.skills && typeof profileData.skills === 'string') {
      try {
        profileData.skills = JSON.parse(profileData.skills);
      } catch (e) {
        profileData.skills = [];
      }
    }
    
    if (profileData.languagesSpoken && typeof profileData.languagesSpoken === 'string') {
      try {
        profileData.languagesSpoken = JSON.parse(profileData.languagesSpoken);
      } catch (e) {
        profileData.languagesSpoken = [];
      }
    }
    
    if (profileData.workExperience && typeof profileData.workExperience === 'string') {
      try {
        profileData.workExperience = JSON.parse(profileData.workExperience);
      } catch (e) {
        profileData.workExperience = {};
      }
    }
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profileData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
      }
      
      if (req.files.certificates) {
        profileData.certificates = req.files.certificates.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`
        }));
      }
      
      if (req.files.workPhotos) {
        profileData.workPhotos = req.files.workPhotos.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`
        }));
      }
    }
    
    let updatedUser;
    
    if (isMongoConnected) {
      // Update user in MongoDB
      const updateData = {
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date()
      };
      
      // Ensure role field is consistent with userType
      if (profileData.userType) {
        updateData.role = profileData.userType;
      }
      
      // Ensure fullName is properly set
      if (profileData.firstName && profileData.lastName) {
        updateData.fullName = `${profileData.firstName} ${profileData.lastName}`;
      } else if (profileData.fullName) {
        updateData.fullName = profileData.fullName;
      }
      
      // Map mobile field variations
      if (profileData.mobile) {
        updateData.mobile = profileData.mobile;
        updateData.phoneNumber = profileData.mobile;
      } else if (profileData.phoneNumber) {
        updateData.mobile = profileData.phoneNumber;
        updateData.phoneNumber = profileData.phoneNumber;
      }
      
      updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      // Update user in in-memory storage
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updateData = {
        ...inMemoryUsers[userIndex],
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date()
      };
      
      // Ensure role field is consistent with userType
      if (profileData.userType) {
        updateData.role = profileData.userType;
      }
      
      // Ensure fullName is properly set
      if (profileData.firstName && profileData.lastName) {
        updateData.fullName = `${profileData.firstName} ${profileData.lastName}`;
      } else if (profileData.fullName) {
        updateData.fullName = profileData.fullName;
      }
      
      // Map mobile field variations
      if (profileData.mobile) {
        updateData.mobile = profileData.mobile;
        updateData.phoneNumber = profileData.mobile;
      } else if (profileData.phoneNumber) {
        updateData.mobile = profileData.phoneNumber;
        updateData.phoneNumber = profileData.phoneNumber;
      }
      
      inMemoryUsers[userIndex] = updateData;
      
      updatedUser = inMemoryUsers[userIndex];
    }
    
    console.log('Profile completed successfully for user:', updatedUser.email);
    console.log('Updated user profilePhoto:', updatedUser.profilePhoto);
    console.log('Profile data received:', profileData);
    console.log('Files received:', req.files);
    
    // Save user data to MongoDB
    if (updatedUser.firebaseUid) {
      const mongoData = {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName || (updatedUser.firstName && updatedUser.lastName ? `${updatedUser.firstName} ${updatedUser.lastName}` : ''),
        mobile: updatedUser.mobile,
        phoneNumber: updatedUser.phoneNumber || updatedUser.mobile,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
        userType: updatedUser.userType,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        bio: updatedUser.bio,
        description: updatedUser.description,
        skills: updatedUser.skills,
        workExperience: updatedUser.workExperience,
        languagesSpoken: updatedUser.languagesSpoken,
        availabilityStatus: updatedUser.availabilityStatus,
        hourlyRate: updatedUser.hourlyRate,
        businessName: updatedUser.businessName,
        businessType: updatedUser.businessType,
        companyName: updatedUser.companyName,
        website: updatedUser.website,
        profilePhoto: updatedUser.profilePhoto,
        certificates: updatedUser.certificates,
        workPhotos: updatedUser.workPhotos,
        averageRating: updatedUser.averageRating || 0,
        totalReviews: updatedUser.totalReviews || 0,
        completedJobs: updatedUser.completedJobs || 0,
        updatedAt: new Date().toISOString()
      };
      
      await saveUserToMongoDB(updatedUser.firebaseUid, mongoData);
    }
    
    res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        mobile: updatedUser.mobile,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
        userType: updatedUser.userType,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        skills: updatedUser.skills,
        workExperience: updatedUser.workExperience,
        languagesSpoken: updatedUser.languagesSpoken,
        availabilityStatus: updatedUser.availabilityStatus,
        hourlyRate: updatedUser.hourlyRate,
        description: updatedUser.description,
        businessName: updatedUser.businessName,
        profilePhoto: updatedUser.profilePhoto,
        certificates: updatedUser.certificates,
        workPhotos: updatedUser.workPhotos,
        firebaseUid: updatedUser.firebaseUid
      }
    });
    
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ 
      message: 'Failed to complete profile',
      error: error.message 
    });
  }
});

// Update profile endpoint
app.put('/api/auth/update-profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
  { name: 'workPhotos', maxCount: 20 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    console.log('Updating profile for user:', userId);
    console.log('Profile data received:', profileData);
    console.log('Files received:', req.files);
    
    // Parse array fields that come as comma-separated strings
    if (profileData.skills && typeof profileData.skills === 'string') {
      profileData.skills = profileData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }
    
    if (profileData.languagesSpoken && typeof profileData.languagesSpoken === 'string') {
      profileData.languagesSpoken = profileData.languagesSpoken.split(',').map(lang => lang.trim()).filter(lang => lang);
    }
    
    // Handle file uploads
    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profileData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
      }
      
      if (req.files.certificates) {
        profileData.certificates = req.files.certificates.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`
        }));
      }
      
      if (req.files.workPhotos) {
        profileData.workPhotos = req.files.workPhotos.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`
        }));
      }
    }
    
    let updatedUser;
    
    if (isMongoConnected) {
      // Update user in MongoDB
      const updateData = {
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date()
      };
      
      // Ensure role field is consistent with userType
      if (profileData.userType) {
        updateData.role = profileData.userType;
      }
      
      // Ensure fullName is properly set
      if (profileData.firstName && profileData.lastName) {
        updateData.fullName = `${profileData.firstName} ${profileData.lastName}`;
      } else if (profileData.fullName) {
        updateData.fullName = profileData.fullName;
      }
      
      // Map mobile field variations
      if (profileData.mobile) {
        updateData.mobile = profileData.mobile;
        updateData.phoneNumber = profileData.mobile;
      } else if (profileData.phoneNumber) {
        updateData.mobile = profileData.phoneNumber;
        updateData.phoneNumber = profileData.phoneNumber;
      }
      
      updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      // Update user in in-memory storage
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updateData = {
        ...inMemoryUsers[userIndex],
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date()
      };
      
      // Ensure role field is consistent with userType
      if (profileData.userType) {
        updateData.role = profileData.userType;
      }
      
      // Ensure fullName is properly set
      if (profileData.firstName && profileData.lastName) {
        updateData.fullName = `${profileData.firstName} ${profileData.lastName}`;
      } else if (profileData.fullName) {
        updateData.fullName = profileData.fullName;
      }
      
      // Map mobile field variations
      if (profileData.mobile) {
        updateData.mobile = profileData.mobile;
        updateData.phoneNumber = profileData.mobile;
      } else if (profileData.phoneNumber) {
        updateData.mobile = profileData.phoneNumber;
        updateData.phoneNumber = profileData.phoneNumber;
      }
      
      inMemoryUsers[userIndex] = updateData;
      
      updatedUser = inMemoryUsers[userIndex];
    }
    
    console.log('Profile updated successfully for user:', updatedUser.email);
    
    // Save user data to MongoDB
    if (updatedUser.firebaseUid) {
      const mongoData = {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName || (updatedUser.firstName && updatedUser.lastName ? `${updatedUser.firstName} ${updatedUser.lastName}` : ''),
        mobile: updatedUser.mobile,
        phoneNumber: updatedUser.phoneNumber || updatedUser.mobile,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
        userType: updatedUser.userType,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        bio: updatedUser.bio,
        description: updatedUser.description,
        skills: updatedUser.skills,
        workExperience: updatedUser.workExperience,
        languagesSpoken: updatedUser.languagesSpoken,
        availabilityStatus: updatedUser.availabilityStatus,
        hourlyRate: updatedUser.hourlyRate,
        businessName: updatedUser.businessName,
        businessType: updatedUser.businessType,
        companyName: updatedUser.companyName,
        website: updatedUser.website,
        profilePhoto: updatedUser.profilePhoto,
        certificates: updatedUser.certificates,
        workPhotos: updatedUser.workPhotos,
        averageRating: updatedUser.averageRating || 0,
        totalReviews: updatedUser.totalReviews || 0,
        completedJobs: updatedUser.completedJobs || 0,
        updatedAt: new Date().toISOString()
      };
      
      await saveUserToMongoDB(updatedUser.firebaseUid, mongoData);
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        mobile: updatedUser.mobile,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
        userType: updatedUser.userType,
        role: updatedUser.role,
        profileCompleted: updatedUser.profileCompleted,
        skills: updatedUser.skills,
        workExperience: updatedUser.workExperience,
        languagesSpoken: updatedUser.languagesSpoken,
        availabilityStatus: updatedUser.availabilityStatus,
        hourlyRate: updatedUser.hourlyRate,
        description: updatedUser.description,
        businessName: updatedUser.businessName,
        businessType: updatedUser.businessType,
        profilePhoto: updatedUser.profilePhoto,
        certificates: updatedUser.certificates,
        workPhotos: updatedUser.workPhotos,
        firebaseUid: updatedUser.firebaseUid
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

// Profile endpoints
app.get('/api/profiles/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    
    if (isMongoConnected) {
      user = await User.findById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      profile: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
        title: user.title || user.businessName || 'Professional Worker',
        mobile: user.mobile,
        phoneNumber: user.phoneNumber || user.mobile,
        address: user.address,
        location: user.address || user.location,
        pincode: user.pincode,
        userType: user.userType,
        role: user.role,
        profileCompleted: user.profileCompleted,
        skills: user.skills || [],
        workExperience: user.workExperience || {},
        languagesSpoken: user.languagesSpoken || [],
        availability: {
          status: user.availabilityStatus || 'online',
          workingHours: user.workingHours || {},
          responseTime: user.responseTime || 'Within 1 hour',
          preferredContact: user.preferredContact || 'Phone',
          notes: user.availabilityNotes
        },
        availabilityStatus: user.availabilityStatus || 'online',
        hourlyRate: user.hourlyRate,
        description: user.description,
        bio: user.bio || user.description,
        businessName: user.businessName,
        profilePhoto: user.profilePhoto,
        profilePicture: user.profilePhoto,
        rating: user.rating || 4.5,
        certificates: user.certificates || [],
        workPhotos: user.workPhotos || []
      }
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Jobs endpoints
// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    // Mock jobs data
    const jobs = [
      {
        id: 1,
        title: 'Bathroom Renovation',
        description: 'Complete bathroom renovation including plumbing, tiling, and electrical work.',
        category: 'Plumbing',
        location: 'Mumbai, Maharashtra',
        budget: { min: 25000, max: 35000 },
        duration: '5-7 days',
        postedBy: 'Rajesh Kumar',
        postedById: 'owner1',
        urgency: 'High',
        skills: ['Plumbing', 'Tiling', 'Electrical'],
        status: 'open',
        applicants: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        title: 'House Painting - 3BHK',
        description: 'Interior and exterior painting for a 3BHK apartment.',
        category: 'Painting',
        location: 'Delhi, Delhi',
        budget: { min: 15000, max: 20000 },
        duration: '3-4 days',
        postedBy: 'Priya Sharma',
        postedById: 'owner2',
        urgency: 'Medium',
        skills: ['Painting', 'Wall Preparation'],
        status: 'open',
        applicants: 8,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      }
    ];
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Post a new job
app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    const jobData = req.body;
    
    // Mock job creation
    const newJob = {
      id: Date.now(),
      ...jobData,
      postedById: req.user.userId,
      status: 'open',
      applicants: 0,
      createdAt: new Date()
    };
    
    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs by owner
app.get('/api/jobs/owner/:ownerId', authenticateToken, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Mock owner jobs data
    const ownerJobs = [
      {
        id: 1,
        title: 'Kitchen Cabinet Installation',
        description: 'Custom kitchen cabinet installation with modern fittings.',
        category: 'Carpentry',
        location: 'Pune, Maharashtra',
        budget: { min: 30000, max: 40000 },
        duration: '4-5 days',
        urgency: 'Medium',
        skills: ['Carpentry', 'Cabinet Installation'],
        status: 'open',
        applicants: 3,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];
    
    res.json(ownerJobs);
  } catch (error) {
    console.error('Error fetching owner jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for a job
app.post('/api/jobs/:jobId/apply', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message } = req.body;
    
    // Mock application creation
    const application = {
      id: Date.now(),
      jobId: parseInt(jobId),
      workerId: req.user.userId,
      message,
      status: 'pending',
      appliedAt: new Date()
    };
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/profiles/earnings', authenticateToken, async (req, res) => {
  try {
    // Mock earnings data for demo
    const earnings = {
      totalEarnings: 15750,
      thisMonth: 3250,
      lastMonth: 2890,
      completedJobs: 23,
      pendingPayments: 450,
      averageRating: 4.8,
      monthlyData: [
        { month: 'Jan', earnings: 2100 },
        { month: 'Feb', earnings: 2450 },
        { month: 'Mar', earnings: 2890 },
        { month: 'Apr', earnings: 3250 }
      ]
    };
    
    res.json({ earnings });
  } catch (error) {
    console.error('Fetch earnings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update owner profile
app.put('/api/owner/profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    console.log('Updating owner profile for user:', userId);
    console.log('Profile data received:', profileData);
    console.log('Files received:', req.files);
    
    // Handle file uploads
    if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
      profileData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
    }
    
    let updatedUser;
    
    if (isMongoConnected) {
      // Update user in MongoDB
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...profileData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      // Update user in in-memory storage
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      inMemoryUsers[userIndex] = {
        ...inMemoryUsers[userIndex],
        ...profileData,
        updatedAt: new Date()
      };
      
      updatedUser = inMemoryUsers[userIndex];
    }
    
    console.log('Owner profile updated successfully for user:', updatedUser.email);
    console.log('Updated user data:', updatedUser);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update owner profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Posts routes
const postsRoutes = require('./routes/posts');
app.use('/api/posts', postsRoutes);

// Users routes
const usersRoutes = require('./routes/users');
// Set global references for users routes
usersRoutes.setGlobalReferences({
  isMongoConnected,
  inMemoryUsers,
  saveUserToMongoDB
});
app.use('/api/users', usersRoutes);

// Review API endpoints
// Create a new review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { workerId, rating, comment } = req.body;
    const reviewerId = req.user.userId;
    
    // Validate input
    if (!workerId || !rating || !comment) {
      return res.status(400).json({ message: 'Worker ID, rating, and comment are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Get reviewer information
    let reviewer;
    if (isMongoConnected) {
      reviewer = await User.findById(reviewerId);
    } else {
      reviewer = inMemoryUsers.find(u => u._id === reviewerId);
    }
    
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    
    // Check if reviewer has already reviewed this worker
    let existingReview;
    if (isMongoConnected) {
      existingReview = await Review.findOne({ reviewerId, workerId });
    } else {
      existingReview = inMemoryReviews.find(r => r.reviewerId === reviewerId && r.workerId === workerId);
    }
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this worker' });
    }
    
    const reviewData = {
      reviewerId,
      workerId,
      rating: parseInt(rating),
      comment,
      reviewerName: reviewer.fullName || `${reviewer.firstName} ${reviewer.lastName}`.trim() || 'Anonymous',
      reviewerProfilePicture: reviewer.profilePhoto || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let newReview;
    if (isMongoConnected) {
      newReview = new Review(reviewData);
      await newReview.save();
    } else {
      newReview = {
        _id: Date.now().toString(),
        ...reviewData
      };
      inMemoryReviews.push(newReview);
    }
    
    res.status(201).json({
      message: 'Review created successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a specific worker
app.get('/api/reviews/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    let reviews;
    let totalReviews;
    
    if (isMongoConnected) {
      const skip = (page - 1) * limit;
      reviews = await Review.find({ workerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      totalReviews = await Review.countDocuments({ workerId });
    } else {
      const workerReviews = inMemoryReviews.filter(r => r.workerId === workerId);
      totalReviews = workerReviews.length;
      const startIndex = (page - 1) * limit;
      reviews = workerReviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(startIndex, startIndex + parseInt(limit));
    }
    
    // Calculate average rating
    const allWorkerReviews = isMongoConnected 
      ? await Review.find({ workerId })
      : inMemoryReviews.filter(r => r.workerId === workerId);
    
    const averageRating = allWorkerReviews.length > 0 
      ? allWorkerReviews.reduce((sum, review) => sum + review.rating, 0) / allWorkerReviews.length
      : 0;
    
    res.json({
      reviews,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Get worker reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews written by a specific user (for "My Reviews" section)
app.get('/api/reviews/my-reviews', authenticateToken, async (req, res) => {
  try {
    const reviewerId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    
    let reviews;
    let totalReviews;
    
    if (isMongoConnected) {
      const skip = (page - 1) * limit;
      reviews = await Review.find({ reviewerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      totalReviews = await Review.countDocuments({ reviewerId });
    } else {
      const userReviews = inMemoryReviews.filter(r => r.reviewerId === reviewerId);
      totalReviews = userReviews.length;
      const startIndex = (page - 1) * limit;
      reviews = userReviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(startIndex, startIndex + parseInt(limit));
    }
    
    // Get worker information for each review
    const reviewsWithWorkerInfo = await Promise.all(reviews.map(async (review) => {
      let worker;
      if (isMongoConnected) {
        worker = await User.findById(review.workerId).select('-password');
      } else {
        worker = inMemoryUsers.find(u => u._id === review.workerId);
      }
      
      return {
        ...review.toObject ? review.toObject() : review,
        worker: worker ? {
          id: worker._id,
          name: worker.fullName || `${worker.firstName} ${worker.lastName}`.trim(),
          profilePicture: worker.profilePhoto || null
        } : null
      };
    }));
    
    res.json({
      reviews: reviewsWithWorkerInfo,
      totalReviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews received by a worker (for worker dashboard)
app.get('/api/reviews/received', authenticateToken, async (req, res) => {
  try {
    const workerId = req.user?.userId;
  
  if (!workerId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
    const { page = 1, limit = 10 } = req.query;
    
    let reviews;
    let totalReviews;
    
    if (isMongoConnected) {
      const skip = (page - 1) * limit;
      reviews = await Review.find({ workerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      totalReviews = await Review.countDocuments({ workerId });
    } else {
      const workerReviews = inMemoryReviews.filter(r => r.workerId === workerId);
      totalReviews = workerReviews.length;
      const startIndex = (page - 1) * limit;
      reviews = workerReviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(startIndex, startIndex + parseInt(limit));
    }
    
    // Calculate average rating
    const allWorkerReviews = isMongoConnected 
      ? await Review.find({ workerId })
      : inMemoryReviews.filter(r => r.workerId === workerId);
    
    const averageRating = allWorkerReviews.length > 0 
      ? allWorkerReviews.reduce((sum, review) => sum + review.rating, 0) / allWorkerReviews.length
      : 0;
    
    res.json({
      reviews,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Get received reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
// Search workers endpoint
app.get('/api/search/workers', authenticateToken, async (req, res) => {
  try {
    const { skills, location, minRate, maxRate } = req.query;
    
    let workers = [];
    
    if (isMongoConnected) {
      // Search in MongoDB
      const query = {
        userType: 'worker',
        profileCompleted: true
      };
      
      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        query.skills = {
          $in: skillsArray.map(skill => new RegExp(skill, 'i'))
        };
      }
      
      if (location) {
        query.$or = [
          { address: new RegExp(location, 'i') },
          { location: new RegExp(location, 'i') }
        ];
      }
      
      if (minRate || maxRate) {
        query.hourlyRate = {};
        if (minRate) query.hourlyRate.$gte = parseFloat(minRate);
        if (maxRate) query.hourlyRate.$lte = parseFloat(maxRate);
      }
      
      workers = await User.find(query).select('-password');
    } else {
      // Search in in-memory storage
      workers = inMemoryUsers.filter(user => {
        if (user.userType !== 'worker' || !user.profileCompleted) return false;
        
        // Skills filter
        if (skills && user.skills) {
          const skillsArray = skills.split(',').map(skill => skill.trim().toLowerCase());
          const userSkills = Array.isArray(user.skills) ? user.skills : [];
          const hasMatchingSkill = skillsArray.some(searchSkill => 
            userSkills.some(userSkill => 
              userSkill.toLowerCase().includes(searchSkill)
            )
          );
          if (!hasMatchingSkill) return false;
        }
        
        // Location filter
        if (location) {
          const locationLower = location.toLowerCase();
          const addressMatch = user.address && user.address.toLowerCase().includes(locationLower);
          const locationMatch = user.location && user.location.toLowerCase().includes(locationLower);
          if (!addressMatch && !locationMatch) return false;
        }
        
        // Rate filter
        if (minRate && user.hourlyRate && user.hourlyRate < parseFloat(minRate)) return false;
        if (maxRate && user.hourlyRate && user.hourlyRate > parseFloat(maxRate)) return false;
        
        return true;
      });
    }
    
    // Format response data
    const formattedWorkers = workers.map(worker => ({
      id: worker._id || worker.id,
      name: worker.fullName || `${worker.firstName} ${worker.lastName}`.trim(),
      profilePicture: worker.profilePhoto || null,
      rating: worker.rating || 4.5, // Default rating if not available
      location: worker.address || worker.location || 'Location not specified',
      hourlyRate: worker.hourlyRate || 0,
      skills: worker.skills || [],
      description: worker.description || worker.bio || '',
      availability: worker.availabilityStatus || 'available',
      workExperience: worker.workExperience || {},
      languagesSpoken: worker.languagesSpoken || []
    }));
    
    res.json(formattedWorkers);
  } catch (error) {
    console.error('Worker search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Saved Workers endpoints

// Get saved workers for a user
app.get('/api/saved-workers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    let user;
    
    if (isMongoConnected) {
      user = await User.findById(userId).select('savedWorkers');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get details of saved workers
      const savedWorkers = await User.find({
        _id: { $in: user.savedWorkers },
        userType: 'worker'
      }).select('-password');
      
      const formattedWorkers = savedWorkers.map(worker => ({
        id: worker._id,
        name: worker.fullName || `${worker.firstName} ${worker.lastName}`.trim(),
        profilePicture: worker.profilePhoto || null,
        rating: worker.rating || 4.5,
        location: worker.address || worker.location || 'Location not specified',
        hourlyRate: worker.hourlyRate || 0,
        skills: worker.skills || [],
        description: worker.description || worker.bio || '',
        availability: worker.availabilityStatus || 'available'
      }));
      
      res.json(formattedWorkers);
    } else {
      // In-memory implementation
      user = inMemoryUsers.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const savedWorkerIds = user.savedWorkers || [];
      const savedWorkers = inMemoryUsers.filter(u => 
        savedWorkerIds.includes(u._id) && u.userType === 'worker'
      );
      
      const formattedWorkers = savedWorkers.map(worker => ({
        id: worker._id,
        name: worker.fullName || `${worker.firstName} ${worker.lastName}`.trim(),
        profilePicture: worker.profilePhoto || null,
        rating: worker.rating || 4.5,
        location: worker.address || worker.location || 'Location not specified',
        hourlyRate: worker.hourlyRate || 0,
        skills: worker.skills || [],
        description: worker.description || worker.bio || '',
        availability: worker.availabilityStatus || 'available'
      }));
      
      res.json(formattedWorkers);
    }
  } catch (error) {
    console.error('Get saved workers error:', error);
    res.status(500).json({ message: 'Failed to get saved workers', error: error.message });
  }
});

// Save a worker
app.post('/api/saved-workers/:workerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workerId } = req.params;
    
    if (isMongoConnected) {
      // Check if worker exists
      const worker = await User.findById(workerId);
      if (!worker || worker.userType !== 'worker') {
        return res.status(404).json({ message: 'Worker not found' });
      }
      
      // Add worker to saved list if not already saved
      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedWorkers: workerId } },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'Worker saved successfully', saved: true });
    } else {
      // In-memory implementation
      const user = inMemoryUsers.find(u => u._id === userId);
      const worker = inMemoryUsers.find(u => u._id === workerId && u.userType === 'worker');
      
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.savedWorkers) {
        user.savedWorkers = [];
      }
      
      if (!user.savedWorkers.includes(workerId)) {
        user.savedWorkers.push(workerId);
      }
      
      res.json({ message: 'Worker saved successfully', saved: true });
    }
  } catch (error) {
    console.error('Save worker error:', error);
    res.status(500).json({ message: 'Failed to save worker', error: error.message });
  }
});

// Remove a saved worker
app.delete('/api/saved-workers/:workerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workerId } = req.params;
    
    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { savedWorkers: workerId } },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'Worker removed from saved list', saved: false });
    } else {
      // In-memory implementation
      const user = inMemoryUsers.find(u => u._id === userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.savedWorkers) {
        user.savedWorkers = user.savedWorkers.filter(id => id !== workerId);
      }
      
      res.json({ message: 'Worker removed from saved list', saved: false });
    }
  } catch (error) {
    console.error('Remove saved worker error:', error);
    res.status(500).json({ message: 'Failed to remove saved worker', error: error.message });
  }
});

// Check if a worker is saved
app.get('/api/saved-workers/check/:workerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workerId } = req.params;
    
    if (isMongoConnected) {
      const user = await User.findById(userId).select('savedWorkers');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const isSaved = user.savedWorkers && user.savedWorkers.includes(workerId);
      res.json({ saved: isSaved });
    } else {
      // In-memory implementation
      const user = inMemoryUsers.find(u => u._id === userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const isSaved = user.savedWorkers && user.savedWorkers.includes(workerId);
      res.json({ saved: isSaved });
    }
  } catch (error) {
    console.error('Check saved worker error:', error);
    res.status(500).json({ message: 'Failed to check saved worker', error: error.message });
  }
});

// Chat endpoints

// Get conversations for a user
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    let conversations;

    if (isMongoConnected) {
      conversations = await Conversation.find({
        participants: userId
      }).sort({ updatedAt: -1 });
    } else {
      conversations = inMemoryConversations.filter(conv => 
        conv.participants.includes(userId)
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    // Populate participant details and calculate unread count
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(p => p !== userId);
        let otherParticipant;
        let unreadCount = 0;
        
        if (isMongoConnected) {
          otherParticipant = await User.findById(otherParticipantId).select('-password');
          // Count unread messages in this conversation for the current user
          unreadCount = await Message.countDocuments({
            conversationId: conv._id.toString(),
            sender: { $ne: userId },
            read: false
          });
        } else {
          otherParticipant = inMemoryUsers.find(u => u._id === otherParticipantId);
          // Count unread messages in memory
          unreadCount = inMemoryMessages.filter(msg => 
            msg.conversationId === conv._id &&
            msg.sender !== userId &&
            !msg.read
          ).length;
        }

        return {
          ...conv.toObject ? conv.toObject() : conv,
          unreadCount,
          otherParticipant: {
            _id: otherParticipant?._id,
            fullName: otherParticipant?.fullName || `${otherParticipant?.firstName} ${otherParticipant?.lastName}`.trim(),
            profilePhoto: otherParticipant?.profilePhoto,
            role: otherParticipant?.role
          }
        };
      })
    );

    res.json(populatedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
app.get('/api/chat/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    let messages;
    if (isMongoConnected) {
      messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      const allMessages = inMemoryMessages.filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      messages = allMessages.slice(skip, skip + limit);
    }

    // Populate sender details
    const populatedMessages = await Promise.all(
      messages.map(async (msg) => {
        let sender;
        if (isMongoConnected) {
          sender = await User.findById(msg.sender).select('fullName firstName lastName profilePhoto role');
        } else {
          sender = inMemoryUsers.find(u => u._id === msg.sender);
        }

        return {
          ...msg.toObject ? msg.toObject() : msg,
          sender: {
            _id: sender?._id,
            fullName: sender?.fullName || `${sender?.firstName} ${sender?.lastName}`.trim(),
            profilePhoto: sender?.profilePhoto,
            role: sender?.role
          }
        };
      })
    );

    res.json({
      messages: populatedMessages.reverse(), // Return in chronological order
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
app.post('/api/chat/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, type = 'text' } = req.body;
    const senderId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Create new message
    const newMessage = {
      _id: new Date().getTime().toString(),
      conversationId,
      sender: senderId,
      content: message.trim(),
      type,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      const savedMessage = await Message.create(newMessage);
      newMessage._id = savedMessage._id;
    } else {
      inMemoryMessages.push(newMessage);
    }

    // Update conversation's last message
    const lastMessageData = {
      content: message.trim(),
      sender: senderId,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: lastMessageData,
        updatedAt: new Date()
      });
    } else {
      const conversation = inMemoryConversations.find(c => c._id === conversationId);
      if (conversation) {
        conversation.lastMessage = lastMessageData;
        conversation.updatedAt = new Date();
      }
    }

    // Populate sender details for real-time emission
    let sender;
    if (isMongoConnected) {
      sender = await User.findById(senderId).select('fullName firstName lastName profilePhoto role');
    } else {
      sender = inMemoryUsers.find(u => u._id === senderId);
    }

    const populatedMessage = {
      ...newMessage,
      sender: {
        _id: sender?._id,
        fullName: sender?.fullName || `${sender?.firstName} ${sender?.lastName}`.trim(),
        profilePhoto: sender?.profilePhoto,
        role: sender?.role
      }
    };

    // Emit real-time message to conversation room
    io.to(conversationId).emit('new_message', populatedMessage);
    
    // Emit conversation update to participants
    const conversation = isMongoConnected 
      ? await Conversation.findById(conversationId)
      : inMemoryConversations.find(c => c._id === conversationId);
    
    if (conversation) {
      conversation.participants.forEach(participantId => {
        const socketId = connectedUsers.get(participantId);
        if (socketId) {
          io.to(socketId).emit('conversation_updated', {
            conversationId,
            lastMessage: lastMessageData,
            updatedAt: new Date()
          });
        }
      });
      
      // Create notification for the recipient (other participants)
      const otherParticipants = conversation.participants.filter(p => p !== senderId);
      
      for (const participantId of otherParticipants) {
        const notification = {
          _id: new Date().getTime().toString() + Math.random(),
          userId: participantId,
          type: 'message',
          title: 'New Message',
          message: `${sender?.fullName || `${sender?.firstName} ${sender?.lastName}`.trim()} sent you a message: ${message.trim().substring(0, 50)}${message.trim().length > 50 ? '...' : ''}`,
          read: false,
          relatedId: conversationId,
          createdAt: new Date()
        };

        if (isMongoConnected) {
          await Notification.create(notification);
        } else {
          inMemoryNotifications.push(notification);
        }

        // Emit real-time notification to the recipient
        const recipientSocketId = connectedUsers.get(participantId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new_notification', notification);
        }
      }
    }

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new conversation
app.post('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantId, initialMessage } = req.body;
    const userId = req.user.userId;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Check if conversation already exists
    let existingConversation;
    if (isMongoConnected) {
      existingConversation = await Conversation.findOne({
        participants: { $all: [userId, participantId] }
      });
    } else {
      existingConversation = inMemoryConversations.find(conv => 
        conv.participants.includes(userId) && conv.participants.includes(participantId)
      );
    }

    if (existingConversation) {
      // Populate otherParticipant details for existing conversation
      let otherParticipant;
      if (isMongoConnected) {
        otherParticipant = await User.findById(participantId).select('_id fullName profilePhoto role');
      } else {
        otherParticipant = inMemoryUsers.find(u => u._id === participantId);
        if (otherParticipant) {
          otherParticipant = {
            _id: otherParticipant._id,
            fullName: otherParticipant.fullName,
            profilePhoto: otherParticipant.profilePhoto,
            role: otherParticipant.role
          };
        }
      }

      const populatedExistingConversation = {
        ...existingConversation.toObject ? existingConversation.toObject() : existingConversation,
        otherParticipant: otherParticipant || {
          _id: participantId,
          fullName: 'Unknown User',
          profilePhoto: null,
          role: 'worker'
        }
      };

      return res.json(populatedExistingConversation);
    }

    // Create new conversation
    const newConversation = {
      _id: new Date().getTime().toString(),
      participants: [userId, participantId],
      lastMessage: initialMessage ? {
        content: initialMessage,
        sender: userId,
        createdAt: new Date()
      } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected) {
      const savedConversation = await Conversation.create(newConversation);
      newConversation._id = savedConversation._id;
    } else {
      inMemoryConversations.push(newConversation);
    }

    // Send initial message if provided
    if (initialMessage) {
      const messageData = {
        _id: new Date().getTime().toString() + '1',
        conversationId: newConversation._id,
        sender: userId,
        content: initialMessage,
        type: 'text',
        read: false,
        createdAt: new Date()
      };

      if (isMongoConnected) {
        await Message.create(messageData);
      } else {
        inMemoryMessages.push(messageData);
      }

      // Create notification for the recipient
      const sender = isMongoConnected
        ? await User.findById(userId).select('fullName firstName lastName')
        : inMemoryUsers.find(u => u._id === userId);
      
      const senderName = sender?.fullName || `${sender?.firstName} ${sender?.lastName}`.trim();
      
      const notification = {
        _id: new Date().getTime().toString() + Math.random(),
        userId: participantId,
        type: 'message',
        title: 'New Message',
        message: `${senderName} sent you a message: ${initialMessage.substring(0, 50)}${initialMessage.length > 50 ? '...' : ''}`,
        read: false,
        relatedId: newConversation._id,
        createdAt: new Date()
      };

      if (isMongoConnected) {
        await Notification.create(notification);
      } else {
        inMemoryNotifications.push(notification);
      }
    }

    // Populate otherParticipant details for the response
    let otherParticipant;
    if (isMongoConnected) {
      otherParticipant = await User.findById(participantId).select('_id fullName profilePhoto role');
    } else {
      otherParticipant = inMemoryUsers.find(u => u._id === participantId);
      if (otherParticipant) {
        otherParticipant = {
          _id: otherParticipant._id,
          fullName: otherParticipant.fullName,
          profilePhoto: otherParticipant.profilePhoto,
          role: otherParticipant.role
        };
      }
    }

    const populatedConversation = {
      ...newConversation,
      otherParticipant: otherParticipant || {
        _id: participantId,
        fullName: 'Unknown User',
        profilePhoto: null,
        role: 'worker'
      }
    };

    res.json(populatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
app.patch('/api/chat/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    if (isMongoConnected) {
      await Message.updateMany(
        { conversationId, sender: { $ne: userId } },
        { read: true }
      );
      
      // Also mark related message notifications as read
      await Notification.updateMany(
        { userId, type: 'message', relatedId: conversationId, read: false },
        { read: true }
      );
    } else {
      inMemoryMessages.forEach(msg => {
        if (msg.conversationId === conversationId && msg.sender !== userId) {
          msg.read = true;
        }
      });
      
      // Also mark related message notifications as read
      inMemoryNotifications.forEach(notif => {
        if (notif.userId === userId && notif.type === 'message' && notif.relatedId === conversationId && !notif.read) {
          notif.read = true;
        }
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Notification endpoints

// Get notifications for a user
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let notifications;
    if (isMongoConnected) {
      notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      const userNotifications = inMemoryNotifications.filter(notif => notif.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      notifications = userNotifications.slice(skip, skip + limit);
    }

    const unreadCount = isMongoConnected
      ? await Notification.countDocuments({ userId, read: false })
      : inMemoryNotifications.filter(notif => notif.userId === userId && !notif.read).length;

    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (isMongoConnected) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      const notification = inMemoryNotifications.find(notif => notif._id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected) {
      await Notification.updateMany({ userId }, { read: true });
    } else {
      inMemoryNotifications.forEach(notif => {
        if (notif.userId === userId) {
          notif.read = true;
        }
      });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (isMongoConnected) {
      await Notification.findByIdAndDelete(notificationId);
    } else {
      const index = inMemoryNotifications.findIndex(notif => notif._id === notificationId);
      if (index > -1) {
        inMemoryNotifications.splice(index, 1);
      }
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB' : 'In-Memory'
  });
});

// Debug endpoint to see users
app.get('/api/debug/users', (req, res) => {
  if (isMongoConnected) {
    res.json({ message: 'Using MongoDB - check database directly' });
  } else {
    const sanitizedUsers = inMemoryUsers.map(user => ({
      id: user._id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      profileCompleted: user.profileCompleted,
      skills: user.skills,
      firstName: user.firstName,
      lastName: user.lastName
    }));
    res.json({ users: sanitizedUsers, count: inMemoryUsers.length });
  }
});

// Create test users endpoint
app.post('/api/debug/create-test-users', async (req, res) => {
  try {
    // Clear existing users first
    inMemoryUsers.length = 0;
    
    // Create test worker users
    const testUsers = [
      {
        _id: 'test-worker-1',
        email: 'worker1@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'worker',
        userType: 'worker',
        profileCompleted: true,
        fullName: 'John Smith',
        skills: ['plumbing', 'electrical', 'carpentry'],
        workExperience: '5 years',
        address: 'New York, NY',
        pincode: '10001',
        languagesSpoken: ['English', 'Spanish'],
        availabilityStatus: 'online',
        hourlyRate: 25,
        rating: 4.5,
        completedJobs: 15,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'test-worker-2',
        email: 'worker2@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'worker',
        userType: 'worker',
        profileCompleted: true,
        fullName: 'Maria Garcia',
        skills: ['cleaning', 'housekeeping', 'organizing'],
        workExperience: '3 years',
        address: 'Los Angeles, CA',
        pincode: '90001',
        languagesSpoken: ['English', 'Spanish'],
        availabilityStatus: 'online',
        hourlyRate: 20,
        rating: 4.8,
        completedJobs: 25,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'test-worker-3',
        email: 'worker3@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'worker',
        userType: 'worker',
        profileCompleted: true,
        fullName: 'David Johnson',
        skills: ['gardening', 'landscaping', 'lawn care'],
        workExperience: '7 years',
        address: 'Chicago, IL',
        pincode: '60601',
        languagesSpoken: ['English'],
        availabilityStatus: 'online',
        hourlyRate: 30,
        rating: 4.3,
        completedJobs: 12,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'test-client-1',
        email: 'client@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'client',
        userType: 'client',
        profileCompleted: true,
        name: 'Test Client',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Add test users to in-memory storage
    inMemoryUsers.push(...testUsers);
    
    res.json({
      message: 'Test users created successfully',
      userCount: inMemoryUsers.length,
      users: testUsers.map(u => ({ id: u._id, email: u.email, fullName: u.fullName || u.name, skills: u.skills }))
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ message: 'Error creating test users', error: error.message });
  }
});

// Test login endpoint for demo purposes
app.post('/api/debug/test-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user in memory
    const user = inMemoryUsers.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        fullName: `${user.firstName} ${user.lastName}`,
        profilePhoto: user.profilePhoto
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Error in test login:', error);
    res.status(500).json({ message: 'Error in test login', error: error.message });
  }
});



// Clear all user data endpoint
app.delete('/api/admin/clear-all-data', async (req, res) => {
  try {
    console.log('Clearing all user data and uploaded files...');
    
    // Clear database users
    if (isMongoConnected) {
      await User.deleteMany({});
      console.log('Cleared all users from MongoDB');
    }
    
    // Clear in-memory users
    inMemoryUsers = [];
    console.log('Cleared all users from in-memory storage');
    
    // Clear all uploaded files
    const uploadsPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
      console.log(`Deleted ${files.length} uploaded files`);
    }
    
    res.json({ 
      message: 'All user data and uploaded files cleared successfully',
      deletedUsers: 'all',
      deletedFiles: 'all'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ message: 'Error clearing data', error: error.message });
  }
});

// Get data statistics endpoint
app.get('/api/admin/data-stats', async (req, res) => {
  try {
    let userCount = 0;
    let fileCount = 0;
    
    // Count users
    if (isMongoConnected) {
      userCount = await User.countDocuments();
    } else {
      userCount = inMemoryUsers.length;
    }
    
    // Count uploaded files
    const uploadsPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      fileCount = files.filter(file => {
        const filePath = path.join(uploadsPath, file);
        return fs.statSync(filePath).isFile();
      }).length;
    }
    
    res.json({
       userCount,
       fileCount,
       storageType: isMongoConnected ? 'MongoDB' : 'In-Memory'
     });
   } catch (error) {
     console.error('Error getting data stats:', error);
     res.status(500).json({ message: 'Error getting data stats', error: error.message });
   }
 });

// Connect to MongoDB (optional - will work without DB for demo)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      isMongoConnected = true;
    })
    .catch(err => {
      console.log('MongoDB connection error:', err);
      console.log('Falling back to in-memory storage');
    });
} else {
  console.log('No MongoDB URI provided - using in-memory storage for demo');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export inMemoryUsers for use in other modules
module.exports = { inMemoryUsers };