const http = require('http');

const data = JSON.stringify({
  currentPassword: 'test123',
  newPassword: 'newtest123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/change-password',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODRiZjNiYmE5ZDhhZGRhMjYwOGYxMDgiLCJlbWFpbCI6ImFkbWluQHdvcmtsaW5rNy5jb20iLCJpYXQiOjE3NDk4NzE4NzksImV4cCI6MTc0OTk1ODI3OX0.NboPlhsAbrep0ktHRpTwhfLAUvJpHC_znwn-NGpdvc4',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
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
  console.error('Error:', error);
});

req.write(data);
req.end();