// Routes for category-related operations
const express = require('express');
const router = express.Router();

// Import controllers
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
} = require('../controllers/categoryController');

// Import middlewares
const { protect, authorize } = require('../middlewares/authMiddleware');

// Use middleware for all routes
router.use(protect); // Require authentication for all category routes

// GET all categories & POST a new category
router.route('/')
  .get(getCategories)
  .post(authorize('admin'), createCategory);

// GET, PUT, DELETE specific category by ID
router.route('/:id')
  .get(getCategoryById)
  .put(authorize('admin'), updateCategory)
  .delete(authorize('admin'), deleteCategory);

// PATCH to restore a deleted category
router.route('/:id/restore')
  .patch(authorize('admin'), restoreCategory);

module.exports = router; 