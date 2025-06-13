const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'test123', email: 'test@example.com' },
  process.env.JWT_SECRET || 'fallback_secret',
  { expiresIn: '24h' }
);

console.log('Bearer ' + token);