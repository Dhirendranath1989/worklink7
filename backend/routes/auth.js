const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const ConsolidatedUser = require('../models/ConsolidatedUser');
const mongoService = require('../services/mongoService');

// Import global variables and functions from server.js
let isMongoConnected, inMemoryUsers;

// Function to set global references (called from server.js)
const setGlobalReferences = (globals) => {
  isMongoConnected = globals.isMongoConnected;
  inMemoryUsers = globals.inMemoryUsers;
};

// Change password endpoint
router.put('/change-password', authenticateToken, async (req, res) => {
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
    console.log('🔍 Looking for user with ID:', userId);
    console.log('📊 MongoDB connected:', isMongoConnected);
    
    let user;
    if (isMongoConnected) {
      console.log('🗄️ Searching in MongoDB...');
      user = await ConsolidatedUser.findById(userId);
      console.log('👤 User found in MongoDB:', !!user);
      if (user) {
        console.log('📋 User details:', { id: user._id, email: user.email, hasPassword: user.hasPassword, passwordLength: user.password ? user.password.length : 0 });
      }
    } else {
      console.log('💾 Searching in memory...');
      console.log('📊 Total users in memory:', inMemoryUsers.length);
      user = inMemoryUsers.find(u => u._id === userId || u.id === userId);
      console.log('👤 User found in memory:', !!user);
      if (user) {
        console.log('📋 User details:', { id: user._id || user.id, email: user.email, hasPassword: user.hasPassword, passwordLength: user.password ? user.password.length : 0 });
      }
    }

    if (!user) {
      console.log('❌ User not found!');
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
router.put('/set-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Set password endpoint called');
    console.log('📝 Request body:', req.body);
    console.log('👤 User from token:', req.user);
    
    const { newPassword } = req.body;
    const userId = req.user.userId;
    
    console.log('🆔 User ID:', userId);
    console.log('🔒 New password provided:', !!newPassword);

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

    // Check if user already has a password (exclude 'empty' placeholder)
    console.log('🔐 Current password status:', { 
      hasPassword: !!user.password, 
      passwordValue: user.password, 
      passwordLength: user.password ? user.password.length : 0,
      isEmpty: user.password === 'empty'
    });
    
    if (user.password && user.password.length > 0 && user.password !== 'empty') {
      console.log('❌ User already has a password');
      return res.status(400).json({ 
        success: false, 
        message: 'User already has a password. Use change password instead.' 
      });
    }
    
    console.log('✅ User can set password - proceeding...');

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Set password
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

router.setGlobalReferences = setGlobalReferences;
module.exports = router;
