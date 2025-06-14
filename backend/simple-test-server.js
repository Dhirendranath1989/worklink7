const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Server is working!' });
});

// Simple register route for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Register route hit with body:', req.body);
  res.json({ 
    message: 'Registration test successful',
    received: req.body 
  });
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});

console.log('Server script loaded successfully');