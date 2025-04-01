// This file defines the schema for asset transfers using Mongoose.
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetTransfer:
 *       type: object
 *       required:
 *         - fromAsset
 *         - toAsset
 *         - amount
 *         - date
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the transfer
 *         fromAsset:
 *           type: object
 *           description: Source asset reference
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *         toAsset:
 *           type: object
 *           description: Destination asset reference
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *         amount:
 *           type: number
 *           description: Transfer amount
 *         description:
 *           type: string
 *           description: Additional information about this transfer
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the transfer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the transfer was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the transfer was last updated
 *       example:
 *         fromAsset: 
 *           id: "60d5f8b8b98d7e2b5c9c2c0b"
 *           name: "Cash"
 *           type: "cash"
 *         toAsset: 
 *           id: "60d5f8b8b98d7e2b5c9c2c0c"
 *           name: "Savings"
 *           type: "bank"
 *         amount: 500
 *         description: "Moving funds to savings account"
 *         date: "2023-05-15T00:00:00.000Z"
 */

const assetTransferSchema = new mongoose.Schema({
  fromAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Source asset is required']
  },
  toAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Destination asset is required']
  },
  amount: {
    type: Number,
    required: [true, 'Transfer amount is required'],
    min: [0.01, 'Transfer amount must be greater than 0']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Transfer date is required'],
    default: Date.now
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
assetTransferSchema.index({ user: 1 });
assetTransferSchema.index({ user: 1, date: -1 });
assetTransferSchema.index({ fromAsset: 1, user: 1 });
assetTransferSchema.index({ toAsset: 1, user: 1 });

// Creating the AssetTransfer model
const AssetTransfer = mongoose.model('AssetTransfer', assetTransferSchema);

module.exports = AssetTransfer; 