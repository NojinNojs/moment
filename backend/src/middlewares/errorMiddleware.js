/**
 * This file contains middleware functions for handling errors and not found routes.
 * It ensures a consistent API response format across the application.
 */

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  
  // Get the status code (use existing status or default to 500)
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Check if this is a MongoDB duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Cannot create an asset with the same name in the same category'
    });
  }
  
  // Check if this is a validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Return the error with the appropriate status code
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Export middleware functions
module.exports = {
  notFound,
  errorHandler
}; 