// This file defines the schema for transaction data using Mongoose.
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - category
 *         - user
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the transaction
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         type:
 *           type: string
 *           description: Transaction type (income or expense)
 *           enum: [income, expense]
 *         category:
 *           type: string
 *           description: Transaction category
 *         description:
 *           type: string
 *           description: Transaction description
 *         date:
 *           type: string
 *           format: date
 *           description: Transaction date
 *         user:
 *           type: string
 *           description: User ID who owns this transaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was last updated
 */

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(value) {
        // Untuk validasi: jangan izinkan 0, tapi izinkan positif dan negatif
        return value !== 0;
      },
      message: 'Amount cannot be zero'
    }
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    default: Date.now
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Indexes for faster queries
transactionSchema.index({ user: 1 });
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, isDeleted: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 