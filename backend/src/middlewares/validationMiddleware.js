const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware to validate request data using express-validator
 * 
 * @param {Array} validations - Array of express-validator validations
 * @returns {Function} Express middleware
 */
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

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
}; 