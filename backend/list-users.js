const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');

mongoose.connect('mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // List all users
    const users = await ConsolidatedUser.find({});
    console.log('Total users found:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- UserType:', user.userType);
      console.log('- ID:', user._id);
    });
    
    // Also check the old User collection if it exists
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => console.log('- ' + col.name));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });