const express = require('express');
const router = express.Router();
const ConsolidatedUser = require('../models/ConsolidatedUser');
const { authenticateToken } = require('../middleware/auth');

// Get all saved workers for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find the user
    const user = await ConsolidatedUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the saved workers IDs
    const savedWorkerIds = user.savedWorkers || [];
    
    // If no saved workers, return empty array
    if (savedWorkerIds.length === 0) {
      return res.json({ savedWorkers: [] });
    }
    
    // Find all saved workers
    const savedWorkers = await ConsolidatedUser.find({
      _id: { $in: savedWorkerIds }
    }).select('-password');
    
    res.json({ savedWorkers });
  } catch (error) {
    console.error('Error fetching saved workers:', error);
    res.status(500).json({ message: 'Failed to fetch saved workers' });
  }
});

// Save a worker
router.post('/:workerId', authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    const userId = req.user.userId;
    
    // Find the user
    const user = await ConsolidatedUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the worker to save
    const worker = await ConsolidatedUser.findById(workerId).select('-password');
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Check if worker is already saved
    if (!user.savedWorkers) {
      user.savedWorkers = [];
    }
    
    if (user.savedWorkers.includes(workerId)) {
      return res.status(400).json({ message: 'Worker already saved' });
    }
    
    // Add worker to saved workers
    user.savedWorkers.push(workerId);
    await user.save();
    
    res.json({ message: 'Worker saved successfully', worker });
  } catch (error) {
    console.error('Error saving worker:', error);
    res.status(500).json({ message: 'Failed to save worker' });
  }
});

// Remove a saved worker
router.delete('/:workerId', authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    const userId = req.user.userId;
    
    // Find the user
    const user = await ConsolidatedUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if worker is saved
    if (!user.savedWorkers || !user.savedWorkers.includes(workerId)) {
      return res.status(400).json({ message: 'Worker not saved' });
    }
    
    // Remove worker from saved workers
    user.savedWorkers = user.savedWorkers.filter(id => id !== workerId);
    await user.save();
    
    res.json({ message: 'Worker removed successfully' });
  } catch (error) {
    console.error('Error removing saved worker:', error);
    res.status(500).json({ message: 'Failed to remove saved worker' });
  }
});

// Check if a worker is saved
router.get('/check/:workerId', authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    const userId = req.user.userId;
    
    // Find the user
    const user = await ConsolidatedUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if worker is saved
    const isSaved = user.savedWorkers && user.savedWorkers.includes(workerId);
    
    res.json({ isSaved });
  } catch (error) {
    console.error('Error checking saved worker:', error);
    res.status(500).json({ message: 'Failed to check saved worker status' });
  }
});

module.exports = router;