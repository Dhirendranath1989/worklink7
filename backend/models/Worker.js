const mongoose = require('mongoose');

// Worker schema for MongoDB (replaces Firestore workers collection)
const workerSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true },
  userType: { type: String, default: 'worker' },
  profileCompleted: { type: Boolean, default: false },
  
  // Personal Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePhoto: { type: String },
  bio: { type: String },
  
  // Contact Information
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  
  // Location
  location: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Professional Information
  skills: [{ type: String }],
  workExperience: { type: String },
  hourlyRate: { type: Number },
  availability: {
    monday: { available: Boolean, hours: String },
    tuesday: { available: Boolean, hours: String },
    wednesday: { available: Boolean, hours: String },
    thursday: { available: Boolean, hours: String },
    friday: { available: Boolean, hours: String },
    saturday: { available: Boolean, hours: String },
    sunday: { available: Boolean, hours: String }
  },
  
  // Portfolio
  workPhotos: [{ type: String }], // Array of image URLs
  certificates: [{ type: String }], // Array of certificate image URLs
  
  // Ratings and Reviews
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
workerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for location-based searches
workerSchema.index({ 'location.coordinates': '2dsphere' });

// Index for skill searches
workerSchema.index({ skills: 1 });

// Index for rating searches
workerSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Worker', workerSchema);