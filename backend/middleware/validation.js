const { body, validationResult } = require('express-validator');
const ResponseHelper = require('../utils/responseHelper');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseHelper.error(res, 'Validation failed', 400, {
      errors: errors.array()
    });
  }
  next();
};

const validateGoogleAuth = [
  body('userData.email').isEmail().normalizeEmail(),
  body('userData.firstName').trim().isLength({ min: 1, max: 50 }),
  body('userData.lastName').trim().isLength({ min: 1, max: 50 }),
  body('userData.photoURL').optional().isURL(),
  handleValidationErrors
];

module.exports = {
  validateGoogleAuth,
  handleValidationErrors
};