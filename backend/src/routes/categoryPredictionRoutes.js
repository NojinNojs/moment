const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  predictCategory,
  getMLServiceHealth,
  getMLCategories
} = require('../controllers/categoryPredictionController');

// Route: /api/v1/categories/predict
router.post('/predict', protect, predictCategory);

// Route: /api/v1/categories/ml/health
router.get('/ml/health', protect, getMLServiceHealth);

// Route: /api/v1/categories/ml/list
router.get('/ml/list', protect, getMLCategories);

module.exports = router; 