const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const { protect } = require('../middlewares/authMiddleware');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

/**
 * @route   PUT /api/transactions/:id/restore
 * @desc    Restore a soft-deleted transaction
 * @access  Private
 */
router.put('/:id/restore', protect, apiKeyMiddleware.validateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log(`Restoring transaction ${id} for user ${userId}`);
    
    // First check if any soft-deleted transactions exist for this user
    const anyDeletedTransactions = await Transaction.find({ 
      user: userId, 
      isDeleted: true 
    });
    
    console.log(`Found ${anyDeletedTransactions.length} soft-deleted transactions for user ${userId}`);
    if (anyDeletedTransactions.length > 0) {
      console.log('Sample deleted transaction:', {
        _id: anyDeletedTransactions[0]._id,
        id: anyDeletedTransactions[0].id,
        title: anyDeletedTransactions[0].title
      });
    }
    
    // Make a more comprehensive query that tries multiple approaches to find the transaction
    let query = { 
      user: userId, 
      isDeleted: true
    };
    
    const orConditions = [];
    
    // Try MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    
    // Try string ID matches (both in id field and _id as string)
    orConditions.push({ id: id });
    
    // Try numeric ID if it looks like a number
    if (!isNaN(parseInt(id, 10))) {
      orConditions.push({ id: parseInt(id, 10) });
    }
    
    // If we have any conditions, use them
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }
    
    // Debug the query
    console.log('Searching with comprehensive query:', JSON.stringify(query));
    
    // Find the transaction with our comprehensive query
    const transaction = await Transaction.findOne(query);
    
    if (!transaction) {
      console.log(`Transaction not found with comprehensive query`);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or is not deleted'
      });
    }
    
    console.log(`Found transaction to restore:`, {
      _id: transaction._id,
      id: transaction.id,
      title: transaction.title,
      isDeleted: transaction.isDeleted
    });
    
    // Restore the transaction by setting isDeleted back to false
    transaction.isDeleted = false;
    await transaction.save();
    
    // Now update the account balance based on transaction type
    if (transaction.account) {
      const account = await Asset.findById(transaction.account);
      
      if (!account) {
        console.error(`Account ${transaction.account} not found for restored transaction ${id}`);
        return res.status(200).json({
          success: true,
          message: 'Transaction restored but account balance not updated',
          data: transaction
        });
      }
      
      // Update the account balance based on transaction type
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance -= transaction.amount;
      }
      
      await account.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Transaction restored successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error restoring transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore transaction',
      error: error.message
    });
  }
});

module.exports = router; 