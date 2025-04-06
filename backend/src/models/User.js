// This file defines the schema for user data using Mongoose.
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password (will be hashed)
 *         avatar:
 *           type: string
 *           description: The user's avatar image URL
 *         preferences:
 *           type: object
 *           properties:
 *             currency:
 *               type: string
 *               description: The user's preferred currency
 *             language:
 *               type: string
 *               description: The user's preferred language
 *             theme:
 *               type: string
 *               enum: [light, dark, system]
 *               description: The user's preferred theme
 *             dateFormat:
 *               type: string
 *               enum: [DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD]
 *               description: The user's preferred date format
 *             notificationsEnabled:
 *               type: boolean
 *               description: Whether the user wants to receive notifications
 *         isDeleted:
 *           type: boolean
 *           description: Whether the user account is deleted
 *         resetPasswordToken:
 *           type: string
 *           description: The reset password token
 *         resetPasswordExpire:
 *           type: string
 *           format: date
 *           description: The reset password token expiration date
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the user was last updated
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         password: password123
 *         avatar: https://example.com/avatar.jpg
 *         preferences:
 *           currency: USD
 *           language: en
 *           theme: light
 *           dateFormat: DD/MM/YYYY
 *           notificationsEnabled: true
 */

/**
 * User Schema - defines the structure of users in MongoDB
 * 
 * @field name - User's full name
 * @field email - User's email (must be unique)
 * @field password - User's hashed password
 * @field avatar - User's avatar image URL
 * @field preferences - User's preferences and settings
 * @field isDeleted - Whether the user account is deleted
 * @field resetPasswordToken - The reset password token
 * @field resetPasswordExpire - The reset password token expiration date
 * @field createdAt - Timestamp when the user was created
 * @field updatedAt - Timestamp when the user was last updated
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password in queries by default
  },
  avatar: {
    type: String
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'MYR']
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'id']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'system']
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Pre-save hook to hash password before saving to database
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login validation
 * 
 * @param {string} enteredPassword - The password to compare with the stored hash
 * @returns {boolean} - Whether the password matches
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method to generate JWT token
 * 
 * @returns {string} - The generated JWT token
 */
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
