const mongoose = require('mongoose');

// Consolidated User schema for MongoDB - handles both owners and workers
const consolidatedUserSchema = new mongoose.Schema({
  // Authentication fields
  uid: { type: String, unique: true, sparse: true }, // Firebase UID
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, unique: true, sparse: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  
  // User type and role
  userType: { type: String, enum: ['owner', 'worker', 'admin'], default: 'worker' },
  role: { type: String, enum: ['owner', 'worker', 'admin'], default: 'worker' },
  
  // Verification status
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  
  // Personal Information
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String },
  profilePhoto: { type: String },
  bio: { type: String },
  description: { type: String },
  
  // Contact Information
  mobile: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  pincode: { type: String },
  state: { type: String },
  district: { type: String },
  city: { type: String },
  block: { type: String },
  website: { type: String },
  
  // Location
  location: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    district: { type: String },
    block: { type: String },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  
  // Professional Information (for workers)
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
  
  // Portfolio (for workers)
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
  
  // Business Information (for owners)
  businessName: { type: String },
  businessType: { type: String },
  businessDescription: { type: String },
  companyName: { type: String },
  companyDescription: { type: String },
  
  // Owner Preferences
  preferredWorkerTypes: [{ type: String }],
  budgetRange: {
    min: { type: Number },
    max: { type: Number }
  },
  
  // Saved Workers (for owners)
  savedWorkers: [{ type: String }], // Array of worker UIDs or IDs
  
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
  
  // Legacy contact information
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    website: { type: String }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
consolidatedUserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate fullName if not provided
  if (!this.fullName && this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  
  // Always construct/update location object from individual address fields
  // This ensures synchronization for all future account creations and updates
  if (!this.location) {
    this.location = {};
  }
  
  // Always map individual fields to location object (including empty/null values)
  this.location.address = this.address || '';
  this.location.state = this.state || '';
  this.location.district = this.district || '';
  this.location.city = this.city || '';
  this.location.block = this.block || '';
  this.location.zipCode = this.pincode || '';
  
  // Preserve existing coordinates if they exist
  if (!this.location.coordinates && this.coordinates) {
    this.location.coordinates = this.coordinates;
  }
  
  // Always mark the location field as modified for MongoDB
  this.markModified('location');
  
  next();
});

// Indexes for efficient searching

// Location-based searches (for workers)
consolidatedUserSchema.index({ 'location.coordinates': '2dsphere' });
consolidatedUserSchema.index({ 'location.state': 1 });
consolidatedUserSchema.index({ 'location.city': 1 });
consolidatedUserSchema.index({ 'location.district': 1 });
consolidatedUserSchema.index({ 'location.block': 1 });

// Skill searches (for workers)
consolidatedUserSchema.index({ skills: 1 });

// Rating searches
consolidatedUserSchema.index({ averageRating: -1 });

// User type searches
consolidatedUserSchema.index({ userType: 1 });
consolidatedUserSchema.index({ role: 1 });

// Status searches
consolidatedUserSchema.index({ isActive: 1 });
consolidatedUserSchema.index({ isVerified: 1 });

// Authentication searches
consolidatedUserSchema.index({ email: 1 });
consolidatedUserSchema.index({ phone: 1 });
consolidatedUserSchema.index({ uid: 1 });
consolidatedUserSchema.index({ firebaseUid: 1 });

// Compound indexes for common search patterns
consolidatedUserSchema.index({ userType: 1, isActive: 1 });
consolidatedUserSchema.index({ userType: 1, 'location.state': 1 });
consolidatedUserSchema.index({ userType: 1, skills: 1 });

// Virtual for getting worker-specific data
consolidatedUserSchema.virtual('isWorker').get(function() {
  return this.userType === 'worker' || this.role === 'worker';
});

// Virtual for getting owner-specific data
consolidatedUserSchema.virtual('isOwner').get(function() {
  return this.userType === 'owner' || this.role === 'owner';
});

// Method to get worker profile data
consolidatedUserSchema.methods.getWorkerProfile = function() {
  if (!this.isWorker) return null;
  
  return {
    uid: this.uid || this.firebaseUid,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    phone: this.phone || this.mobile || this.phoneNumber,
    website: this.website,
    location: this.location,
    skills: this.skills,
    workExperience: this.workExperience,
    hourlyRate: this.hourlyRate,
    availability: this.availability,
    workPhotos: this.workPhotos,
    certificates: this.certificates,
    averageRating: this.averageRating,
    totalReviews: this.totalReviews,
    isActive: this.isActive,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to get owner profile data
consolidatedUserSchema.methods.getOwnerProfile = function() {
  if (!this.isOwner) return null;
  
  return {
    uid: this.uid || this.firebaseUid,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    description: this.description,
    phone: this.phone || this.mobile || this.phoneNumber,
    address: this.address,
    location: this.location,
    companyName: this.companyName,
    businessName: this.businessName,
    businessType: this.businessType,
    businessDescription: this.businessDescription,
    companyDescription: this.companyDescription,
    website: this.website,
    preferredWorkerTypes: this.preferredWorkerTypes,
    budgetRange: this.budgetRange,
    savedWorkers: this.savedWorkers,
    isActive: this.isActive,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('ConsolidatedUser', consolidatedUserSchema);