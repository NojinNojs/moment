// This file contains logic for user registration, login, and JWT token generation.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

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
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
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
        token
      });
    } else {
      return apiResponse.badRequest(res, 'Invalid user data');
    }
  } catch (error) {
    console.error('Register error:', error);
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
        token
      });
    } else {
      return apiResponse.unauthorized(res, 'Invalid email or password');
    }
  } catch (error) {
    console.error('Login error:', error);
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
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }

    return apiResponse.success(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    console.error('Get current user error:', error);
    return apiResponse.error(
      res, 
      500, 
      'Server error', 
      process.env.NODE_ENV === 'development' ? { message: error.message } : null
    );
  }
}; 