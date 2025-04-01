// This file contains logic for CRUD operations on transactions and calling ML services.
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = asyncHandler(async (req, res) => {
  const { 
    amount, 
    type, 
    category, 
    title, 
    description, 
    date, 
    account 
  } = req.body;

  // Validate amount
  const transactionAmount = parseFloat(amount);
  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid amount greater than zero');
  }

  // Prepare transaction data
  const transactionData = {
    amount: transactionAmount,
    type,
    category,
    title: title || (type === 'income' ? 'Income' : 'Expense'),
    description: description || '',
    date: date ? new Date(date) : new Date(),
    user: req.user.id
  };

  // If account is provided, add it to transaction and update asset balance
  if (account) {
    // Validate that the asset exists and belongs to the user
    const asset = await Asset.findOne({ 
      _id: account, 
      user: req.user.id,
      isDeleted: false
    });

    if (!asset) {
      res.status(404);
      throw new Error('Account not found');
    }

    // Add account to transaction
    transactionData.account = account;

    // Update asset balance based on transaction type
    const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;
    
    // If expense, check if asset has sufficient funds
    if (type === 'expense' && asset.balance < transactionAmount) {
      res.status(400);
      throw new Error(`Insufficient funds in ${asset.name}`);
    }

    // Update asset balance
    await Asset.findByIdAndUpdate(
      account,
      { $inc: { balance: balanceChange } },
      { new: true }
    );
  }

  // Create transaction
  const transaction = await Transaction.create(transactionData);

  if (transaction) {
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } else {
    // If transaction creation failed but we updated the asset balance, 
    // we should revert the asset balance change
    if (account) {
      const revertBalanceChange = type === 'income' ? -transactionAmount : transactionAmount;
      await Asset.findByIdAndUpdate(
        account,
        { $inc: { balance: revertBalanceChange } },
        { new: true }
      );
    }
    
    res.status(500);
    throw new Error('Failed to create transaction');
  }
});

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  // Extract query parameters for filtering and pagination
  const {
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
    showDeleted = false
  } = req.query;

  // Base query - only show user's transactions
  const query = { user: req.user.id };

  // Add filters if provided
  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  if (!showDeleted || showDeleted === 'false') {
    query.isDeleted = false;
  }

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Determine sort order
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const transactions = await Transaction.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('account', 'name type');

  // Get total count for pagination
  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Transactions retrieved successfully',
    data: transactions,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('account', 'name type');

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  res.status(200).json({
    success: true,
    message: 'Transaction retrieved successfully',
    data: transaction
  });
});

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  console.log(`Updating transaction ${id} for user ${userId}`);
  console.log('Request body:', req.body);

  // Find transaction by ID and user ID to ensure ownership
  const transaction = await Transaction.findOne({ 
    _id: id, 
    user: userId 
  });

  if (!transaction) {
    console.log(`Transaction ${id} not found for user ${userId}`);
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Create updateData object, handling any fields that are provided
  const updateData = {};
  
  // Handle each field separately to validate properly
  if (req.body.title !== undefined) {
    updateData.title = req.body.title;
  }
  
  if (req.body.description !== undefined) {
    updateData.description = req.body.description;
  }
  
  if (req.body.date !== undefined) {
    updateData.date = new Date(req.body.date);
  }
  
  if (req.body.category !== undefined) {
    updateData.category = req.body.category;
  }

  // Handle account changes if provided
  if (req.body.account !== undefined) {
    updateData.account = req.body.account;
  }
  
  // Handle amount and type changes
  if (req.body.amount !== undefined) {
    // Make sure amount follows the sign convention (positive for income, negative for expense)
    if (req.body.type === 'income') {
      updateData.amount = Math.abs(req.body.amount);
      updateData.type = 'income';
    } else if (req.body.type === 'expense') {
      updateData.amount = -Math.abs(req.body.amount);
      updateData.type = 'expense';
    } else if (req.body.type !== undefined) {
      updateData.type = req.body.type;
      updateData.amount = req.body.type === 'income' 
        ? Math.abs(req.body.amount) 
        : -Math.abs(req.body.amount);
    } else {
      // If only amount changes but not type, keep the original sign logic
      updateData.amount = transaction.type === 'income' 
        ? Math.abs(req.body.amount) 
        : -Math.abs(req.body.amount);
    }
  } else if (req.body.type !== undefined && req.body.type !== transaction.type) {
    // If only type changes but not amount, flip the sign of the existing amount
    updateData.type = req.body.type;
    updateData.amount = req.body.type === 'income' 
      ? Math.abs(transaction.amount) 
      : -Math.abs(transaction.amount);
  }

  console.log('Update data to be applied:', updateData);

  // Update the transaction
  const updatedTransaction = await Transaction.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate(['account', 'category']);

  if (!updatedTransaction) {
    console.log(`Failed to update transaction ${id}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update transaction'
    });
  }

  console.log(`Transaction ${id} updated successfully:`, {
    before: {
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
      date: transaction.date
    },
    after: {
      amount: updatedTransaction.amount,
      type: updatedTransaction.type,
      category: updatedTransaction.category,
      account: updatedTransaction.account,
      date: updatedTransaction.date
    }
  });
  
  // Ensure the response includes both _id and id for frontend compatibility
  const responseData = updatedTransaction.toObject();
  // If _id exists but id doesn't, add id property
  if (responseData._id && !responseData.id) {
    responseData.id = responseData._id;
  }
  
  // Return the updated transaction
  res.status(200).json({
    success: true,
    message: 'Transaction updated successfully',
    data: responseData
  });
});

/**
 * @desc    Delete a transaction (soft delete)
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  console.log(`Soft deleting transaction ${id} for user ${userId}`);
  
  // Find transaction by ID and ensure it belongs to the user
  const transaction = await Transaction.findOne({ 
    _id: id, 
    user: userId,
    isDeleted: false // Make sure it's not already deleted
  });
  
  if (!transaction) {
    console.log(`Transaction ${id} not found or already deleted`);
    return res.status(404).json({
      success: false,
      message: 'Transaction not found or already deleted'
    });
  }
  
  // Handle account balance reversion if the transaction is linked to an account
  if (transaction.account) {
    try {
      // Find the associated account
      const asset = await Asset.findOne({
        _id: transaction.account,
        user: userId,
        isDeleted: false
      });
      
      if (asset) {
        // Calculate the balance change to undo
        // For income, we subtract the amount; for expense, we add it back
        const balanceChange = transaction.amount < 0 ? 
          Math.abs(transaction.amount) : // For expense (negative amount), add it back
          -transaction.amount; // For income (positive amount), subtract it
        
        console.log(`Adjusting balance for asset ${asset.name} by ${balanceChange}`);
        
        // Update the asset balance
        await Asset.findByIdAndUpdate(
          transaction.account,
          { $inc: { balance: balanceChange } },
          { new: true }
        );
      } else {
        console.log(`Associated asset ${transaction.account} not found`);
      }
    } catch (error) {
      console.error('Error adjusting account balance:', error);
      // Continue with transaction deletion even if balance adjustment fails
    }
  }
  
  // Soft delete the transaction
  const deletedTransaction = await Transaction.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  
  if (!deletedTransaction) {
    console.log(`Failed to soft delete transaction ${id}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transaction'
    });
  }
  
  console.log(`Transaction ${id} soft deleted successfully`);
  
  res.status(200).json({
    success: true,
    message: 'Transaction deleted successfully'
  });
});

