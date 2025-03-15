// authRoutes.js
// This file defines the routes for user registration and login.

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

module.exports = router; 