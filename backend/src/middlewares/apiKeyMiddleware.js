/**
 * API Key Authentication Middleware
 * 
 * This middleware validates API requests by verifying the API key in the headers
 * and can be used on routes that need API key protection.
 */
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware to validate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateApiKey = (req, res, next) => {
  // Get API key from request headers
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const expectedApiKey = process.env.API_KEY;
  
  // If no API key is configured, skip validation
  if (!expectedApiKey) {
    console.warn('Warning: API key validation is enabled but no API_KEY is set in environment variables');
    return next();
  }

  // Validate API key
  if (!apiKey) {
    return apiResponse.unauthorized(res, 'API key is missing');
  }

  if (apiKey !== expectedApiKey) {
    return apiResponse.forbidden(res, 'Invalid API key');
  }

  // If API key is valid, continue to the next middleware
  next();
};

// Export middleware functions
module.exports = {
  validateApiKey
}; 