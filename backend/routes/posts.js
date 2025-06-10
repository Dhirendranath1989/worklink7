const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// In-memory storage for posts (replace with database in production)
let posts = [];
let postIdCounter = 1;

// Get all posts
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Sort posts by creation date (newest first)
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ posts: sortedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;
    
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Post must have content or images' });
    }

    // Fetch complete user information
    let userInfo;
    try {
      const isMongoConnected = mongoose.connection.readyState === 1;
      
      if (isMongoConnected) {
        // Try to get user from MongoDB first
        console.log(`Looking for user ${userId} in MongoDB`);
        userInfo = await User.findById(userId).select('-password');
        if (userInfo) {
          console.log(`Found user in MongoDB:`, { id: userInfo._id, fullName: userInfo.fullName, profilePhoto: userInfo.profilePhoto });
        } else {
          console.log(`User ${userId} not found in MongoDB`);
        }
      } else {
        // Fallback to in-memory storage
        const { inMemoryUsers } = require('../server');
        userInfo = inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        if (userInfo) {
          console.log(`Found user in memory:`, { id: userInfo._id || userInfo.id, fullName: userInfo.fullName, profilePhoto: userInfo.profilePhoto });
        } else {
          console.log(`User ${userId} not found in inMemoryUsers. Available users:`, inMemoryUsers.map(u => ({ id: u._id || u.id, email: u.email, fullName: u.fullName })));
        }
      }
      
      if (!userInfo) {
        // Fallback to basic info from token
        userInfo = {
          _id: userId,
          fullName: 'User',
          profilePhoto: null
        };
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Fallback to basic info
      userInfo = {
        _id: userId,
        fullName: 'User',
        profilePhoto: null
      };
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newPost = {
      _id: postIdCounter++,
      content: content || '',
      images,
      author: {
        _id: userId,
        fullName: userInfo.fullName || userInfo.firstName + ' ' + userInfo.lastName || 'User',
        profilePhoto: userInfo.profilePhoto || null
      },
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.push(newPost);

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a post
router.put('/:postId', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, existingImages } = req.body;
    const userId = req.user.userId;

    const postIndex = posts.findIndex(p => p._id == postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];
    if (post.author._id !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Process new uploaded images
    const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Combine existing images with new ones
    const allImages = [...(existingImages ? [existingImages].flat() : []), ...newImages];

    posts[postIndex] = {
      ...post,
      content: content || '',
      images: allImages,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Post updated successfully',
      post: posts[postIndex]
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const postIndex = posts.findIndex(p => p._id == postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];
    if (post.author._id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated image files
    if (post.images && post.images.length > 0) {
      post.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '../', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    posts.splice(postIndex, 1);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const postIndex = posts.findIndex(p => p._id == postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    posts[postIndex] = {
      ...post,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      isLiked: likeIndex === -1,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const postIndex = posts.findIndex(p => p._id == postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Debug: Log user data to see what's available
    console.log('User data from token:', req.user);
    console.log('User profilePhoto:', req.user.profilePhoto);

    // Fetch complete user information
    let userInfo;
    try {
      const isMongoConnected = mongoose.connection.readyState === 1;
      
      if (isMongoConnected) {
        // Try to get user from MongoDB first
        console.log(`Looking for comment author ${userId} in MongoDB`);
        userInfo = await User.findById(userId).select('-password');
        if (userInfo) {
          console.log(`Found comment author in MongoDB:`, { id: userInfo._id, fullName: userInfo.fullName, profilePhoto: userInfo.profilePhoto });
        } else {
          console.log(`Comment author ${userId} not found in MongoDB`);
        }
      } else {
        // Fallback to in-memory storage
        const { inMemoryUsers } = require('../server');
        userInfo = inMemoryUsers.find(u => (u._id || u.id) === userId);
        
        if (userInfo) {
          console.log(`Found comment author in memory:`, { id: userInfo._id || userInfo.id, fullName: userInfo.fullName, profilePhoto: userInfo.profilePhoto });
        } else {
          console.log(`Comment author ${userId} not found in inMemoryUsers. Available users:`, inMemoryUsers.map(u => ({ id: u._id || u.id, email: u.email, fullName: u.fullName })));
        }
      }
      
      if (!userInfo) {
        // Fallback to basic info from token
        userInfo = {
          _id: userId,
          fullName: req.user.fullName || 'User',
          profilePhoto: req.user.profilePhoto || null
        };
      }
    } catch (error) {
      console.error('Error fetching user info for comment:', error);
      // Fallback to basic info from token
      userInfo = {
        _id: userId,
        fullName: req.user.fullName || 'User',
        profilePhoto: req.user.profilePhoto || null
      };
    }

    console.log('User info from memory:', userInfo);
    console.log('User info profilePhoto:', userInfo.profilePhoto);

    const comment = {
      _id: Date.now(),
      content: content.trim(),
      author: {
        _id: userId,
        fullName: userInfo.fullName || userInfo.firstName + ' ' + userInfo.lastName || req.user.fullName || 'User',
        profilePhoto: userInfo.profilePhoto || null
      },
      createdAt: new Date().toISOString()
    };

    console.log('Created comment:', comment);
    console.log('Comment author profilePhoto:', comment.author.profilePhoto);

    posts[postIndex].comments.push(comment);
    posts[postIndex].updatedAt = new Date().toISOString();

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = posts.find(p => p._id == postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ comments: post.comments || [] });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;