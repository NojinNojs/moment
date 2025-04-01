const express = require('express');
const { 
  getAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  restoreAsset,
  permanentDeleteAsset 
} = require('../controllers/assetController');
const { 
  getAssetTransfers, 
  getAssetTransferById, 
  createAssetTransfer 
} = require('../controllers/assetTransferController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Asset routes
router.route('/')
  .get(getAssets)
  .post(createAsset);

// Asset transfer routes - MOVED UP before /:id routes to prevent param conflicts
router.route('/transfers')
  .get(getAssetTransfers)
  .post(createAssetTransfer);

router.route('/transfers/:id')
  .get(getAssetTransferById);

// Asset specific routes with ID parameter
router.route('/:id')
  .get(getAssetById)
  .put(updateAsset)
  .delete(deleteAsset);
  
// Permanent delete route - separate from soft delete
router.route('/:id/permanent')
  .delete(permanentDeleteAsset);

router.route('/:id/restore')
  .put(restoreAsset);

module.exports = router; 