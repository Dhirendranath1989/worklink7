const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Owner = require('../models/Owner');
const { authenticateToken } = require('../middleware/auth');
const mongoService = require('../services/mongoService');

// Import global variables and functions from server.js
let isMongoConnected, inMemoryUsers, saveUserToMongoDB;

// Function to set global references (called from server.js)
const setGlobalReferences = (globals) => {
  isMongoConnected = globals.isMongoConnected;
  inMemoryUsers = globals.inMemoryUsers;
  saveUserToMongoDB = globals.saveUserToMongoDB;
};

module.exports.setGlobalReferences = setGlobalReferences;

// Get user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user;
    if (isMongoConnected) {
      user = await mongoService.getUserById(userId);
    } else {
      user = inMemoryUsers.find(u => u._id === userId || u.id === userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    let updatedUser;
    if (isMongoConnected) {
      updatedUser = await mongoService.updateUser(userId, updateData);
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId || u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updateData };
      updatedUser = inMemoryUsers[userIndex];
    }
    
    // Also save to MongoDB if firebaseUid exists
    if (updatedUser.firebaseUid) {
      await saveUserToMongoDB(updatedUser.firebaseUid, updateData);
    }
    
    res.json({ message: 'User profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark profile as completed
router.put('/:userId/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType, profileCompleted = true, profileCompletedAt } = req.body;
    
    const updateData = {
      profileCompleted,
      userType,
      profileCompletedAt: profileCompletedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    let updatedUser;
    if (isMongoConnected) {
      updatedUser = await mongoService.updateUser(userId, updateData);
    } else {
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId || u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updateData };
      updatedUser = inMemoryUsers[userIndex];
    }
    
    // Also save to MongoDB if firebaseUid exists
    if (updatedUser.firebaseUid) {
      await saveUserToMongoDB(updatedUser.firebaseUid, updateData);
    }
    
    res.json({ message: 'Profile marked as completed successfully', user: updatedUser });
  } catch (error) {
    console.error('Error marking profile as completed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
module.exports.setGlobalReferences = setGlobalReferences;