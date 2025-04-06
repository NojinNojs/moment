// This file defines routes for user profile management.
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const User = require('../models/User');

// Get current user profile
router.get('/profile', protect, userController.getUserProfile);

// Update user profile
router.put('/profile', protect, userController.updateUserProfile);

// User preferences routes
router.get('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user in the database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return the user's preferences
    return res.status(200).json({
      success: true,
      message: 'User preferences retrieved successfully',
      currency: user.preferences?.currency || 'USD',
      dateFormat: user.preferences?.dateFormat || 'DD/MM/YYYY'
    });
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving user preferences' 
    });
  }
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency, dateFormat } = req.body;
    
    // Create object with provided preferences
    const preferences = {};
    if (currency) preferences.currency = currency;
    if (dateFormat) preferences.dateFormat = dateFormat;
    
    // Check if any preferences were provided
    if (Object.keys(preferences).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid preferences provided'
      });
    }
    
    // Update the user's preferences in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { 'preferences': preferences } },
      { new: true, upsert: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return success message with updated preferences
    return res.status(200).json({
      success: true,
      message: 'User preferences updated successfully',
      currency: updatedUser.preferences?.currency || 'USD',
      dateFormat: updatedUser.preferences?.dateFormat || 'DD/MM/YYYY'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user preferences'
    });
  }
});

module.exports = router; 