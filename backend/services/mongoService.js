const ConsolidatedUser = require('../models/ConsolidatedUser');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Review = require('../models/Review');

const Notification = require('../models/Notification');

// MongoDB service to replace Firebase Firestore operations
class MongoService {
  
  // User operations
  // Get user by ID
  async getUserById(userId) {
    try {
      // Handle both ObjectId and string formats
      if (mongoose.Types.ObjectId.isValid(userId)) {
        return await ConsolidatedUser.findById(userId);
      } else {
        // Try finding by uid field as fallback
        return await ConsolidatedUser.findOne({ uid: userId });
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user by Firebase UID
  async getUserByFirebaseUid(firebaseUid) {
    try {
      return await ConsolidatedUser.findOne({ firebaseUid });
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw error;
    }
  }

  // Update user by ID
  async updateUser(userId, updateData) {
    try {
      // Handle both ObjectId and string formats
      if (mongoose.Types.ObjectId.isValid(userId)) {
        return await ConsolidatedUser.findByIdAndUpdate(userId, updateData, { new: true });
      } else {
        // Try finding by uid field as fallback
        return await ConsolidatedUser.findOneAndUpdate({ uid: userId }, updateData, { new: true });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user by Firebase UID
  async updateUserByFirebaseUid(firebaseUid, updateData) {
    try {
      return await ConsolidatedUser.findOneAndUpdate({ firebaseUid }, updateData, { new: true, upsert: true });
    } catch (error) {
      console.error('Error updating user by Firebase UID:', error);
      throw error;
    }
  }
  
  async createUser(userData) {
    try {
      const user = new ConsolidatedUser(userData);
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUserByFirebaseUidWithTimestamp(firebaseUid, userData) {
    try {
      return await ConsolidatedUser.findOneAndUpdate(
        { firebaseUid },
        { ...userData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user by ID
  async deleteUser(userId) {
    try {
      // Get user data before deletion for cleanup
      const user = await ConsolidatedUser.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Delete related data to maintain referential integrity
      // Delete jobs posted by this user (if owner)
      if (user.userType === 'owner') {
        await Job.deleteMany({ ownerId: userId });
      }

      // Delete reviews written by this user
      await Review.deleteMany({ reviewerId: userId });
      
      // Delete reviews about this user
      await Review.deleteMany({ revieweeId: userId });
      

      
      // Delete notifications for this user
      await Notification.deleteMany({ userId: userId });
      
      // Finally, delete the user (no need to delete from separate collections)
      await ConsolidatedUser.findByIdAndDelete(userId);
      
      return { success: true, message: 'User and related data deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  // Worker operations
  async getWorkerProfile(firebaseUid) {
    try {
      return await ConsolidatedUser.findOne({ 
        $and: [
          { $or: [{ uid: firebaseUid }, { firebaseUid: firebaseUid }] },
          { $or: [{ userType: 'worker' }, { role: 'worker' }] }
        ]
      });
    } catch (error) {
      console.error('Error getting worker profile:', error);
      throw error;
    }
  }

  async saveWorkerProfile(firebaseUid, workerData) {
    try {
      return await ConsolidatedUser.findOneAndUpdate(
        { $or: [{ uid: firebaseUid }, { firebaseUid: firebaseUid }] },
        { ...workerData, updatedAt: new Date(), userType: 'worker' },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error saving worker profile:', error);
      throw error;
    }
  }

  // Helper function to generate skill variations
  getSkillVariations(skill) {
    const variations = [];
    const lowerSkill = skill.toLowerCase();
    
    // Common skill variations mapping
    const skillMappings = {
      // Person -> Activity
      'painter': ['painting', 'paint'],
      'cleaner': ['cleaning', 'clean'],
      'plumber': ['plumbing', 'plumb'],
      'electrician': ['electrical', 'electric'],
      'carpenter': ['carpentry', 'woodwork'],
      'gardener': ['gardening', 'garden'],
      'mechanic': ['mechanical', 'repair'],
      'driver': ['driving', 'transport'],
      'cook': ['cooking', 'chef'],
      'teacher': ['teaching', 'education'],
      'nurse': ['nursing', 'healthcare'],
      'designer': ['design', 'designing'],
      
      // Activity -> Person
      'painting': ['painter', 'paint'],
      'cleaning': ['cleaner', 'clean'],
      'plumbing': ['plumber', 'plumb'],
      'electrical': ['electrician', 'electric'],
      'carpentry': ['carpenter', 'woodwork'],
      'gardening': ['gardener', 'garden'],
      'mechanical': ['mechanic', 'repair'],
      'driving': ['driver', 'transport'],
      'cooking': ['cook', 'chef'],
      'teaching': ['teacher', 'education'],
      'nursing': ['nurse', 'healthcare'],
      'design': ['designer', 'designing']
    };
    
    // Add direct mappings
    if (skillMappings[lowerSkill]) {
      variations.push(...skillMappings[lowerSkill]);
    }
    
    // Add common suffixes/prefixes
    if (lowerSkill.endsWith('er')) {
      const base = lowerSkill.slice(0, -2);
      variations.push(base + 'ing', base);
    }
    if (lowerSkill.endsWith('ing')) {
      const base = lowerSkill.slice(0, -3);
      variations.push(base + 'er', base);
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }



  // Owner operations
  async getOwnerProfile(firebaseUid) {
    try {
      return await ConsolidatedUser.findOne({ 
        $and: [
          { $or: [{ uid: firebaseUid }, { firebaseUid: firebaseUid }] },
          { $or: [{ userType: 'owner' }, { role: 'owner' }] }
        ]
      });
    } catch (error) {
      console.error('Error getting owner profile:', error);
      throw error;
    }
  }

  async saveOwnerProfile(firebaseUid, ownerData) {
    try {
      return await ConsolidatedUser.findOneAndUpdate(
        { $or: [{ uid: firebaseUid }, { firebaseUid: firebaseUid }] },
        { ...ownerData, updatedAt: new Date(), userType: 'owner' },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error saving owner profile:', error);
      throw error;
    }
  }

  // Job operations
  async createJob(jobData) {
    try {
      const job = new Job(jobData);
      return await job.save();
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async getJobsByOwner(ownerId) {
    try {
      return await Job.find({ ownerId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting jobs by owner:', error);
      throw error;
    }
  }

  async getJobsByWorker(workerId) {
    try {
      return await Job.find({ workerId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting jobs by worker:', error);
      throw error;
    }
  }

  async searchJobs(filters = {}) {
    try {
      const query = {};
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
      }
      
      if (filters.minBudget) {
        query.budget = { $gte: parseFloat(filters.minBudget) };
      }
      
      if (filters.maxBudget) {
        query.budget = { ...query.budget, $lte: parseFloat(filters.maxBudget) };
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      const jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 20);
      
      return jobs;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  // Review operations
  async createReview(reviewData) {
    try {
      // Get reviewer information to cache in the review
      const reviewer = await ConsolidatedUser.findOne({
        $or: [{ uid: reviewData.reviewerId }, { firebaseUid: reviewData.reviewerId }, { _id: reviewData.reviewerId }]
      });
      
      // Enhance review data with cached reviewer info
      const enhancedReviewData = {
        ...reviewData,
        reviewerName: reviewData.reviewerName || (reviewer ? (reviewer.fullName || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()) : 'Anonymous'),
        reviewerProfilePicture: reviewData.reviewerProfilePicture || (reviewer ? reviewer.profilePhoto : null)
      };
      
      const review = new Review(enhancedReviewData);
      const savedReview = await review.save();
      
      // Update worker's rating
      if (reviewData.workerId) {
        await this.updateWorkerRating(reviewData.workerId);
      }
      
      return savedReview;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async getWorkerReviews(workerId) {
    try {
      const reviews = await Review.find({ workerId }).sort({ createdAt: -1 });
      
      // Populate reviewer information for each review
      const populatedReviews = await Promise.all(reviews.map(async (review) => {
        try {
          // Find reviewer information
          const reviewer = await ConsolidatedUser.findOne({
            $or: [{ uid: review.reviewerId }, { firebaseUid: review.reviewerId }, { _id: review.reviewerId }]
          });
          
          const reviewObj = review.toObject();
          
          if (reviewer) {
            reviewObj.reviewer = {
              fullName: reviewer.fullName || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim(),
              firstName: reviewer.firstName,
              lastName: reviewer.lastName,
              profilePhoto: reviewer.profilePhoto
            };
            
            // Update cached reviewer info if missing
            if (!reviewObj.reviewerName && reviewer.fullName) {
              reviewObj.reviewerName = reviewer.fullName;
            }
            if (!reviewObj.reviewerProfilePicture && reviewer.profilePhoto) {
              reviewObj.reviewerProfilePicture = reviewer.profilePhoto;
            }
          }
          
          return reviewObj;
        } catch (err) {
          console.error('Error populating reviewer for review:', review._id, err);
          return review.toObject();
        }
      }));
      
      return populatedReviews;
    } catch (error) {
      console.error('Error getting worker reviews:', error);
      throw error;
    }
  }

  async updateWorkerRating(workerId) {
    try {
      const reviews = await Review.find({ workerId });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        await ConsolidatedUser.findByIdAndUpdate(workerId, {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
          reviewCount: reviews.length
        });
      }
    } catch (error) {
      console.error('Error updating worker rating:', error);
      throw error;
    }
  }



  // Notification operations
  async createNotification(notificationData) {
    try {
      const notification = new Notification({
        ...notificationData,
        createdAt: new Date()
      });
      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, limit = 20) {
    try {
      return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = new MongoService();