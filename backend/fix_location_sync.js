const mongoose = require('mongoose');
require('dotenv').config();
const ConsolidatedUser = require('./models/ConsolidatedUser');

async function fixLocationSync() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all users where individual address fields exist but location object is incomplete
    const users = await ConsolidatedUser.find({
      $or: [
        { address: { $exists: true, $ne: '' } },
        { state: { $exists: true, $ne: '' } },
        { district: { $exists: true, $ne: '' } },
        { city: { $exists: true, $ne: '' } },
        { block: { $exists: true, $ne: '' } },
        { pincode: { $exists: true, $ne: '' } }
      ]
    });

    console.log(`Found ${users.length} users to process`);

    let updatedCount = 0;
    
    for (const user of users) {
      // Check if location object needs updating
      const needsUpdate = 
        !user.location ||
        user.location.address !== (user.address || '') ||
        user.location.state !== (user.state || '') ||
        user.location.district !== (user.district || '') ||
        user.location.city !== (user.city || '') ||
        user.location.block !== (user.block || '') ||
        user.location.zipCode !== (user.pincode || '');

      if (needsUpdate) {
        // Initialize location object if it doesn't exist
        if (!user.location) {
          user.location = {};
        }

        // Sync individual fields to location object
        user.location.address = user.address || '';
        user.location.state = user.state || '';
        user.location.district = user.district || '';
        user.location.city = user.city || '';
        user.location.block = user.block || '';
        user.location.zipCode = user.pincode || '';

        // Preserve existing coordinates if they exist
        if (!user.location.coordinates && user.coordinates) {
          user.location.coordinates = user.coordinates;
        }

        // Save the user (this will trigger the pre-save middleware)
        await user.save();
        updatedCount++;

        console.log(`Updated user: ${user.fullName || user.firstName || user._id} - Location synced`);
      }
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Users already in sync: ${users.length - updatedCount}`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
fixLocationSync();