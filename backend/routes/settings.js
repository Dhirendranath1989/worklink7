const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const FAQ = require('../models/FAQ');
const Announcement = require('../models/Announcement');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying admin status' });
  }
};

// Get all settings (FAQs and announcements)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [faqs, announcements] = await Promise.all([
      FAQ.find().sort({ createdAt: -1 }),
      Announcement.find().sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      settings: {
        faqs,
        announcements
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

// FAQ ENDPOINTS

// Create a new FAQ
router.post('/faq', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { question, answer, category, isActive } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    
    const newFAQ = new FAQ({
      question,
      answer,
      category: category || 'general',
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newFAQ.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq: newFAQ
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ success: false, message: 'Error creating FAQ' });
  }
});

// Update an existing FAQ
router.put('/faq/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, isActive } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }
    
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      {
        question,
        answer,
        category,
        isActive,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!updatedFAQ) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: updatedFAQ
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ success: false, message: 'Error updating FAQ' });
  }
});

// Delete an FAQ
router.delete('/faq/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedFAQ = await FAQ.findByIdAndDelete(id);
    
    if (!deletedFAQ) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: 'Error deleting FAQ' });
  }
});

// Toggle FAQ status (active/inactive)
router.patch('/faq/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    faq.isActive = !faq.isActive;
    faq.updatedAt = Date.now();
    
    await faq.save();
    
    res.json({
      success: true,
      message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
      faq
    });
  } catch (error) {
    console.error('Error toggling FAQ status:', error);
    res.status(500).json({ success: false, message: 'Error toggling FAQ status' });
  }
});

// ANNOUNCEMENT ENDPOINTS

// Create a new announcement
router.post('/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, type, isActive, expiresAt } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    
    const newAnnouncement = new Announcement({
      title,
      content,
      type: type || 'info',
      isActive: isActive !== undefined ? isActive : true,
      expiresAt: expiresAt || null
    });
    
    await newAnnouncement.save();
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: newAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Error creating announcement' });
  }
});

// Update an existing announcement
router.put('/announcement/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, isActive, expiresAt } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        content,
        type,
        isActive,
        expiresAt: expiresAt || null,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!updatedAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    
    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'Error updating announcement' });
  }
});

// Delete an announcement
router.delete('/announcement/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
    
    if (!deletedAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Error deleting announcement' });
  }
});

// Toggle announcement status (active/inactive)
router.patch('/announcement/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    
    announcement.isActive = !announcement.isActive;
    announcement.updatedAt = Date.now();
    
    await announcement.save();
    
    res.json({
      success: true,
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement status:', error);
    res.status(500).json({ success: false, message: 'Error toggling announcement status' });
  }
});

module.exports = router;