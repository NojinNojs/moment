// This file contains logic for CRUD operations on transactions and calling ML services.
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

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
  const id = req.params.id;
  const userId = req.user.id;
  
  // Create a query that works for both MongoDB ObjectIds and numeric IDs
  let query = { user: userId };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    // If it's a valid MongoDB ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    // If it's not a valid ObjectId, it's likely a numeric ID
    query = {
      $or: [
        { id: id },               // Try matching against id field as string
        { id: parseInt(id, 10) }  // Try as a number in case it's stored that way
      ],
      user: userId
    };
  }
  
  const transaction = await Transaction.findOne(query).populate('account', 'name type');

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

  // Create a query that works for both MongoDB ObjectIds and numeric IDs
  let query = { user: userId };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    // If it's a valid MongoDB ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    // If it's not a valid ObjectId, it's likely a numeric ID
    query = {
      $or: [
        { id: id },               // Try matching against id field as string
        { id: parseInt(id, 10) }  // Try as a number in case it's stored that way
      ],
      user: userId
    };
  }

  // Find transaction by ID and user ID to ensure ownership
  const transaction = await Transaction.findOne(query);

  if (!transaction) {
    console.log(`Transaction ${id} not found for user ${userId}`);
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Store original values for asset balance calculation
  const originalAmount = transaction.amount;
  const originalType = transaction.type;
  const originalAccount = transaction.account ? transaction.account.toString() : null;
  
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
  let newAccount = originalAccount;
  if (req.body.account !== undefined) {
    updateData.account = req.body.account;
    newAccount = req.body.account;
  }
  
  // Handle amount and type changes
  let newAmount = originalAmount;
  let newType = originalType;
  
  if (req.body.amount !== undefined) {
    // Parse amount as number to ensure proper calculation
    const parsedAmount = parseFloat(req.body.amount);
    
    // Make sure amount follows the sign convention (positive for income, negative for expense)
    if (req.body.type === 'income') {
      updateData.amount = Math.abs(parsedAmount);
      updateData.type = 'income';
      newType = 'income';
      newAmount = Math.abs(parsedAmount);
    } else if (req.body.type === 'expense') {
      updateData.amount = Math.abs(parsedAmount);
      updateData.type = 'expense';
      newType = 'expense';
      newAmount = Math.abs(parsedAmount);
    } else if (req.body.type !== undefined) {
      updateData.type = req.body.type;
      newType = req.body.type;
      updateData.amount = Math.abs(parsedAmount);
      newAmount = Math.abs(parsedAmount);
    } else {
      // If only amount changes but not type, keep the original type
      updateData.amount = Math.abs(parsedAmount);
      newAmount = Math.abs(parsedAmount);
    }
  } else if (req.body.type !== undefined && req.body.type !== transaction.type) {
    // If only type changes but not amount, keep the same amount
    updateData.type = req.body.type;
    newType = req.body.type;
  }

  try {
    // First, update the transaction - use the actual _id from the found transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transaction._id,
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
    
    // Then, update the account balance(s) if needed
    // Case 1: Amount or type changed but account is the same
    if (originalAccount && (originalAmount !== newAmount || originalType !== newType) && originalAccount === newAccount) {
      // Get the account
      const account = await Asset.findById(originalAccount);
      
      if (account) {
        // Reverse the effect of the original transaction
        if (originalType === 'income') {
          account.balance -= originalAmount;
        } else if (originalType === 'expense') {
          account.balance += originalAmount;
        }
        
        // Apply the effect of the updated transaction
        if (newType === 'income') {
          account.balance += newAmount;
        } else if (newType === 'expense') {
          account.balance -= newAmount;
        }
        
        await account.save();
        console.log(`Updated balance for account ${account.name}: ${account.balance}`);
      }
    }
    // Case 2: Account changed
    else if (originalAccount !== newAccount) {
      // Handle original account if it exists
      if (originalAccount) {
        const originalAccountDoc = await Asset.findById(originalAccount);
        if (originalAccountDoc) {
          // Reverse the effect of the original transaction
          if (originalType === 'income') {
            originalAccountDoc.balance -= originalAmount;
          } else if (originalType === 'expense') {
            originalAccountDoc.balance += originalAmount;
          }
          await originalAccountDoc.save();
          console.log(`Updated balance for original account ${originalAccountDoc.name}: ${originalAccountDoc.balance}`);
        }
      }
      
      // Handle new account if it exists
      if (newAccount) {
        const newAccountDoc = await Asset.findById(newAccount);
        if (newAccountDoc) {
          // Apply the effect of the updated transaction
          if (newType === 'income') {
            newAccountDoc.balance += newAmount;
          } else if (newType === 'expense') {
            newAccountDoc.balance -= newAmount;
          }
          await newAccountDoc.save();
          console.log(`Updated balance for new account ${newAccountDoc.name}: ${newAccountDoc.balance}`);
        }
      }
    }

    console.log(`Transaction ${id} updated successfully:`, {
      before: {
        amount: originalAmount,
        type: originalType,
        account: originalAccount,
        date: transaction.date
      },
      after: {
        amount: updatedTransaction.amount,
        type: updatedTransaction.type,
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
  } catch (error) {
    // If an error occurs, log it and return a proper error response
    console.error(`Error updating transaction ${id}:`, error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the transaction',
      error: error.message
    });
  }
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
  
  // Create a query that works for both MongoDB ObjectIds and numeric IDs
  let query = { user: userId, isDeleted: false };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    // If it's a valid MongoDB ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    // If it's not a valid ObjectId, it's likely a numeric ID
    query = {
      $or: [
        { id: id },               // Try matching against id field as string
        { id: parseInt(id, 10) }  // Try as a number in case it's stored that way
      ],
      user: userId,
      isDeleted: false
    };
  }
  
  // Find transaction by ID and ensure it belongs to the user
  const transaction = await Transaction.findOne(query);
  
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
        // Log the original state before changes
        console.log(`Before deletion adjustment - Asset ${asset.name} balance: ${asset.balance}, Transaction type: ${transaction.type}, Amount: ${transaction.amount}`);
        
        // Calculate the balance change to undo
        // For income, we subtract the amount; for expense, we add it back
        let balanceChange = 0;
        
        if (transaction.type === 'income') {
          // For income, subtract the amount from the balance
          balanceChange = -Math.abs(transaction.amount);
          console.log(`Deleting income transaction: reducing balance by ${Math.abs(transaction.amount)}`);
        } else if (transaction.type === 'expense') {
          // For expense, add the amount back to the balance
          balanceChange = Math.abs(transaction.amount);
          console.log(`Deleting expense transaction: increasing balance by ${Math.abs(transaction.amount)}`);
        }
        
        console.log(`Adjusting balance for asset ${asset.name} by ${balanceChange}`);
        
        // Update the asset balance
        const updatedAsset = await Asset.findByIdAndUpdate(
          transaction.account,
          { $inc: { balance: balanceChange } },
          { new: true }
        );
        
        // Log the final state after changes
        console.log(`After deletion adjustment - Asset ${updatedAsset.name} balance updated from ${asset.balance} to ${updatedAsset.balance}`);
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
    transaction._id,
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
  
  // Create a query that works for both MongoDB ObjectIds and numeric IDs
  let query = { user: userId };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    // If it's a valid MongoDB ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    // If it's not a valid ObjectId, it's likely a numeric ID
    query = {
      $or: [
        { id: id },               // Try matching against id field as string
        { id: parseInt(id, 10) }  // Try as a number in case it's stored that way
      ],
      user: userId
    };
  }
  
  // Find transaction to ensure it exists and belongs to the user
  const transaction = await Transaction.findOne(query);
  
  if (!transaction) {
    console.log(`Transaction ${id} not found for user ${userId}`);
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }
  
  // Delete the transaction permanently - use the actual _id from the found transaction
  const deletedTransaction = await Transaction.findByIdAndDelete(transaction._id);
  
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
  
  // Create a query that works for both MongoDB ObjectIds and numeric IDs
  let query = { user: userId, isDeleted: true };
  
  if (mongoose.Types.ObjectId.isValid(id)) {
    // If it's a valid MongoDB ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(id);
  } else {
    // If it's not a valid ObjectId, it's likely a numeric ID
    query = {
      $or: [
        { id: id },               // Try matching against id field as string
        { id: parseInt(id, 10) }  // Try as a number in case it's stored that way
      ],
      user: userId,
      isDeleted: true
    };
  }
  
  // Find the transaction that was soft-deleted
  const transaction = await Transaction.findOne(query);
  
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
    
    // Log the original state before restoration
    console.log(`Before restoration adjustment - Asset ${account.name} balance: ${account.balance}, Transaction type: ${transaction.type}, Amount: ${transaction.amount}`);
    
    // Store original balance for logging
    const originalBalance = account.balance;
    
    // Update the account balance based on transaction type
    if (transaction.type === 'income') {
      // When restoring income, add the amount back to the balance
      account.balance += Math.abs(transaction.amount);
      console.log(`Restoring income transaction: increasing balance by ${Math.abs(transaction.amount)}`);
    } else if (transaction.type === 'expense') {
      // When restoring expense, subtract the amount from the balance
      account.balance -= Math.abs(transaction.amount);
      console.log(`Restoring expense transaction: decreasing balance by ${Math.abs(transaction.amount)}`);
    }
    
    await account.save();
    
    // Log the final state after restoration
    console.log(`After restoration adjustment - Asset ${account.name} balance updated from ${originalBalance} to ${account.balance}`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Transaction restored successfully',
    data: transaction
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