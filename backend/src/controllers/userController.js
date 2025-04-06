// This file contains logic for user profile management.
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const { body, validationResult } = require('express-validator');

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
    const { name, email, avatar } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (avatar) updateFields.avatar = avatar;
    
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
    const { currency, language, theme, dateFormat, notificationsEnabled } = req.body;
    
    // Build preferences update object with only provided fields
    const preferencesUpdate = {};
    
    if (currency) {
      // Validate currency is in allowed list
      const allowedCurrencies = ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'MYR'];
      if (!allowedCurrencies.includes(currency)) {
        return apiResponse.badRequest(res, 'Invalid currency');
      }
      preferencesUpdate['preferences.currency'] = currency;
    }
    
    if (language) {
      // Validate language is in allowed list
      const allowedLanguages = ['en', 'id'];
      if (!allowedLanguages.includes(language)) {
        return apiResponse.badRequest(res, 'Invalid language');
      }
      preferencesUpdate['preferences.language'] = language;
    }
    
    if (theme) {
      // Validate theme is in allowed list
      const allowedThemes = ['light', 'dark', 'system'];
      if (!allowedThemes.includes(theme)) {
        return apiResponse.badRequest(res, 'Invalid theme');
      }
      preferencesUpdate['preferences.theme'] = theme;
    }
    
    if (dateFormat) {
      // Validate dateFormat is in allowed list
      const allowedDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
      if (!allowedDateFormats.includes(dateFormat)) {
        return apiResponse.badRequest(res, 'Invalid date format');
      }
      preferencesUpdate['preferences.dateFormat'] = dateFormat;
    }
    
    if (notificationsEnabled !== undefined) {
      preferencesUpdate['preferences.notificationsEnabled'] = Boolean(notificationsEnabled);
    }
    
    // If no valid preferences were provided
    if (Object.keys(preferencesUpdate).length === 0) {
      return apiResponse.badRequest(res, 'No valid preferences provided');
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
    
    apiResponse.success(res, 200, 'User preferences updated successfully', user.preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    apiResponse.error(res, 500, 'Server error', { error: error.message });
  }
}; 