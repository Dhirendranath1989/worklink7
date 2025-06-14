const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPasswordChange() {
  try {
    console.log('=== Testing Password Change Functionality ===\n');
    
    // Step 1: Register a test user
    console.log('1. Creating test user...');
    const registerData = {
      fullName: 'Test User',
      email: 'testuser@example.com',
      password: 'testpass123',
      userType: 'worker'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✓ User registered successfully');
    console.log('User ID:', registerResponse.data.user.id);
    console.log('Token received:', registerResponse.data.token ? 'Yes' : 'No');
    
    const token = registerResponse.data.token;
    
    // Step 2: Test login with original password
    console.log('\n2. Testing login with original password...');
    const loginData = {
      email: 'testuser@example.com',
      password: 'testpass123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✓ Login successful with original password');
    
    // Step 3: Change password
    console.log('\n3. Testing password change...');
    const changePasswordData = {
      currentPassword: 'testpass123',
      newPassword: 'newpass456'
    };
    
    const changePasswordResponse = await axios.put(
      `${BASE_URL}/auth/change-password`,
      changePasswordData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ Password changed successfully');
    console.log('Response:', changePasswordResponse.data.message);
    
    // Step 4: Test login with old password (should fail)
    console.log('\n4. Testing login with old password (should fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'testuser@example.com',
        password: 'testpass123'
      });
      console.log('✗ ERROR: Login with old password should have failed!');
    } catch (error) {
      console.log('✓ Login with old password correctly failed');
    }
    
    // Step 5: Test login with new password
    console.log('\n5. Testing login with new password...');
    const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'newpass456'
    });
    console.log('✓ Login successful with new password');
    
    console.log('\n=== All tests passed! Password change functionality is working correctly ===');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config?.url);
    } else if (error.request) {
      console.error('No response received. Request details:');
      console.error('- URL:', error.config?.url);
      console.error('- Method:', error.config?.method);
      console.error('- Error Code:', error.code);
      console.error('- Error Message:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('\nFull error object:', error.toString());
  }
}

// Run the test
testPasswordChange();