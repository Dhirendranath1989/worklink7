const axios = require('axios');

async function testMinimalServer() {
  try {
    console.log('Testing minimal server on port 3001...');
    
    // Test the change-password endpoint
    const response = await axios.put('http://localhost:3001/api/users/change-password', {
      newPassword: 'test123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('HTTP Error - Status:', error.response.status);
      console.log('HTTP Error - Data:', error.response.data);
    } else if (error.request) {
      console.log('Network Error - No response received');
      console.log('Error code:', error.code);
    } else {
      console.log('Error setting up request:', error.message);
    }
  }
}

testMinimalServer();