const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // Adjust path as needed
const Owner = require('../models/Owner'); // Adjust path as needed
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/owners';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `owner-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// PUT /api/owner/profile - Update owner profile
router.put('/profile', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    console.log('File uploaded:', req.file);
    
    // Find owner by user ID from auth middleware
    let owner = await Owner.findOne({ user: req.user.id });
    
    if (!owner) {
      // Create new owner profile if doesn't exist
      owner = new Owner({ user: req.user.id });
    }
    
    // Update fields from request body
    const { name, email, phone, address, bio, company } = req.body;
    
    if (name) owner.name = name;
    if (email) owner.email = email;
    if (phone) owner.phone = phone;
    if (address) owner.address = address;
    if (bio) owner.bio = bio;
    if (company) owner.company = company;
    
    // Handle profile photo upload
    if (req.file) {
      // Delete old profile photo if exists
      if (owner.profilePhoto && fs.existsSync(owner.profilePhoto)) {
        fs.unlinkSync(owner.profilePhoto);
      }
      owner.profilePhoto = req.file.path;
    }
    
    // Save updated owner
    await owner.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      owner: owner
    });
    
  } catch (error) {
    console.error('Error updating owner profile:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
});

// GET /api/owner/profile - Get owner profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const owner = await Owner.findOne({ user: req.user.id });
    
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner profile not found'
      });
    }
    
    res.json({
      success: true,
      owner: owner
    });
    
  } catch (error) {
    console.error('Error fetching owner profile:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

module.exports = router;