const express = require('express');
const router = express.Router();
const ConsolidatedUser = require('../models/ConsolidatedUser');
const Job = require('../models/Job');
const Post = require('../models/Post');
const Review = require('../models/Review');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await ConsolidatedUser.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying admin status' });
  }
};

// Dashboard Analytics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalWorkers, totalOwners, activeUsers, totalJobs, totalPosts, totalReviews] = await Promise.all([
      ConsolidatedUser.countDocuments(),
      ConsolidatedUser.countDocuments({ userType: 'worker' }),
      ConsolidatedUser.countDocuments({ userType: 'owner' }),
      ConsolidatedUser.countDocuments({ isActive: true }),
      Job.countDocuments(),
      Post.countDocuments(),
      Review.countDocuments()
    ]);

    // Get new users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = await ConsolidatedUser.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    // Get blocked accounts
    const blockedAccounts = await ConsolidatedUser.countDocuments({ isActive: false });

    // Get popular skills
    const popularSkills = await ConsolidatedUser.aggregate([
      { $match: { userType: 'worker', skills: { $exists: true, $ne: [] } } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalUsers,
      totalWorkers,
      totalOwners,
      activeUsers,
      newUsersThisWeek,
      blockedAccounts,
      totalJobs,
      totalPosts,
      totalReviews,
      popularSkills: popularSkills.map(skill => ({ name: skill._id, count: skill.count }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get all users with pagination and filters
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userType,
      status,
      search,
      skill,
      city,
      state,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Apply filters
    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'blocked') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (skill) {
      query.skills = { $in: [skill] };
    }

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      query['location.state'] = { $regex: state, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, totalCount] = await Promise.all([
      ConsolidatedUser.find(query)
        .select('-password')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit)),
      ConsolidatedUser.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user details by ID
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await ConsolidatedUser.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts and reviews
    const [posts, reviews] = await Promise.all([
      Post.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(10),
      Review.find({ revieweeId: req.params.userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({ user, posts, reviews });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Block/Unblock user
router.put('/users/:userId/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await ConsolidatedUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      user: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await ConsolidatedUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete related data
    await Promise.all([
      Post.deleteMany({ userId: req.params.userId }),
      Review.deleteMany({ $or: [{ reviewerId: req.params.userId }, { revieweeId: req.params.userId }] }),
      Job.deleteMany({ ownerId: req.params.userId })
    ]);

    await ConsolidatedUser.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get reports (placeholder for now)
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This is a placeholder - you'll need to implement a proper reporting system
    const reports = [
      {
        id: 1,
        type: 'User Report',
        reporter: 'Jane Doe',
        reported: 'John Smith',
        reason: 'Inappropriate behavior',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        severity: 'high',
        status: 'pending'
      },
      {
        id: 2,
        type: 'Job Report',
        reporter: 'Mike Wilson',
        reported: 'Fake Job Posting',
        reason: 'Fraudulent job posting',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        severity: 'medium',
        status: 'pending'
      }
    ];

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Export users to CSV
router.get('/users/export/csv', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userType, status } = req.query;
    const query = {};

    if (userType && userType !== 'all') {
      query.userType = userType;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'blocked') {
      query.isActive = false;
    }

    const users = await ConsolidatedUser.find(query).select('-password');

    // Convert to CSV format
    const csvHeaders = [
      'ID', 'Name', 'Email', 'Phone', 'User Type', 'Status', 'City', 'State',
      'Skills', 'Rating', 'Created At', 'Verified'
    ];

    const csvRows = users.map(user => [
      user._id,
      user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      user.email || '',
      user.phone || user.mobile || '',
      user.userType || '',
      user.isActive ? 'Active' : 'Blocked',
      user.location?.city || '',
      user.location?.state || '',
      user.skills ? user.skills.join('; ') : '',
      user.averageRating || 0,
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      user.isVerified ? 'Yes' : 'No'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Error exporting users' });
  }
});

// Get system settings (placeholder)
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Forward to the settings router
    const [faqs, announcements] = await Promise.all([
      require('../models/FAQ').find().sort({ createdAt: -1 }),
      require('../models/Announcement').find().sort({ createdAt: -1 })
    ]);

    console.log('📋 Settings API - FAQs found:', faqs.length);
    console.log('📋 Settings API - Announcements found:', announcements.length);
    console.log('📋 Settings API - First FAQ:', faqs[0] ? { id: faqs[0]._id, question: faqs[0].question } : 'None');

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

// Settings routes for FAQ and Announcements
router.use('/settings', require('./settings'));

// Update system settings - unified endpoint for frontend
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, id, data, action } = req.body;
    
    if (type === 'faq') {
      const FAQ = require('../models/FAQ');
      
      if (action === 'delete') {
        await FAQ.findByIdAndDelete(id);
        return res.json({ success: true, message: 'FAQ deleted successfully' });
      }
      
      if (action === 'toggle') {
        const faq = await FAQ.findById(id);
        if (!faq) {
          return res.status(404).json({ success: false, message: 'FAQ not found' });
        }
        faq.isActive = !faq.isActive;
        faq.updatedAt = Date.now();
        await faq.save();
        return res.json({ success: true, message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully` });
      }
      
      if (id) {
        // Update existing FAQ
        const updatedFAQ = await FAQ.findByIdAndUpdate(
          id,
          {
            question: data.question,
            answer: data.answer,
            category: data.category || 'general',
            isActive: data.isActive !== undefined ? data.isActive : true,
            updatedAt: Date.now()
          },
          { new: true }
        );
        return res.json({ success: true, message: 'FAQ updated successfully', faq: updatedFAQ });
      } else {
        // Create new FAQ
        const newFAQ = new FAQ({
          question: data.question,
          answer: data.answer,
          category: data.category || 'general',
          isActive: data.isActive !== undefined ? data.isActive : true
        });
        await newFAQ.save();
        return res.json({ success: true, message: 'FAQ created successfully', faq: newFAQ });
      }
    }
    
    if (type === 'announcement') {
      const Announcement = require('../models/Announcement');
      
      if (action === 'delete') {
        await Announcement.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Announcement deleted successfully' });
      }
      
      if (action === 'toggle') {
        const announcement = await Announcement.findById(id);
        if (!announcement) {
          return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        announcement.isActive = !announcement.isActive;
        announcement.updatedAt = Date.now();
        await announcement.save();
        return res.json({ success: true, message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully` });
      }
      
      if (id) {
        // Update existing announcement
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
          id,
          {
            title: data.title,
            content: data.content,
            type: data.type || 'info',
            isActive: data.isActive !== undefined ? data.isActive : true,
            expiresAt: data.expiresAt || null,
            updatedAt: Date.now()
          },
          { new: true }
        );
        return res.json({ success: true, message: 'Announcement updated successfully', announcement: updatedAnnouncement });
      } else {
        // Create new announcement
        const newAnnouncement = new Announcement({
          title: data.title,
          content: data.content,
          type: data.type || 'info',
          isActive: data.isActive !== undefined ? data.isActive : true,
          expiresAt: data.expiresAt || null
        });
        await newAnnouncement.save();
        return res.json({ success: true, message: 'Announcement created successfully', announcement: newAnnouncement });
      }
    }
    
    res.status(400).json({ success: false, message: 'Invalid request type' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
});

module.exports = router;