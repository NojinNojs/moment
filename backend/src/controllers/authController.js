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
 * @desc    Register a new user
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
      return apiResponse.badRequest(res, 'User already exists');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      // Generate JWT token
      const token = generateToken(user);

      return apiResponse.success(res, 201, 'User registered successfully', {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        token
      });
    } else {
      return apiResponse.badRequest(res, 'Invalid user data');
    }
  } catch (error) {
    console.error('Register error:', error);
    
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
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      // Generate JWT token
      const token = generateToken(user);

      return apiResponse.success(res, 200, 'Login successful', {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        token
      });
    } else {
      return apiResponse.unauthorized(res, 'Invalid email or password');
    }
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
 * @desc    Get user settings
 * @route   GET /api/v1/auth/settings
 * @access  Private
 */
exports.getUserSettings = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;
    
    const user = await User.findById(req.user.id).select('settings');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 200, 'User settings retrieved successfully', user.settings);
  } catch (error) {
    console.error('Get user settings error:', error);
    
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
};

/**
 * @desc    Update user settings
 * @route   PUT /api/v1/auth/settings
 * @access  Private
 */
exports.updateUserSettings = async (req, res) => {
  try {
    // Check DB connection first
    const connectionError = checkDbConnection(res);
    if (connectionError) return connectionError;
    
    // Get settings from request body
    const { currency, language, colorMode, notifications } = req.body;
    
    // Build settings object with only provided fields
    const settingsUpdate = {};
    
    if (currency !== undefined) settingsUpdate['settings.currency'] = currency;
    if (language !== undefined) settingsUpdate['settings.language'] = language;
    if (colorMode !== undefined) settingsUpdate['settings.colorMode'] = colorMode;
    if (notifications !== undefined) settingsUpdate['settings.notifications'] = notifications;
    
    // If no settings provided
    if (Object.keys(settingsUpdate).length === 0) {
      return apiResponse.badRequest(res, 'No settings provided to update');
    }
    
    // Update user settings
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: settingsUpdate },
      { new: true, runValidators: true }
    ).select('settings');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    return apiResponse.success(res, 200, 'User settings updated successfully', user.settings);
  } catch (error) {
    console.error('Update user settings error:', error);
    
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