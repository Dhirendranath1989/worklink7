const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');

async function checkLocationData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink');
    console.log('Connected to MongoDB');
    
    const workers = await ConsolidatedUser.find({
      $or: [{userType: 'worker'}, {role: 'worker'}]
    }).limit(3);
    
    console.log(`Found ${workers.length} worker profiles:`);
    
    workers.forEach((worker, index) => {
      console.log(`\n--- Worker ${index + 1} ---`);
      console.log(`Name: ${worker.fullName}`);
      console.log(`Individual address fields:`);
      console.log(`  address: "${worker.address || 'empty'}"`);
      console.log(`  state: "${worker.state || 'empty'}"`);
      console.log(`  city: "${worker.city || 'empty'}"`);
      console.log(`  district: "${worker.district || 'empty'}"`);
      console.log(`  block: "${worker.block || 'empty'}"`);
      console.log(`  pincode: "${worker.pincode || 'empty'}"`);
      console.log(`Location object:`);
      if (worker.location) {
        console.log(`  address: "${worker.location.address || 'empty'}"`);
        console.log(`  state: "${worker.location.state || 'empty'}"`);
        console.log(`  city: "${worker.location.city || 'empty'}"`);
        console.log(`  district: "${worker.location.district || 'empty'}"`);
        console.log(`  block: "${worker.location.block || 'empty'}"`);
        console.log(`  zipCode: "${worker.location.zipCode || 'empty'}"`);
      } else {
        console.log(`  location object is null/undefined`);
      }
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLocationData();