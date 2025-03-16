// This middleware handles errors and sends a consistent response format.
const errorMiddleware = (err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: 'An unexpected error occurred.' });
};

module.exports = errorMiddleware; 