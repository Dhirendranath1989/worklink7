const express = require('express');
const FAQ = require('../models/FAQ');
const router = express.Router();

// Get public FAQs
router.get('/faq', async (req, res) => {
  try {
    // Fetch active FAQs from database
    const faqs = await FAQ.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, settings: { faqs } });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Error fetching FAQs' });
  }
});

module.exports = router;