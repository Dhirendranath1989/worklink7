const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');
const Review = require('./models/Review');

async function updateWorkerRatings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/worklink');
    console.log('Connected to MongoDB');
    
    const reviews = await Review.find({});
    console.log('Total reviews:', reviews.length);
    
    if (reviews.length > 0) {
      const workerIds = [...new Set(reviews.map(r => r.workerId))];
      console.log('Workers with reviews:', workerIds.length);
      
      for (const workerId of workerIds) {
        const workerReviews = reviews.filter(r => r.workerId === workerId);
        const totalRating = workerReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / workerReviews.length;
        
        await ConsolidatedUser.findByIdAndUpdate(workerId, {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: workerReviews.length,
          reviewCount: workerReviews.length
        });
        
        console.log(`Updated worker ${workerId}: ${averageRating.toFixed(1)} rating, ${workerReviews.length} reviews`);
      }
    }
    
    await mongoose.disconnect();
    console.log('Rating update completed');
  } catch (error) {
    console.error('Error updating ratings:', error);
    process.exit(1);
  }
}

updateWorkerRatings();