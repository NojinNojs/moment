// This file contains logic for user registration, login, and JWT token generation.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const mongoose = require('mongoose');

/**
 * Helper function to generate JWT token
 * 
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Helper function to check database connection
 */
const checkDbConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    return apiResponse.error(
      res,
      503,
      'Database not connected. Please make sure MongoDB is running.',
      { details: 'The application cannot perform database operations until MongoDB is running.' }
    );
  }
  return false;
};

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;

    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return apiResponse.badRequest(res, 'User with this email already exists');
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Return success response with token
    return apiResponse.success(res, 201, 'User registered successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return apiResponse.badRequest(res, messages.join(', '));
    }
    
    // Check for MongoDB connection errors
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNotConnectedError') {
      return apiResponse.error(
        res,
        503,
        'Database connection error. Please make sure MongoDB is running.',
        process.env.NODE_ENV === 'development' ? { message: error.message } : null
      );
    }
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;

    const { email, password } = req.body;

    // Find user by email and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return apiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return apiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    return apiResponse.success(res, 200, 'Login successful', {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Check for MongoDB connection errors
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNotConnectedError') {
      return apiResponse.error(
        res,
        503,
        'Database connection error. Please make sure MongoDB is running.',
        process.env.NODE_ENV === 'development' ? { message: error.message } : null
      );
    }
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    console.error('Get current user error:', error);
    
    // Check for MongoDB connection errors
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNotConnectedError') {
      return apiResponse.error(
        res,
        503,
        'Database connection error. Please make sure MongoDB is running.',
        process.env.NODE_ENV === 'development' ? { message: error.message } : null
      );
    }
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Get user preferences
 * @route   GET /api/v1/auth/preferences
 * @access  Private
 */
exports.getUserPreferences = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;
    
    const user = await User.findById(req.user.id).select('preferences');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 200, 'User preferences retrieved successfully', user.preferences);
  } catch (error) {
    console.error('Get user preferences error:', error);
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/v1/auth/preferences
 * @access  Private
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;
    
    // Get preferences from request body
    const { currency, dateFormat } = req.body;
    
    // Build preferences object with only provided fields
    const preferencesUpdate = {};
    
    if (currency !== undefined) preferencesUpdate['preferences.currency'] = currency;
    if (dateFormat !== undefined) preferencesUpdate['preferences.dateFormat'] = dateFormat;
    
    // If no preferences provided
    if (Object.keys(preferencesUpdate).length === 0) {
      return apiResponse.badRequest(res, 'No preferences provided to update');
    }
    
    // Update user preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: preferencesUpdate },
      { new: true, runValidators: true }
    ).select('preferences');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    return apiResponse.success(res, 200, 'User preferences updated successfully', user.preferences);
  } catch (error) {
    console.error('Update user preferences error:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return apiResponse.badRequest(res, messages.join(', '));
    }
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Logout user (clear cookies)
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
exports.logout = (req, res) => {
  try {
    // If using cookies for authentication, you would clear them here
    // res.clearCookie('token');
    
    return apiResponse.success(res, 200, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
}; 