/**
 * @desc    Permanently delete a transaction
 * @route   DELETE /api/transactions/:id/permanent
 * @access  Private
 */
const permanentDeleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  console.log(`Permanently deleting transaction ${id} for user ${userId}`);
  
  // Find transaction to ensure it exists and belongs to the user
  const transaction = await Transaction.findOne({ 
    _id: id, 
    user: userId
  });
  
  if (!transaction) {
    console.log(`Transaction ${id} not found for user ${userId}`);
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }
  
  // Delete the transaction permanently
  const deletedTransaction = await Transaction.findByIdAndDelete(id);
  
  if (!deletedTransaction) {
    console.log(`Failed to permanently delete transaction ${id}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to permanently delete transaction'
    });
  }
  
  console.log(`Transaction ${id} permanently deleted successfully`);
  
  res.status(200).json({
    success: true,
    message: 'Transaction permanently deleted'
  });
});

/**
 * @desc    Restore a soft-deleted transaction
 * @route   PUT /api/transactions/:id/restore
 * @access  Private
 */
const restoreTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  console.log(`Restoring transaction ${id} for user ${userId}`);
  
  // Find transaction to ensure it exists, is deleted, and belongs to the user
  const transaction = await Transaction.findOne({ 
    _id: id, 
    user: userId,
    isDeleted: true // Ensure it's actually deleted
  });
  
  if (!transaction) {
    console.log(`Deleted transaction ${id} not found for user ${userId}`);
    return res.status(404).json({
      success: false,
      message: 'Deleted transaction not found'
    });
  }
  
  // Handle account balance restoration if the transaction is linked to an account
  if (transaction.account) {
    try {
      // Find the associated account
      const asset = await Asset.findOne({
        _id: transaction.account,
        user: userId,
        isDeleted: false
      });
      
      if (asset) {
        // Calculate the balance change to restore
        // For income, we add the amount back; for expense, we subtract it again
        const balanceChange = transaction.amount < 0 ? 
          transaction.amount : // For expense (negative amount), subtract it again
          transaction.amount; // For income (positive amount), add it back
        
        console.log(`Adjusting balance for asset ${asset.name} by ${balanceChange}`);
        
        // Update the asset balance
        await Asset.findByIdAndUpdate(
          transaction.account,
          { $inc: { balance: balanceChange } },
          { new: true }
        );
      } else {
        console.log(`Associated asset ${transaction.account} not found`);
      }
    } catch (error) {
      console.error('Error adjusting account balance:', error);
      // Continue with transaction restoration even if balance adjustment fails
    }
  }
  
  // Restore the transaction
  const restoredTransaction = await Transaction.findByIdAndUpdate(
    id,
    { isDeleted: false },
    { new: true }
  );
  
  if (!restoredTransaction) {
    console.log(`Failed to restore transaction ${id}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore transaction'
    });
  }
  
  console.log(`Transaction ${id} restored successfully`);
  
  res.status(200).json({
    success: true,
    message: 'Transaction restored successfully',
    data: restoredTransaction
  });
});

module.exports = { 
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  permanentDeleteTransaction,
  restoreTransaction
}; 