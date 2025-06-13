const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ConsolidatedUser = require('./models/ConsolidatedUser');

mongoose.connect('mongodb://localhost:27017/worklink7')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check the actual collection name
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try to find admin in the actual collection
    const consolidatedUsersCollection = db.collection('consolidatedusers');
    const existingAdmin = await consolidatedUsersCollection.findOne({ email: 'admin@worklink7.com' });
    
    if (existingAdmin) {
      console.log('Admin user found in consolidatedusers collection:');
      console.log('- Email:', existingAdmin.email);
      console.log('- Role:', existingAdmin.role);
      console.log('- UserType:', existingAdmin.userType);
      
      // Update role if needed
      if (existingAdmin.role !== 'admin') {
        await consolidatedUsersCollection.updateOne(
          { email: 'admin@worklink7.com' },
          { $set: { role: 'admin', userType: 'admin' } }
        );
        console.log('Admin role updated');
      }
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Create admin user directly in the collection
      const adminUser = {
        email: 'admin@worklink7.com',
        password: hashedPassword,
        userType: 'admin',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        isEmailVerified: true,
        profileCompleted: true,
        phone: '+1234567890',
        mobile: '+1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await consolidatedUsersCollection.insertOne(adminUser);
      console.log('Admin user created successfully!');
    }
    
    // Verify the admin user exists and can be found by the model
    const modelAdmin = await ConsolidatedUser.findOne({ email: 'admin@worklink7.com' });
    console.log('\nAdmin user found via model:', !!modelAdmin);
    if (modelAdmin) {
      console.log('- Role:', modelAdmin.role);
      console.log('- UserType:', modelAdmin.userType);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });