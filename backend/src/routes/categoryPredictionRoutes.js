const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  predictCategory,
  getMLServiceHealth,
  getMLCategories
} = require('../controllers/categoryPredictionController');

// Route: /api/categories/predict
router.post('/predict', protect, predictCategory);

// Route: /api/categories/predict/health
router.get('/predict/health', protect, authorize('admin'), getMLServiceHealth);

// Route: /api/categories/ml-categories
router.get('/ml-categories', protect, getMLCategories);

module.exports = router; 