const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret';
  console.log('Using JWT secret:', secret);
  console.log('Token to verify:', token.substring(0, 20) + '...');

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      console.error('Error details:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    console.log('JWT verification successful for user:', user.userId);
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };