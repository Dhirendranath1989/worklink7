const mongoose = require('mongoose');

// Post schema for MongoDB
const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  images: [{
    type: String // Array of image URLs/paths
  }],
  author: {
    _id: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    profilePhoto: {
      type: String
    }
  },
  likes: [{
    type: String // Array of user IDs who liked the post
  }],
  comments: [{
    _id: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    author: {
      _id: {
        type: String,
        required: true
      },
      fullName: {
        type: String,
        required: true
      },
      profilePhoto: {
        type: String
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Post', postSchema);