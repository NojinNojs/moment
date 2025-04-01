// Controller for handling asset transfer operations
const AssetTransfer = require('../models/AssetTransfer');
const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/v1/assets/transfers:
 *   get:
 *     summary: Get all asset transfers
 *     description: Retrieve a list of asset transfers for the authenticated user
 *     tags: [AssetTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transfers to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: fromAsset
 *         schema:
 *           type: string
 *         description: Filter by source asset ID
 *       - in: query
 *         name: toAsset
 *         schema:
 *           type: string
 *         description: Filter by destination asset ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AssetTransfer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getAssetTransfers = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, fromAsset, toAsset } = req.query;
  
  // Build query filter
  const filter = { user: req.user.id };
  
  // Add fromAsset filter if specified
  if (fromAsset) {
    filter.fromAsset = fromAsset;
  }
  
  // Add toAsset filter if specified
  if (toAsset) {
    filter.toAsset = toAsset;
  }
  
  // Get transfers with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get transfers sorted by date (newest first)
  const transfers = await AssetTransfer.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('fromAsset', 'name type')
    .populate('toAsset', 'name type');
  
  // Get total count
  const total = await AssetTransfer.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    count: transfers.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: transfers
  });
});

/**
 * @swagger
 * /api/v1/assets/transfers/{id}:
 *   get:
 *     summary: Get asset transfer by ID
 *     description: Retrieve a specific asset transfer by its ID
 *     tags: [AssetTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetTransfer'
 *       404:
 *         description: Transfer not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getAssetTransferById = asyncHandler(async (req, res) => {
  const transfer = await AssetTransfer.findOne({ 
    _id: req.params.id, 
    user: req.user.id 
  })
  .populate('fromAsset', 'name type')
  .populate('toAsset', 'name type');
  
  if (!transfer) {
    res.status(404);
    throw new Error('Transfer not found');
  }
  
  res.status(200).json({
    success: true,
    data: transfer
  });
});

/**
 * @swagger
 * /api/v1/assets/transfers:
 *   post:
 *     summary: Create a new asset transfer
 *     description: Transfer funds between two assets owned by the authenticated user
 *     tags: [AssetTransfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAsset, toAsset, amount]
 *             properties:
 *               fromAsset:
 *                 type: string
 *                 description: Source asset ID
 *                 example: "60d5f8b8b98d7e2b5c9c2c0b"
 *               toAsset:
 *                 type: string
 *                 description: Destination asset ID
 *                 example: "60d5f8b8b98d7e2b5c9c2c0c"
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *                 example: 500
 *               description:
 *                 type: string
 *                 description: Transfer description
 *                 example: "Moving funds to savings"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Transfer date
 *                 example: "2023-05-15T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Transfer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssetTransfer'
 *       400:
 *         description: Bad request, validation error, or insufficient funds
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Assets not found
 *       500:
 *         description: Server Error
 */
const createAssetTransfer = asyncHandler(async (req, res) => {
  const { fromAsset: fromAssetId, toAsset: toAssetId, amount, description, date } = req.body;
  
  // Validate the amount
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Please provide a valid transfer amount greater than zero');
  }
  
  // Convert amount to number
  const transferAmount = Number(amount);
  
  // Verify that the assets exist and belong to the user
  const fromAsset = await Asset.findOne({ 
    _id: fromAssetId, 
    user: req.user.id,
    isDeleted: false
  });
  
  const toAsset = await Asset.findOne({ 
    _id: toAssetId, 
    user: req.user.id,
    isDeleted: false
  });
  
  // Check if both assets exist
  if (!fromAsset) {
    res.status(404);
    throw new Error('Source asset not found');
  }
  
  if (!toAsset) {
    res.status(404);
    throw new Error('Destination asset not found');
  }
  
  // Check if source asset has sufficient funds
  if (fromAsset.balance < transferAmount) {
    res.status(400);
    throw new Error(`Insufficient funds in ${fromAsset.name}`);
  }
  
  try {
    // No transactions - do sequential updates instead
    
    // Update source asset balance
    const updatedFromAsset = await Asset.findByIdAndUpdate(
      fromAssetId,
      { $inc: { balance: -transferAmount } },
      { new: true }
    );
    
    if (!updatedFromAsset) {
      res.status(404);
      throw new Error('Failed to update source asset');
    }
    
    // Update destination asset balance
    const updatedToAsset = await Asset.findByIdAndUpdate(
      toAssetId,
      { $inc: { balance: transferAmount } },
      { new: true }
    );
    
    if (!updatedToAsset) {
      // Revert the source asset update if destination update fails
      await Asset.findByIdAndUpdate(
        fromAssetId,
        { $inc: { balance: transferAmount } },
        { new: true }
      );
      res.status(404);
      throw new Error('Failed to update destination asset');
    }
    
    // Create transfer record
    const transferData = {
      fromAsset: fromAssetId,
      toAsset: toAssetId,
      amount: transferAmount,
      description,
      date: date || new Date(),
      user: req.user.id
    };
    
    const transfer = await AssetTransfer.create(transferData);
    
    if (!transfer) {
      // Revert both asset updates if transfer creation fails
      await Asset.findByIdAndUpdate(
        fromAssetId,
        { $inc: { balance: transferAmount } },
        { new: true }
      );
      
      await Asset.findByIdAndUpdate(
        toAssetId,
        { $inc: { balance: -transferAmount } },
        { new: true }
      );
      
      res.status(500);
      throw new Error('Failed to create transfer record');
    }
    
    // Retrieve the created transfer with populated fields
    const createdTransfer = await AssetTransfer.findById(transfer._id)
      .populate('fromAsset', 'name type')
      .populate('toAsset', 'name type');
    
    res.status(201).json({
      success: true,
      data: createdTransfer
    });
  } catch (error) {
    // Pass the error to the error handler
    res.status(500);
    throw new Error(`Transfer failed: ${error.message}`);
  }
});

module.exports = {
  getAssetTransfers,
  getAssetTransferById,
  createAssetTransfer
}; 