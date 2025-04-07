// This file contains logic for user profile management.
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { validateAndBuildPreferenceUpdate } = require('../utils/preferenceValidation');
const validationUtils = require('../utils/validationUtils');

/**
 * Validation middleware for profile updates
 */
exports.validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.badRequest(res, 'Validation failed', errors.array());
    }
    next();
  }
];

/**
 * Validation middleware for preferences updates
 */
exports.validateUpdatePreferences = [
  body('currency')
    .optional()
    .isIn(validationUtils.allowedCurrencies)
    .withMessage('Currency must be a valid option'),
  body('dateFormat')
    .optional()
    .isIn(validationUtils.allowedDateFormats)
    .withMessage('Date format must be a valid option'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.badRequest(res, 'Validation failed', errors.array());
    }
    next();
  }
];

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    apiResponse.success(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    apiResponse.error(res, 500, 'Server error', { error: error.message });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    apiResponse.success(res, 200, 'User profile updated successfully', user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    apiResponse.error(res, 500, 'Server error', { error: error.message });
  }
};

/**
 * Get user preferences
 * @route GET /api/users/preferences
 * @access Private
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    apiResponse.success(res, 200, 'User preferences retrieved successfully', user.preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    apiResponse.error(res, 500, 'Server error', { error: error.message });
  }
};

/**
 * Update user preferences
 * @route PUT /api/users/preferences
 * @access Private
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    // Use the validation utility to validate and build update object
    const validationResult = validateAndBuildPreferenceUpdate(req.body);
    
    // If not valid, send error response
    if (!validationResult.isValid) {
      return apiResponse.badRequest(res, validationResult.errors[0]);
    }
    
    // If no updates, send error
    if (!validationResult.hasUpdates) {
      return apiResponse.badRequest(res, 'No valid preferences provided');
    }
    
    // Update user preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: validationResult.preferencesUpdate },
      { new: true, runValidators: true }
    ).select('preferences');
    
    if (!user) {
      return apiResponse.notFound(res, 'User not found');
    }
    
    apiResponse.success(res, 200, 'User preferences updated successfully', user.preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    apiResponse.error(res, 500, 'Server error', { error: error.message });
  }
}; 