const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('Testing /api/users/change-password endpoint...');
    
    // Test without auth token (should get 401)
    const response = await axios.put('http://localhost:5000/api/users/change-password', {
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
      console.log('HTTP Error - Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Network Error - No response received');
      console.log('Request details:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
    console.log('Error code:', error.code);
    console.log('Full error object:', JSON.stringify(error, null, 2));
  }
}

testEndpoint();