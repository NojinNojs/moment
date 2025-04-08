const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  predictCategory,
  getMLServiceHealth,
  getMLCategories
} = require('../controllers/categoryPredictionController');

// Route: /api/categories/predict
router.post('/predict', protect, predictCategory);

// Route: /api/categories/predict/health
router.get('/predict/health', protect, admin, getMLServiceHealth);

// Route: /api/categories/ml-categories
router.get('/ml-categories', protect, getMLCategories);

module.exports = router; 