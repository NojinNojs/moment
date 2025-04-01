// This file defines the schema for assets using Mongoose.
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - balance
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the asset
 *         name:
 *           type: string
 *           description: The asset name
 *         type:
 *           type: string
 *           enum: [cash, bank, e-wallet, emergency]
 *           description: Type of asset
 *         balance:
 *           type: number
 *           description: Current balance of the asset
 *         institution:
 *           type: string
 *           description: Financial institution name (if applicable)
 *         description:
 *           type: string
 *           description: Additional information about this asset
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the asset was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the asset was last updated
 *       example:
 *         name: Savings Account
 *         type: bank
 *         balance: 5000.50
 *         institution: XYZ Bank
 *         description: Primary savings account
 *         isDeleted: false
 */

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [50, 'Asset name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Asset type is required'],
    enum: {
      values: ['cash', 'bank', 'e-wallet', 'emergency'],
      message: 'Type must be one of: cash, bank, e-wallet, emergency'
    }
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    default: 0
  },
  institution: {
    type: String,
    trim: true,
    maxlength: [100, 'Institution name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
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

// Define basic indexes for performance
assetSchema.index({ user: 1, isDeleted: 1 });
assetSchema.index({ user: 1, type: 1 });

// Define the compound uniqueness constraint
// This will auto-create the index when the model is first used
assetSchema.index({ user: 1, name: 1, type: 1 }, { 
  unique: true,
  // Error message if violated
  background: true,
  name: 'unique_user_asset_name_type'
});

// Creating the Asset model
const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset; 