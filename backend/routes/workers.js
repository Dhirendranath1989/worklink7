const express = require('express');
const router = express.Router();
const ConsolidatedUser = require('../models/ConsolidatedUser');
const Post = require('../models/Post');
const { authenticateToken } = require('../middleware/auth');

// Search workers by skills and location
router.get('/search', async (req, res) => {
  try {
    const { skill, location, page = 1, limit = 20 } = req.query;
    
    console.log('Search request:', { skill, location, page, limit });
    
    // Build base search query - only search for workers
    let searchQuery = { 
      isActive: true,
      $or: [
        { userType: 'worker' },
        { role: 'worker' }
      ]
    };
    let searchConditions = [];
    
    // Add skill search if provided - search for partial matches in skills array
    if (skill && skill.trim()) {
      const trimmedSkill = skill.trim();
      console.log('Skill search term:', trimmedSkill);
      
      // Match partial skill terms (case insensitive) in skills array
      const skillConditions = {
        skills: { 
          $elemMatch: { 
            $regex: new RegExp(trimmedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') 
          } 
        }
      };
      searchConditions.push(skillConditions);
    }
    
    // Add location search if provided - search across individual address fields
    if (location && location.trim()) {
      const trimmedLocation = location.trim();
      console.log('Location search term:', trimmedLocation);
      
      // Search across individual address fields (state, city, district, block, address)
      const locationRegex = new RegExp(trimmedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      const locationConditions = {
        $or: [
          { 'location.state': { $regex: locationRegex } },
          { 'location.city': { $regex: locationRegex } },
          { 'location.district': { $regex: locationRegex } },
          { 'location.block': { $regex: locationRegex } },
          { 'location.address': { $regex: locationRegex } }
        ]
      };
      searchConditions.push(locationConditions);
    }
    
    // Combine all conditions with AND logic (workers match if they have matching skills AND location)
    if (searchConditions.length > 0) {
      // Use $and to combine the base worker query with search conditions
      searchQuery = {
        $and: [
          {
            isActive: true,
            $or: [
              { userType: 'worker' },
              { role: 'worker' }
            ]
          },
          ...searchConditions
        ]
      };
    }
    
    // If no search criteria provided, require at least one parameter
    if (!skill && !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one search parameter (skill or location)'
      });
    }
    
    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search with pagination
    console.log('Executing search...');
    const workers = await ConsolidatedUser.find(searchQuery)
      .select('firstName lastName fullName email profilePhoto bio skills location averageRating totalReviews hourlyRate isVerified userType role')
      .sort({ averageRating: -1, totalReviews: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Workers found:', workers.length);
    console.log('Sample worker data:', workers.length > 0 ? workers[0] : 'No workers');

    // Get total count for pagination
    const total = await ConsolidatedUser.countDocuments(searchQuery);
    console.log('Total count:', total);
    
    // Format response
    const formattedWorkers = workers.map(worker => ({
      _id: worker._id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      fullName: worker.fullName,
      email: worker.email,
      name: worker.fullName || `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || 'Worker',
      profilePhoto: worker.profilePhoto,
      bio: worker.bio,
      skills: worker.skills,
      location: {
        address: worker.location?.address,
        city: worker.location?.city,
        district: worker.location?.district,
        block: worker.location?.block,
        state: worker.location?.state,
        zipCode: worker.location?.zipCode
      },
      rating: worker.averageRating || 0,
      reviewCount: worker.totalReviews || 0,
      hourlyRate: worker.hourlyRate,
      isVerified: worker.isVerified
    }));
    
    res.json({
      success: true,
      workers: formattedWorkers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + workers.length < total
    });
    
  } catch (error) {
    console.error('Error searching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search workers',
      error: error.message
    });
  }
});

// Get worker profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await ConsolidatedUser.findById(id);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Format worker profile for detailed view
    const workerProfile = {
      _id: worker._id,
      name: worker.fullName || 
             (worker.firstName && worker.lastName ? `${worker.firstName} ${worker.lastName}` : 
              worker.firstName || worker.lastName || 'Worker').trim(),
      firstName: worker.firstName,
      lastName: worker.lastName,
      fullName: worker.fullName,
      email: worker.email,
      phone: worker.phone,
      mobile: worker.mobile,
      phoneNumber: worker.phoneNumber,
      website: worker.website,
      profilePhoto: worker.profilePhoto,
      bio: worker.bio,
      description: worker.description,
      skills: worker.skills,
      workExperience: worker.workExperience,
      hourlyRate: worker.hourlyRate,
      minimumRate: worker.minimumRate,
      projectRate: worker.projectRate,
      location: worker.location,
      availability: worker.availability,
      availabilityStatus: worker.availabilityStatus,
      workPhotos: worker.workPhotos ? worker.workPhotos.map(photo => {
        if (typeof photo === 'string') {
          return photo.startsWith('http') ? photo : `http://localhost:5000${photo}`;
        }
        return photo.path ? `http://localhost:5000${photo.path}` : photo;
      }) : [],
      certificates: worker.certificates ? worker.certificates.map(cert => {
        if (typeof cert === 'string') {
          return cert.startsWith('http') ? cert : `http://localhost:5000${cert}`;
        }
        return cert.path ? `http://localhost:5000${cert.path}` : cert;
      }) : [],
      documents: worker.documents ? worker.documents.map(doc => {
        if (typeof doc === 'string') {
          return doc.startsWith('http') ? doc : `http://localhost:5000${doc}`;
        }
        return doc.path ? `http://localhost:5000${doc.path}` : doc;
      }) : [],
      languagesSpoken: worker.languagesSpoken,
      completedJobs: worker.completedJobs,
      responseTime: worker.responseTime,
      experienceYears: worker.experienceYears,
      averageRating: worker.averageRating || 0,
      totalReviews: worker.totalReviews || 0,
      isVerified: worker.isVerified,
      isActive: worker.isActive,
      createdAt: worker.createdAt
    };
    
    res.json({
      success: true,
      worker: workerProfile
    });
    
  } catch (error) {
    console.error('Error fetching worker profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker profile',
      error: error.message
    });
  }
});

// Get worker posts/activity
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching posts for worker ID:', id);
    
    // Check if worker exists
    const worker = await ConsolidatedUser.findById(id);
    if (!worker) {
      console.log('Worker not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    console.log('Worker found:', worker.fullName || worker.firstName + ' ' + worker.lastName);
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get posts from database with pagination
    // Try both possible author ID formats
    const workerPosts = await Post.find({ 
      $or: [
        { 'author._id': id },
        { 'author._id': id.toString() },
        { authorId: id },
        { authorId: id.toString() }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPosts = await Post.countDocuments({ 
      $or: [
        { 'author._id': id },
        { 'author._id': id.toString() },
        { authorId: id },
        { authorId: id.toString() }
      ]
    });
    
    console.log('Posts found for worker:', workerPosts.length);
    console.log('Total posts count:', totalPosts);
    if (workerPosts.length > 0) {
      console.log('Sample post author:', workerPosts[0].author);
    }
    
    res.json({
      success: true,
      posts: workerPosts,
      total: totalPosts,
      page,
      totalPages: Math.ceil(totalPosts / limit)
    });
    
  } catch (error) {
    console.error('Error fetching worker posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker posts',
      error: error.message
    });
  }
});

module.exports = router;