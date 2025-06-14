const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix hasPassword field for existing users
const fixHasPasswordField = async () => {
  try {
    console.log('Starting hasPassword field migration...');
    
    // Find all users who have a password but hasPassword is false or undefined
    const usersToUpdate = await ConsolidatedUser.find({
      password: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { hasPassword: false },
        { hasPassword: { $exists: false } }
      ]
    });
    
    console.log(`Found ${usersToUpdate.length} users that need hasPassword field update`);
    
    if (usersToUpdate.length === 0) {
      console.log('No users need updating. All users with passwords already have hasPassword: true');
      return;
    }
    
    // Update each user
    let updatedCount = 0;
    for (const user of usersToUpdate) {
      console.log(`Updating user: ${user.email || user._id} - hasPassword: ${user.hasPassword} -> true`);
      
      await ConsolidatedUser.findByIdAndUpdate(
        user._id,
        { hasPassword: true },
        { new: true }
      );
      
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} users`);
    
    // Verify the updates
    const verifyUsers = await ConsolidatedUser.find({
      password: { $exists: true, $ne: null, $ne: '' },
      hasPassword: false
    });
    
    if (verifyUsers.length === 0) {
      console.log('✅ Migration completed successfully! All users with passwords now have hasPassword: true');
    } else {
      console.log(`⚠️  Warning: ${verifyUsers.length} users still have hasPassword: false despite having passwords`);
    }
    
  } catch (error) {
    console.error('Error during hasPassword field migration:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixHasPasswordField();
  
  console.log('Migration completed. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
};

// Run the migration
if (require.main === module) {
  main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { fixHasPasswordField };