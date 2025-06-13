const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the ConsolidatedUser model
const ConsolidatedUser = require('./models/ConsolidatedUser');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink7', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin user already exists
    const existingAdmin = await ConsolidatedUser.findOne({ email: 'admin@worklink7.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@worklink7.com');
      console.log('Password: admin123');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = new ConsolidatedUser({
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
      mobile: '+1234567890'
    });
    
    await adminUser.save();
    
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: admin@worklink7.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change this password after first login in the admin dashboard.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
createAdminUser();