const mongoose = require('mongoose');

// Owner schema for MongoDB (replaces Firestore owners collection)
const ownerSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true },
  userType: { type: String, default: 'owner' },
  role: { type: String, default: 'owner' },
  profileCompleted: { type: Boolean, default: false },
  
  // Personal Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  fullName: { type: String },
  profilePhoto: { type: String },
  bio: { type: String },
  description: { type: String },
  
  // Contact Information
  phone: { type: String },
  mobile: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  pincode: { type: String },
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
  
  // Business Information
  companyName: { type: String },
  businessName: { type: String },
  businessType: { type: String },
  businessDescription: { type: String },
  companyDescription: { type: String },
  
  // Preferences
  preferredWorkerTypes: [{ type: String }],
  budgetRange: {
    min: { type: Number },
    max: { type: Number }
  },
  
  // Saved Workers
  savedWorkers: [{ type: String }], // Array of worker UIDs
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ownerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for location-based searches
ownerSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Owner', ownerSchema);