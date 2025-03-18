// This file defines the schema for user data using Mongoose.
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

/**
 * User Schema - defines the structure of users in MongoDB
 * 
 * @field name - User's full name
 * @field email - User's email (must be unique)
 * @field password - User's hashed password
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
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
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
