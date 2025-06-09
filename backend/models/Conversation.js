const mongoose = require('mongoose');

// Conversation schema for MongoDB (replaces Firestore conversations collection)
const conversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // Array of Firebase UIDs
  
  // Conversation metadata
  title: { type: String }, // Optional conversation title
  type: { type: String, enum: ['direct', 'group', 'job_related'], default: 'direct' },
  jobId: { type: String }, // If conversation is related to a specific job
  
  // Last message info (cached for performance)
  lastMessage: {
    content: { type: String },
    sender: { type: String }, // Firebase UID
    senderName: { type: String },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    createdAt: { type: Date, default: Date.now }
  },
  
  // Participant information (cached for performance)
  participantInfo: [{
    uid: { type: String, required: true },
    name: { type: String },
    profilePhoto: { type: String },
    lastSeen: { type: Date },
    unreadCount: { type: Number, default: 0 }
  }],
  
  // Status
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ jobId: 1 });
conversationSchema.index({ 'lastMessage.createdAt': -1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);