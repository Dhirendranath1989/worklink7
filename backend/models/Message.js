const mongoose = require('mongoose');

// Message schema for MongoDB (replaces Firestore messages collection)
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, required: true }, // Firebase UID
  
  // Message content
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  
  // File/Image information (if applicable)
  fileInfo: {
    originalName: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    url: { type: String }
  },
  
  // Sender information (cached for performance)
  senderInfo: {
    name: { type: String },
    profilePhoto: { type: String }
  },
  
  // Message status
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  
  // Read receipts
  readBy: [{
    userId: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }],
  
  // Message reactions
  reactions: [{
    userId: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Reply information
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    content: { type: String },
    sender: { type: String }
  },
  
  // System message information
  systemInfo: {
    action: { type: String }, // e.g., 'user_joined', 'job_assigned', etc.
    data: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Status
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);