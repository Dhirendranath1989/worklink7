const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');

async function checkWorkPhotos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/worklink');
    console.log('Connected to MongoDB');
    
    // Find workers with workPhotos
    const workersWithPhotos = await ConsolidatedUser.find({
      userType: 'worker',
      workPhotos: { $exists: true, $ne: [] }
    }).select('_id firstName lastName workPhotos').limit(5);
    
    console.log('Workers with workPhotos:', workersWithPhotos.length);
    
    if (workersWithPhotos.length > 0) {
      console.log('Sample worker with photos:');
      console.log(JSON.stringify(workersWithPhotos[0], null, 2));
    }
    
    // Check total workers
    const totalWorkers = await ConsolidatedUser.countDocuments({ userType: 'worker' });
    console.log('Total workers:', totalWorkers);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWorkPhotos();