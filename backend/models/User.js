const mongoose = require('mongoose');

// User schema for MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, unique: true, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  userType: { type: String, enum: ['owner', 'worker'], default: 'worker' }, // Changed from 'role' to match Firestore
  role: { type: String, enum: ['owner', 'worker'], default: 'worker' }, // Keep for backward compatibility
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  firebaseUid: { type: String, unique: true, sparse: true },
  profileCompleted: { type: Boolean, default: false },
  savedWorkers: [{ type: String }], // Array of worker IDs that this user has saved
  
  // Profile information
  profilePhoto: { type: String },
  bio: { type: String },
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
  
  // Contact information
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