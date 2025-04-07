/**
 * Auth Validation Rules
 * 
 * This module contains the validation rules for authentication routes.
 */
const { body } = require('express-validator');
const validationUtils = require('../utils/validationUtils');

// Validation rules for registration
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .custom((password) => {
      const validation = validationUtils.validatePassword(password);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }
      return true;
    })
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .custom((password) => {
      const validation = validationUtils.validatePassword(password);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }
      return true;
    })
];

module.exports = {
  registerValidation,
  loginValidation
}; 