// This middleware handles errors and sends a consistent response format.
const errorMiddleware = (err, req, res, next) => {
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
    message: err.message || 'An unexpected error occurred.'
  });
};

module.exports = errorMiddleware; 