// Controller for handling asset-related operations
const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets
 *     description: Retrieve a list of all assets for the authenticated user. Can be filtered by type.
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [cash, bank, e-wallet, emergency]
 *         description: Filter assets by type
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
 *                     $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getAssets = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  // Build query filter
  const filter = { 
    user: req.user.id, 
    isDeleted: false 
  };
  
  // Add type filter if specified
  if (type && ['cash', 'bank', 'e-wallet', 'emergency'].includes(type)) {
    filter.type = type;
  }
  
  // Get assets sorted by name
  const assets = await Asset.find(filter).sort({ name: 1 });
  
  res.status(200).json({
    success: true,
    count: assets.length,
    data: assets
  });
});

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     description: Retrieve a specific asset by its ID
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
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
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Asset not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ 
    _id: req.params.id, 
    user: req.user.id,
    isDeleted: false 
  });
  
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  res.status(200).json({
    success: true,
    data: asset
  });
});

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create a new asset
 *     description: Create a new asset for the authenticated user
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, balance]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Asset name
 *                 example: "Savings Account"
 *               type:
 *                 type: string
 *                 enum: [cash, bank, e-wallet, emergency]
 *                 description: Asset type
 *                 example: "bank"
 *               balance:
 *                 type: number
 *                 description: Current balance
 *                 example: 5000.50
 *               institution:
 *                 type: string
 *                 description: Financial institution
 *                 example: "XYZ Bank"
 *               description:
 *                 type: string
 *                 description: Asset description
 *                 example: "Primary savings account"
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Bad request, duplicate asset or validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const createAsset = asyncHandler(async (req, res) => {
  // Extract asset data from request body
  const { name, type, balance, institution, description } = req.body;
  
  // Check if asset with same name and type already exists for this user
  const existingAsset = await Asset.findOne({ 
    name: name.trim(),
    type,
    user: req.user.id,
    isDeleted: false
  });
  
  if (existingAsset) {
    res.status(400);
    throw new Error(`An asset with name "${name}" and type "${type}" already exists`);
  }
  
  // Create new asset
  const asset = await Asset.create({
    name,
    type,
    balance: Number(balance),
    institution,
    description,
    user: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: asset
  });
});

/**
 * @swagger
 * /assets/{id}:
 *   put:
 *     summary: Update asset
 *     description: Update an existing asset by ID
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Asset name
 *               type:
 *                 type: string
 *                 enum: [cash, bank, e-wallet, emergency]
 *                 description: Asset type
 *               balance:
 *                 type: number
 *                 description: Current balance
 *               institution:
 *                 type: string
 *                 description: Financial institution
 *               description:
 *                 type: string
 *                 description: Asset description
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Bad request, duplicate asset name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server Error
 */
const updateAsset = asyncHandler(async (req, res) => {
  // Find the asset
  let asset = await Asset.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  // If updating name, check for duplicates
  if ((req.body.name && req.body.name !== asset.name) || 
      (req.body.type && req.body.type !== asset.type)) {
    
    // Determine the name and type to check against
    const nameToCheck = req.body.name ? req.body.name.trim() : asset.name;
    const typeToCheck = req.body.type || asset.type;
    
    const duplicate = await Asset.findOne({
      _id: { $ne: req.params.id },
      name: nameToCheck,
      type: typeToCheck,
      user: req.user.id,
      isDeleted: false
    });
    
    if (duplicate) {
      res.status(400);
      throw new Error(`An asset with name "${nameToCheck}" and type "${typeToCheck}" already exists`);
    }
  }
  
  // Convert balance to number if present
  if (req.body.balance) {
    req.body.balance = Number(req.body.balance);
  }
  
  // Update asset
  asset = await Asset.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: asset
  });
});

/**
 * @swagger
 * /assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     description: Soft delete an asset by setting isDeleted flag to true
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server Error
 */
const deleteAsset = asyncHandler(async (req, res) => {
  // First check if asset exists at all, regardless of deleted status
  const anyAsset = await Asset.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!anyAsset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  // Check if the asset is already deleted
  if (anyAsset.isDeleted) {
    // If already deleted, just return success since the end result is what the user wanted
    console.log(`Asset ${req.params.id} already deleted, returning success`);
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Asset was already deleted'
    });
  }
  
  // Normal flow - find the asset that's not deleted
  const asset = await Asset.findOne({
    _id: req.params.id,
    user: req.user.id,
    isDeleted: false
  });
  
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  // Soft delete by setting isDeleted flag to true
  await Asset.findByIdAndUpdate(req.params.id, { isDeleted: true });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @swagger
 * /assets/{id}/restore:
 *   patch:
 *     summary: Restore deleted asset
 *     description: Restore a soft-deleted asset by setting isDeleted flag to false
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server Error
 */
const restoreAsset = asyncHandler(async (req, res) => {
  // Find the asset including soft-deleted ones
  const asset = await Asset.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  // Check if there's now a conflicting asset name that wasn't deleted
  if (asset.isDeleted) {
    const conflictingAsset = await Asset.findOne({
      name: asset.name,
      type: asset.type,
      user: req.user.id,
      isDeleted: false,
      _id: { $ne: asset._id }
    });
    
    if (conflictingAsset) {
      res.status(400);
      throw new Error(`Cannot restore asset: another asset with the same name and type already exists.`);
    }
  }
  
  // Restore by setting isDeleted to false
  const updatedAsset = await Asset.findByIdAndUpdate(
    req.params.id, 
    { isDeleted: false },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedAsset
  });
});

// Permanent delete - completely removes the asset from the database
const permanentDeleteAsset = asyncHandler(async (req, res) => {
  // First check if asset exists (regardless of deletion status)
  const asset = await Asset.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }
  
  // Permanently delete the asset from the database
  await Asset.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Asset permanently deleted',
    data: {}
  });
});

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  restoreAsset,
  permanentDeleteAsset
}; 