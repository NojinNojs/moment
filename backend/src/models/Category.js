// This file defines the schema for transaction categories using Mongoose.
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - icon
 *         - color
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The category name
 *         type:
 *           type: string
 *           enum: [income, expense]
 *           description: Whether this is for income or expense transactions
 *         icon:
 *           type: string
 *           description: Icon identifier for this category
 *         color:
 *           type: string
 *           description: Color code (hex or named) for this category
 *         description:
 *           type: string
 *           description: Additional information about this category
 *         isDefault:
 *           type: boolean
 *           description: If true, this is a system default category that cannot be removed
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         order:
 *           type: number
 *           description: Display order for sorting categories
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the category was last updated
 *       example:
 *         name: Salary
 *         type: income
 *         icon: wallet
 *         color: #4CAF50
 *         description: Regular income from employment
 *         isDefault: true
 *         isDeleted: false
 *         order: 1
 */

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    match: [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^[a-zA-Z]+$/,
      'Please provide a valid color (hex code or color name)'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Clear any existing indexes to prevent conflicts
if (mongoose.connection.readyState === 1) {
  // If connected, drop indexes before recreating them
  mongoose.connection.collections.categories?.dropIndexes().catch(err => {
    console.log('No existing indexes to drop or not connected yet');
  });
}

// Index for faster queries
categorySchema.index({ type: 1, isDeleted: 1 });

// Create a compound index on name and type to ensure uniqueness of name within each type
// This is the critical index that prevents duplicate categories with the same name but different types
categorySchema.index({ name: 1, type: 1 }, { unique: true });

// Creating the Category model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 