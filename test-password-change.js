const http = require('http');

// Test the password change endpoint
function testPasswordChange() {
  const data = JSON.stringify({
    newPassword: 'testpass123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/change-password',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('Testing password change endpoint...');
  
  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.log('Request error:', error.message);
  });

  req.write(data);
  req.end();
}

testPasswordChange();