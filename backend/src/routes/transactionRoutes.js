// This file defines the routes for CRUD operations on transactions.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  permanentDeleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { apiKeyValidation } = require('../middlewares/apiKeyMiddleware');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - category
 *         - user
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the transaction
 *           example: 60d5f8b8b98d7e2b5c9c2c0b
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           example: 125.50
 *         type:
 *           type: string
 *           description: Transaction type (income or expense)
 *           enum: [income, expense]
 *           example: expense
 *         category:
 *           type: string
 *           description: Transaction category
 *           example: groceries
 *         description:
 *           type: string
 *           description: Transaction description
 *           example: Weekly grocery shopping
 *         date:
 *           type: string
 *           format: date
 *           description: Transaction date
 *           example: "2023-03-15"
 *         user:
 *           type: string
 *           description: User ID who owns this transaction
 *           example: 60d5f8b8b98d7e2b5c9c2c0b
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was created
 *           example: "2023-03-15T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the transaction was last updated
 *           example: "2023-03-15T12:00:00Z"
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: Creates a new transaction for the authenticated user. If useAutoCategory is true, category field is optional and will be auto-assigned.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - title
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Transaction amount (must be greater than 0)
 *                 example: 50.25
 *               type:
 *                 type: string
 *                 description: Transaction type (income or expense)
 *                 enum: [income, expense]
 *                 example: expense
 *               useAutoCategory:
 *                 type: boolean
 *                 description: When set to true, the system will automatically predict a category based on title and description
 *                 example: true
 *               category:
 *                 type: string
 *                 description: Transaction category (REQUIRED if useAutoCategory is false or not provided)
 *                 example: Food
 *               title:
 *                 type: string
 *                 description: Transaction title (used for auto-categorization)
 *                 example: Grocery shopping
 *               description:
 *                 type: string
 *                 description: Additional details about the transaction (helps improve auto-categorization)
 *                 example: Weekly groceries from Supermarket XYZ
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Transaction date (defaults to current date if not provided)
 *                 example: 2023-05-15
 *               account:
 *                 type: string
 *                 description: Account ID associated with the transaction
 *                 example: 615f5c6e7b419c001f3d48c5
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Transaction created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 615f5c6e7b419c001f3d48c5
 *                     amount:
 *                       type: number
 *                       example: 50.25
 *                     type:
 *                       type: string
 *                       example: expense
 *                     category:
 *                       type: string
 *                       example: Food & Dining
 *                     title:
 *                       type: string
 *                       example: Grocery shopping
 *                     description:
 *                       type: string
 *                       example: Weekly groceries from Supermarket XYZ
 *                     date:
 *                       type: string
 *                       example: 2023-05-15T00:00:00.000Z
 *                     user:
 *                       type: string
 *                       example: 615f5c6e7b419c001f3d48c9
 *                     isAutoCategorizationApplied:
 *                       type: boolean
 *                       example: true
 *                     categoryConfidence:
 *                       type: number
 *                       example: 0.92
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  protect,
  [
    // Validation rules
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isNumeric().withMessage('Amount must be a number')
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    
    body('useAutoCategory')
      .optional()
      .isBoolean().withMessage('useAutoCategory must be a boolean'),
    
    // Make category required unless useAutoCategory is true
    body('category')
      .custom((value, { req }) => {
        // If useAutoCategory is explicitly set to true, category is optional
        if (req.body.useAutoCategory === true) {
          return true;
        }
        // Otherwise category is required
        if (!value || value.trim() === '') {
          throw new Error('Category is required when not using auto-categorization');
        }
        return true;
      })
      .trim(),
    
    body('title')
      .notEmpty().withMessage('Title is required')
      .trim(),
    
    body('description')
      .optional()
      .trim(),
    
    body('date')
      .optional()
      .isDate().withMessage('Date must be a valid date format')
  ],
  validate,
  createTransaction
);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieves a list of all transactions for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by transaction category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (inclusive)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category]
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Transactions retrieved successfully
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 50
 *                         pages:
 *                           type: number
 *                           example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', protect, getTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     description: Retrieves a single transaction by its ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Transaction retrieved successfully
 *                     data:
 *                       $ref: '#/components/schemas/Transaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', protect, getTransactionById);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     description: Updates an existing transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Transaction amount
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 description: Transaction type
 *               category:
 *                 type: string
 *                 description: Transaction category
 *               description:
 *                 type: string
 *                 description: Transaction description
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Transaction date
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Transaction updated successfully
 *                     data:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', protect, updateTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     description: Soft deletes a transaction (marks as deleted)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Transaction deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', protect, deleteTransaction);

/**
 * @swagger
 * /transactions/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a transaction
 *     description: Permanently removes a transaction (no recovery possible)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction permanently deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Transaction permanently deleted
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id/permanent', protect, permanentDeleteTransaction);

module.exports = router; 