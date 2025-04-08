// This middleware verifies the JWT token for protected routes.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

/**
 * @desc    Protect routes - Authentication middleware
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return apiResponse.unauthorized(res, 'Not authorized to access this route');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return apiResponse.unauthorized(res, 'User not found');
      }
      
      next();
    } catch (error) {
      return apiResponse.unauthorized(res, 'Not authorized to access this route');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Admin middleware - Verify user is an admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next middleware function
 */
exports.admin = async (req, res, next) => {
  try {
    // Check if user exists and is an admin (based on email)
    if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
      return apiResponse.forbidden(res, 'Admin access required');
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Grant access to specific roles
 * @param   {string[]} roles - Array of allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role || !roles.includes(req.user.role)) {
      return apiResponse.forbidden(
        res, 
        `User role ${req.user.role || 'undefined'} is not authorized to access this route`
      );
    }
    next();
  };
};

module.exports = exports; 