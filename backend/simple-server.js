const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON bodies
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Simple server is running!' });
});

// Test change-password route
app.put('/api/users/change-password', (req, res) => {
  console.log('Change password route hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }
  
  res.json({ message: 'Password change endpoint working' });
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});