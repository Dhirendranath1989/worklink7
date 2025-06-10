const mongoose = require('mongoose');

// User schema for MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String },
  userType: { type: String, enum: ['owner', 'worker'], default: 'worker' },
  role: { type: String, enum: ['owner', 'worker'], default: 'worker' },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  firebaseUid: { type: String, unique: true, sparse: true },
  profileCompleted: { type: Boolean, default: false },
  savedWorkers: [{ type: String }],
  
  // Profile information
  profilePhoto: { type: String },
  bio: { type: String },
  description: { type: String },
  
  // Contact information
  mobile: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  pincode: { type: String },
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
  
  // Professional information (for workers)
  skills: [{ type: String }],
  workExperience: { type: String },
  hourlyRate: { type: Number },
  languagesSpoken: [{ type: String }],
  availabilityStatus: { type: String },
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
  workPhotos: [{
    path: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimetype: { type: String }
  }],
  certificates: [{
    path: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimetype: { type: String }
  }],
  
  // Business information (for owners)
  businessName: { type: String },
  businessType: { type: String },
  companyName: { type: String },
  companyDescription: { type: String },
  website: { type: String },
  
  // Ratings and Reviews
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Contact information (legacy)
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    website: { type: String }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);