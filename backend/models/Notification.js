const mongoose = require('mongoose');

// Notification schema for MongoDB (replaces Firestore notifications collection)
const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID of the recipient
  
  // Notification content
  type: { 
    type: String, 
    enum: ['message', 'job_update', 'application', 'review', 'system', 'job_assigned', 'payment'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related data
  relatedId: { type: String }, // ID of related conversation, job, application, etc.
  relatedType: { 
    type: String, 
    enum: ['conversation', 'job', 'application', 'review', 'user', 'payment']
  },
  
  // Sender information (if applicable)
  senderId: { type: String }, // Firebase UID of the sender
  senderInfo: {
    name: { type: String },
    profilePhoto: { type: String }
  },
  
  // Notification data
  data: {
    jobTitle: { type: String },
    jobId: { type: String },
    conversationId: { type: String },
    applicationId: { type: String },
    reviewId: { type: String },
    amount: { type: Number },
    customData: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Status
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Delivery status
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  
  // Push notification status
  pushSent: { type: Boolean, default: false },
  pushSentAt: { type: Date },
  
  // Priority
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  
  // Expiration
  expiresAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ relatedId: 1 });
notificationSchema.index({ senderId: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Notification', notificationSchema);