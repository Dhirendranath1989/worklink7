const mongoose = require('mongoose');
const ConsolidatedUser = require('./models/ConsolidatedUser');

mongoose.connect('mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const admin = await ConsolidatedUser.findOne({email: 'admin@worklink7.com'});
    console.log('Admin user found:', !!admin);
    
    if (admin) {
      console.log('Admin details:');
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- UserType:', admin.userType);
      console.log('- ID:', admin._id);
      
      // Update admin role if needed
      if (admin.role !== 'admin') {
        console.log('Updating admin role...');
        admin.role = 'admin';
        admin.userType = 'admin';
        await admin.save();
        console.log('Admin role updated successfully');
      } else {
        console.log('Admin role is already correct');
      }
    } else {
      console.log('Admin user not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });