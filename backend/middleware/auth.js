const jwt = require('jsonwebtoken');

const authenticateToken = function(req, res, next) {
  console.log(`🔐 Auth middleware called for ${req.method} ${req.path}`);
  
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('🔑 Token received:', token ? 'Present' : 'Missing');

  // Check if no token
  if (!token) {
    console.log('❌ No token provided, returning 401');
    return res.status(401).json({ 
      error: 'Access token required'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    console.log('Auth middleware - decoded user:', decoded);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

module.exports = { authenticateToken };