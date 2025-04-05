const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Restore a soft-deleted transaction
 * @route   PUT /api/transactions/:id/restore
 * @access  Private
 */
const restoreTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  console.log(`Restoring transaction ${id} for user ${userId}`);
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid transaction ID'
    });
    return;
  }
  
  // Find the transaction that was soft-deleted
  const transaction = await Transaction.findOne({
    _id: id,
    user: userId,
    isDeleted: true
  });
  
  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found or is not deleted'
    });
    return;
  }
  
  // Restore the transaction by setting isDeleted back to false
  transaction.isDeleted = false;
  await transaction.save();
  
  // Now update the account balance based on transaction type
  if (transaction.account) {
    const account = await Asset.findById(transaction.account);
    
    if (!account) {
      console.error(`Account ${transaction.account} not found for restored transaction ${id}`);
      res.status(200).json({
        success: true,
        message: 'Transaction restored but account balance not updated',
        data: transaction
      });
      return;
    }
    
    // Update the account balance based on transaction type
    if (transaction.type === 'income') {
      account.balance += transaction.amount;
    } else if (transaction.type === 'expense') {
      account.balance -= transaction.amount;
    }
    
    await account.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Transaction restored successfully',
    data: transaction
  });
});

module.exports = { restoreTransaction }; 