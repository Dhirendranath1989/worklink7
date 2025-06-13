const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const ConsolidatedUser = require('../models/ConsolidatedUser');
const Post = require('../models/Post');
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

// Get all posts
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch posts from MongoDB, sorted by creation date (newest first)
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch posts by specific user, sorted by creation date (newest first)
    const posts = await Post.find({ 'author._id': userId }).sort({ createdAt: -1 });
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's posts
router.get('/my-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch posts by current user, sorted by creation date (newest first)
    const posts = await Post.find({ 'author._id': userId }).sort({ createdAt: -1 });
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching my posts:', error);
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
        userInfo = await ConsolidatedUser.findById(userId).select('-password');
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

    const newPost = new Post({
      content: content || '',
      images,
      author: {
        _id: userId,
        fullName: userInfo.fullName || userInfo.firstName + ' ' + userInfo.lastName || 'User',
        profilePhoto: userInfo.profilePhoto || null
      },
      likes: [],
      comments: []
    });

    const savedPost = await newPost.save();

    res.status(201).json({
      message: 'Post created successfully',
      post: savedPost
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

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author._id !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    // Process new uploaded images
    const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Combine existing images with new ones
    const allImages = [...(existingImages ? [existingImages].flat() : []), ...newImages];

    post.content = content || '';
    post.images = allImages;
    
    const updatedPost = await post.save();

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
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

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

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

    await Post.findByIdAndDelete(postId);

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

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    const updatedPost = await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      liked: likeIndex === -1,
      likesCount: updatedPost.likes.length
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

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get user info
    let userInfo;
    try {
      userInfo = await ConsolidatedUser.findById(userId);
    } catch (mongoError) {
      console.log('MongoDB not available, using in-memory user data');
      const { inMemoryUsers } = require('../server');
      userInfo = inMemoryUsers.find(u => (u._id || u.id) === userId);
    }

    if (!userInfo) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
      author: {
        _id: userId,
        fullName: userInfo.fullName || userInfo.firstName + ' ' + userInfo.lastName || 'User',
        profilePhoto: userInfo.profilePhoto || null
      },
      createdAt: new Date()
    };

    post.comments.push(newComment);
    const updatedPost = await post.save();

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const totalComments = post.comments.length;
    const paginatedComments = post.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.json({
      comments: paginatedComments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNext: skip + limit < totalComments,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;