// transactionRoutes.js
// This file defines the routes for CRUD operations on transactions.

const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create a new transaction
router.post('/', authMiddleware, createTransaction);

// Other CRUD routes

module.exports = router; 