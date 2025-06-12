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
    console.log('User ID from auth:', req.user.userId);
    
    // Find owner by user ID from auth middleware
    console.log('About to query Owner model...');
    let owner;
    try {
      owner = await Owner.findOne({ user: req.user.userId });
      console.log('Database query completed');
      console.log('Found existing owner:', owner ? owner._id : 'No existing owner');
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }
    
    if (!owner) {
      // Create new owner profile if doesn't exist
      console.log('Creating new owner profile for user:', req.user.userId);
      owner = new Owner({ 
        user: req.user.userId,
        name: req.body.fullName || req.body.name || 'Unknown',
        email: req.body.email || req.user.email || 'unknown@email.com'
      });
      console.log('New owner created:', owner);
    }
    
    // Update fields from request body - map frontend field names to backend
    const { fullName, name, email, mobile, phone, address, state, district, city, block, pincode, languagesSpoken, bio, company } = req.body;
    
    console.log('Updating owner fields...');
    if (fullName || name) {
      owner.name = fullName || name;
      console.log('Updated name to:', owner.name);
    }
    if (email) {
      owner.email = email;
      console.log('Updated email to:', owner.email);
    }
    if (mobile || phone) {
      owner.phone = mobile || phone;
      console.log('Updated phone to:', owner.phone);
    }
    if (address) owner.address = address;
    if (state) owner.state = state;
    if (district) owner.district = district;
    if (city) owner.city = city;
    if (block) owner.block = block;
    if (pincode) owner.pincode = pincode;
    if (languagesSpoken) owner.languagesSpoken = languagesSpoken;
    if (bio) owner.bio = bio;
    if (company) owner.company = company;
    
    console.log('Owner before save:', owner);
    
    // Handle profile photo upload
    if (req.file) {
      // Delete old profile photo if exists
      if (owner.profilePhoto && fs.existsSync(owner.profilePhoto)) {
        fs.unlinkSync(owner.profilePhoto);
      }
      owner.profilePhoto = req.file.path;
    }
    
    // Save updated owner
    const savedOwner = await owner.save();
    console.log('Owner profile saved successfully:', savedOwner._id);
    
    const response = {
      success: true,
      message: 'Profile updated successfully',
      owner: savedOwner
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
    
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
    const owner = await Owner.findOne({ user: req.user.userId });
    
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