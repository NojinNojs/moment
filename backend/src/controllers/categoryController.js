// Controller for handling category-related operations
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all categories. Can be filtered by type (income or expense).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter categories by type
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  // Build query filter
  const filter = { isDeleted: false };
  if (type && (type === 'income' || type === 'expense')) {
    filter.type = type;
  }
  
  // Get categories sorted by order
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ 
    _id: req.params.id, 
    isDeleted: false 
  });
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new transaction category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, icon, color]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *                 example: "Freelance Work"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 description: Category type
 *                 example: "income"
 *               icon:
 *                 type: string
 *                 description: Icon identifier
 *                 example: "code"
 *               color:
 *                 type: string
 *                 description: Color code (hex or named)
 *                 example: "#2196F3"
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: "Income from coding projects"
 *               order:
 *                 type: number
 *                 description: Display order
 *                 example: 3
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request, duplicate category or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       500:
 *         description: Server Error
 */
const createCategory = asyncHandler(async (req, res) => {
  // Extract category data from request body
  const { name, type, icon, color, description, order } = req.body;
  
  // Check if category with same name and type already exists
  const existingCategory = await Category.findOne({ 
    name: name.trim(), 
    type,
    isDeleted: false
  });
  
  if (existingCategory) {
    res.status(400);
    throw new Error('A category with this name already exists for the selected type');
  }
  
  // Create new category
  const category = await Category.create({
    name,
    type,
    icon,
    color,
    description,
    order: order || 0,
    isDefault: false
  });
  
  res.status(201).json({
    success: true,
    data: category
  });
});

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update an existing category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 description: Category type
 *               icon:
 *                 type: string
 *                 description: Icon identifier
 *               color:
 *                 type: string
 *                 description: Color code (hex or named)
 *               description:
 *                 type: string
 *                 description: Category description
 *               order:
 *                 type: number
 *                 description: Display order
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request, duplicate category or cannot update default categories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server Error
 */
const updateCategory = asyncHandler(async (req, res) => {
  // Find the category
  let category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Prevent updating default categories (additional security)
  if (category.isDefault && (req.body.name || req.body.type)) {
    res.status(400);
    throw new Error('Cannot modify name or type of default categories');
  }
  
  // If updating name+type, check for duplicates
  if (req.body.name && req.body.type) {
    const duplicate = await Category.findOne({
      _id: { $ne: req.params.id },
      name: req.body.name.trim(),
      type: req.body.type,
      isDeleted: false
    });
    
    if (duplicate) {
      res.status(400);
      throw new Error('A category with this name already exists for the selected type');
    }
  }
  
  // Update category
  category = await Category.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: category
  });
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Soft delete a category by setting isDeleted flag to true
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *       400:
 *         description: Cannot delete default categories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server Error
 */
const deleteCategory = asyncHandler(async (req, res) => {
  // Find the category
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Prevent deleting default categories
  if (category.isDefault) {
    res.status(400);
    throw new Error('Cannot delete default categories');
  }
  
  // Soft delete by setting isDeleted flag to true
  await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @swagger
 * /categories/{id}/restore:
 *   patch:
 *     summary: Restore deleted category
 *     description: Restore a soft-deleted category by setting isDeleted flag to false
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server Error
 */
const restoreCategory = asyncHandler(async (req, res) => {
  // Find the category including soft-deleted ones
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Restore by setting isDeleted to false
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id, 
    { isDeleted: false },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedCategory
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
}; 