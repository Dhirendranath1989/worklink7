const jwt = require('jsonwebtoken');
const config = require('config'); // or however you store JWT_SECRET

const authenticateToken = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token, authorization denied' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

module.exports = { authenticateToken };