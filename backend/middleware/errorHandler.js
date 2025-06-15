const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message: 'Cross-origin request not allowed',
      timestamp: new Date().toISOString()
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      details: err.errors
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 
      'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;