const User = require('../models/User');
const Worker = require('../models/Worker');
const Owner = require('../models/Owner');
const Job = require('../models/Job');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// MongoDB service to replace Firebase Firestore operations
class MongoService {
  
  // User operations
  // Get user by ID
  async getUserById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user by Firebase UID
  async getUserByFirebaseUid(firebaseUid) {
    try {
      return await User.findOne({ firebaseUid });
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw error;
    }
  }

  // Update user by ID
  async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(userId, updateData, { new: true });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user by Firebase UID
  async updateUserByFirebaseUid(firebaseUid, updateData) {
    try {
      return await User.findOneAndUpdate({ firebaseUid }, updateData, { new: true, upsert: true });
    } catch (error) {
      console.error('Error updating user by Firebase UID:', error);
      throw error;
    }
  }
  
  async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUserByFirebaseUidWithTimestamp(firebaseUid, userData) {
    try {
      return await User.findOneAndUpdate(
        { firebaseUid },
        { ...userData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Worker operations
  async getWorkerProfile(firebaseUid) {
    try {
      return await Worker.findOne({ uid: firebaseUid });
    } catch (error) {
      console.error('Error getting worker profile:', error);
      throw error;
    }
  }

  async saveWorkerProfile(firebaseUid, workerData) {
    try {
      return await Worker.findOneAndUpdate(
        { uid: firebaseUid },
        { ...workerData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('Error saving worker profile:', error);
      throw error;
    }
  }

  async searchWorkers(filters = {}) {
    try {
      const query = {};
      
      if (filters.skills && filters.skills.length > 0) {
        query.skills = { $in: filters.skills };
      }
      
      if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
      }
      
      if (filters.minRating) {
        query.rating = { $gte: parseFloat(filters.minRating) };
      }
      
      if (filters.availability) {
        query.availability = filters.availability;
      }
      
      if (filters.maxHourlyRate) {
        query.hourlyRate = { $lte: parseFloat(filters.maxHourlyRate) };
      }
      
      if (filters.minHourlyRate) {
        query.hourlyRate = { ...query.hourlyRate, $gte: parseFloat(filters.minHourlyRate) };
      }
      
      const workers = await Worker.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .limit(filters.limit || 20);
      
      return workers;
    } catch (error) {
      console.error('Error searching workers:', error);
      throw error;
    }
  }

  // Owner operations
  async getOwnerProfile(firebaseUid) {
    try {
      return await Owner.findOne({ uid: firebaseUid });
    } catch (error) {
      console.error('Error getting owner profile:', error);
      throw error;
    }
  }

  async saveOwnerProfile(firebaseUid, ownerData) {
    try {
      return await Owner.findOneAndUpdate(
        { uid: firebaseUid },
        { ...ownerData, updatedAt: new Date() },
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
      const review = new Review(reviewData);
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
      return await Review.find({ workerId }).sort({ createdAt: -1 });
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
        
        await Worker.findByIdAndUpdate(workerId, {
          rating: Math.round(averageRating * 10) / 10,
          reviewCount: reviews.length
        });
      }
    } catch (error) {
      console.error('Error updating worker rating:', error);
      throw error;
    }
  }

  // Conversation operations
  async createConversation(participants, jobId = null) {
    try {
      const conversation = new Conversation({
        participants,
        jobId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await conversation.save();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId) {
    try {
      return await Conversation.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .populate('participants', 'firstName lastName email')
        .populate('jobId', 'title');
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Message operations
  async createMessage(messageData) {
    try {
      const message = new Message({
        ...messageData,
        createdAt: new Date()
      });
      
      const savedMessage = await message.save();
      
      // Update conversation's last message timestamp
      await Conversation.findByIdAndUpdate(messageData.conversationId, {
        updatedAt: new Date(),
        lastMessage: messageData.content
      });
      
      return savedMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId, limit = 50, skip = 0) {
    try {
      return await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('senderId', 'firstName lastName');
    } catch (error) {
      console.error('Error getting conversation messages:', error);
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