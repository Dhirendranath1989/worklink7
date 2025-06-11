const express = require('express');
const router = express.Router();
const ConsolidatedUser = require('../models/ConsolidatedUser');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const mongoService = require('../services/mongoService');

// Import global variables and functions from server.js
let isMongoConnected, inMemoryUsers;

// Function to set global references (called from server.js)
const setGlobalReferences = (globals) => {
  isMongoConnected = globals.isMongoConnected;
  inMemoryUsers = globals.inMemoryUsers;
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
    
    // Note: MongoDB sync handled by mongoService when connected
    
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
    
    // Note: MongoDB sync handled by mongoService when connected
    
    res.json({ message: 'Profile marked as completed successfully', user: updatedUser });
  } catch (error) {
    console.error('Error marking profile as completed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user account
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('=== DELETE REQUEST RECEIVED ===');
    console.log('Requested user ID:', userId);
    console.log('Authenticated user ID:', req.user.userId);
    
    // Check current MongoDB connection status dynamically
    const currentMongoStatus = mongoose.connection.readyState === 1;
    console.log('MongoDB connected (dynamic check):', currentMongoStatus);
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    // Verify the user is deleting their own account
    if (req.user.userId !== userId) {
      console.log('Authorization failed: User trying to delete different account');
      return res.status(403).json({ message: 'You can only delete your own account' });
    }
    
    let user;
    if (currentMongoStatus) {
      // Get user before deletion for cleanup
      console.log('Looking up user with ID:', userId);
      try {
        user = await mongoService.getUserById(userId);
        console.log('User lookup result:', user ? 'Found' : 'Not found');
        if (user) {
          console.log('Found user email:', user.email);
        }
      } catch (lookupError) {
        console.error('Error during user lookup:', lookupError);
        return res.status(500).json({ message: 'Error looking up user' });
      }
      
      if (!user) {
        console.log('User not found in MongoDB for ID:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Delete user from MongoDB
      console.log('Proceeding with user deletion...');
      await mongoService.deleteUser(userId);
      console.log('User deleted successfully from MongoDB');
    } else {
      // Find and remove from in-memory storage
      console.log('Using in-memory storage for deletion');
      const userIndex = inMemoryUsers.findIndex(u => u._id === userId || u.id === userId);
      if (userIndex === -1) {
        console.log('User not found in in-memory storage for ID:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
      
      user = inMemoryUsers[userIndex];
      inMemoryUsers.splice(userIndex, 1);
      console.log('User deleted successfully from in-memory storage');
    }
    
    // TODO: Add cleanup for related data (jobs, applications, etc.)
    // This would include:
    // - Jobs posted by owners
    // - Job applications by workers
    // - Reviews and ratings
    // - Saved searches and workers
    // - Notifications
    // - Chat messages
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.setGlobalReferences = setGlobalReferences;