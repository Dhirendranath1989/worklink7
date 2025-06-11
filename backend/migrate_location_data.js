const mongoose = require('mongoose');
require('dotenv').config();

// Import the ConsolidatedUser model
const ConsolidatedUser = require('./models/ConsolidatedUser');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to update location objects
const migrateLocationData = async () => {
  try {
    console.log('Starting location data migration...');
    
    // Find all users that have individual address fields but missing or incomplete location object
    const users = await ConsolidatedUser.find({
      $or: [
        { address: { $exists: true, $ne: null, $ne: '' } },
        { state: { $exists: true, $ne: null, $ne: '' } },
        { district: { $exists: true, $ne: null, $ne: '' } },
        { city: { $exists: true, $ne: null, $ne: '' } },
        { block: { $exists: true, $ne: null, $ne: '' } },
        { pincode: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    console.log(`Found ${users.length} users with address data to migrate`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Initialize location object if it doesn't exist
      if (!user.location) {
        user.location = {};
        needsUpdate = true;
      }
      
      // Check and update each field if it's missing in location but exists in individual fields
      if (user.address && !user.location.address) {
        user.location.address = user.address;
        needsUpdate = true;
      }
      
      if (user.state && !user.location.state) {
        user.location.state = user.state;
        needsUpdate = true;
      }
      
      if (user.district && !user.location.district) {
        user.location.district = user.district;
        needsUpdate = true;
      }
      
      if (user.city && !user.location.city) {
        user.location.city = user.city;
        needsUpdate = true;
      }
      
      if (user.block && !user.location.block) {
        user.location.block = user.block;
        needsUpdate = true;
      }
      
      if (user.pincode && !user.location.zipCode) {
        user.location.zipCode = user.pincode;
        needsUpdate = true;
      }
      
      // Save the user if any updates were made
      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`Updated user: ${user.email || user.uid || user._id}`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
    
    // Verify the migration by checking a few updated records
    console.log('\nVerifying migration results...');
    const verificationUsers = await ConsolidatedUser.find({
      $and: [
        {
          $or: [
            { address: { $exists: true, $ne: null, $ne: '' } },
            { state: { $exists: true, $ne: null, $ne: '' } },
            { city: { $exists: true, $ne: null, $ne: '' } }
          ]
        },
        {
          $or: [
            { 'location.address': { $exists: true, $ne: null, $ne: '' } },
            { 'location.state': { $exists: true, $ne: null, $ne: '' } },
            { 'location.city': { $exists: true, $ne: null, $ne: '' } }
          ]
        }
      ]
    }).limit(3);
    
    verificationUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  Individual fields: address=${user.address}, state=${user.state}, city=${user.city}`);
      console.log(`  Location object: address=${user.location?.address}, state=${user.location?.state}, city=${user.location?.city}`);
    });
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Main execution
const runMigration = async () => {
  await connectDB();
  await migrateLocationData();
  await mongoose.connection.close();
  console.log('\nMigration completed and database connection closed.');
};

// Run the migration
runMigration().catch(console.error);