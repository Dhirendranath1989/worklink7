const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false
});

// Different rate limits for different endpoints
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many auth attempts');
const generalLimiter = createRateLimit(15 * 60 * 1000, 100, 'Too many requests');

// Security headers
const securityHeaders = helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.worklinkindia.com"]
    }
  }
});

module.exports = { authLimiter, generalLimiter, securityHeaders };