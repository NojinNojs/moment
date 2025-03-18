// This file defines the routes for CRUD operations on transactions.
const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction
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
 *               - category
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
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid transaction data
 *       401:
 *         description: Not authorized, no token
 *       500:
 *         description: Server error
 */
router.post('/', protect, createTransaction);

// Other CRUD routes

module.exports = router; 