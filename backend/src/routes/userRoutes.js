// This file defines routes for user profile management.
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const User = require('../models/User');

// Get current user profile
router.get('/profile', protect, userController.getUserProfile);

// Update user profile
router.put('/profile', protect, userController.validateUpdateProfile, userController.updateUserProfile);

// User preferences routes
router.get('/preferences', protect, userController.getUserPreferences);

// Update user preferences
router.put('/preferences', protect, userController.validateUpdatePreferences, userController.updateUserPreferences);

module.exports = router; 