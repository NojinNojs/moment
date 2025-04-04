// This file defines the schema for user data using Mongoose.
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

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
 *         settings:
 *           type: object
 *           properties:
 *             currency:
 *               type: string
 *               description: The user's preferred currency
 *             language:
 *               type: string
 *               description: The user's preferred language
 *             colorMode:
 *               type: string
 *               enum: [light, dark]
 *               description: The user's preferred color mode
 *             notifications:
 *               type: boolean
 *               description: Whether the user wants to receive notifications
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
 *         settings:
 *           currency: USD
 *           language: en
 *           colorMode: light
 *           notifications: true
 */

/**
 * User Schema - defines the structure of users in MongoDB
 * 
 * @field name - User's full name
 * @field email - User's email (must be unique)
 * @field password - User's hashed password
 * @field settings - User's preferences and settings
 * @field createdAt - Timestamp when the user was created
 * @field updatedAt - Timestamp when the user was last updated
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    colorMode: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Pre-save hook to hash password before saving to database
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt and hash the password with fewer rounds for better performance
    const salt = await bcrypt.genSalt(8); // Reduced from 10 to 8 rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login validation
 * 
 * @param {string} candidatePassword - The password to compare with the stored hash
 * @returns {boolean} - Whether the password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
