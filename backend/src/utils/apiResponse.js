/**
 * @desc    Utility for standardized API responses
 * @author  API Development Team
 */

/**
 * Success response structure
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message 
 * @param {Object|Array} data - Response data
 * @param {Object} meta - Meta information (pagination, etc.)
 * @returns {Object} Express response
 */
exports.success = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response structure
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @param {Object} errors - Detailed error information
 * @returns {Object} Express response
 */
exports.error = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error(`Server Error: ${message}`, errors);
  }

  return res.status(statusCode).json(response);
};

/**
 * Not found response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Express response
 */
exports.notFound = (res, message = 'Resource not found') => {
  return exports.error(res, 404, message);
};

/**
 * Bad request response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Bad request message
 * @param {Object} errors - Validation errors
 * @returns {Object} Express response
 */
exports.badRequest = (res, message = 'Bad request', errors = null) => {
  return exports.error(res, 400, message, errors);
};

/**
 * Unauthorized response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Express response
 */
exports.unauthorized = (res, message = 'Unauthorized access') => {
  return exports.error(res, 401, message);
};

/**
 * Forbidden response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Express response
 */
exports.forbidden = (res, message = 'Forbidden access') => {
  return exports.error(res, 403, message);
}; 