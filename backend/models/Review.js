const mongoose = require('mongoose');

// Review schema for MongoDB (replaces Firestore reviews collection)
const reviewSchema = new mongoose.Schema({
  reviewerId: { type: String, required: true }, // Firebase UID of the person giving the review
  workerId: { type: String, required: true }, // Firebase UID of the worker being reviewed
  jobId: { type: String }, // Optional: ID of the job this review is for
  
  // Review Content
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  comment: { type: String, required: true },
  
  // Reviewer Information (cached for performance)
  reviewerName: { type: String, required: true },
  reviewerProfilePicture: { type: String },
  
  // Worker Information (cached for performance)
  workerName: { type: String },
  workerProfilePicture: { type: String },
  
  // Review Categories
  categories: {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },
  
  // Status
  isVerified: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  
  // Response from worker
  workerResponse: {
    comment: { type: String },
    respondedAt: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
reviewSchema.index({ workerId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ jobId: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);