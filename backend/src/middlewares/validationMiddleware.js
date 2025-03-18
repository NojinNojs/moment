const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware to validate request data using express-validator
 * 
 * @returns {Function} Express middleware
 */
exports.validate = (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  // Format validation errors
  const formattedErrors = {};
  errors.array().forEach(error => {
    if (!formattedErrors[error.path]) {
      formattedErrors[error.path] = [];
    }
    formattedErrors[error.path].push(error.msg);
  });

  // Return error response
  return apiResponse.badRequest(
    res, 
    'Validation failed', 
    formattedErrors
  );
}; 