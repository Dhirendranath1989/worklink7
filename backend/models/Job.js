const mongoose = require('mongoose');

// Job schema for MongoDB (replaces Firestore jobs collection)
const jobSchema = new mongoose.Schema({
  ownerId: { type: String, required: true }, // Firebase UID of the job poster
  workerId: { type: String }, // Firebase UID of assigned worker (if any)
  
  // Job Details
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skillsRequired: [{ type: String }],
  
  // Location
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Compensation
  paymentType: { type: String, enum: ['hourly', 'fixed', 'negotiable'], required: true },
  hourlyRate: { type: Number },
  fixedPrice: { type: Number },
  estimatedHours: { type: Number },
  
  // Timeline
  startDate: { type: Date },
  endDate: { type: Date },
  deadline: { type: Date },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Status
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'completed', 'cancelled', 'on_hold'], 
    default: 'open' 
  },
  
  // Applications
  applications: [{
    workerId: { type: String, required: true },
    workerName: { type: String, required: true },
    workerProfilePhoto: { type: String },
    proposedRate: { type: Number },
    coverLetter: { type: String },
    estimatedCompletion: { type: Date },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
  }],
  
  // Additional Information
  images: [{ type: String }], // Job-related images
  requirements: [{ type: String }],
  benefits: [{ type: String }],
  
  // Visibility
  isActive: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
jobSchema.index({ ownerId: 1 });
jobSchema.index({ workerId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ 'location.coordinates': '2dsphere' });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ skillsRequired: 1 });

module.exports = mongoose.model('Job', jobSchema);