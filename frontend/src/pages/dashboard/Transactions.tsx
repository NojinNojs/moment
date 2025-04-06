import { useState, useCallback, useEffect, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/common/DashboardHeader";
import {
  Transaction,
  TransactionOverview,
  TransactionActions,
  TransactionHistory,
  ResponsiveTransactionModal,
  TransactionMode,
  TransactionFormData,
  TransactionFormErrors,
  DeleteTransactionDialog
} from "@/components/dashboard/transactions";
import { toast } from "sonner";
import apiService from "@/services/api";
import { Asset, AssetTransfer } from "@/types/assets";
import { EventBus } from "@/lib/utils";

// Define interfaces for category and account objects
interface CategoryObject {
  _id?: string;
  id?: string | number;
  name: string;
  type?: string;
  color?: string;
}

interface AccountObject {
  _id?: string;
  id?: string | number;
  name: string;
  type: string;
  balance?: number;
}

// Add this type definition below the existing interfaces (around line 24)
interface TransactionWithBulkOp extends Transaction {
  _bulkOperation: boolean;
}

// Add this type guard function after the existing interfaces
function hasBulkOperation(transaction: Transaction): transaction is TransactionWithBulkOp {
  return '_bulkOperation' in transaction;
}

// For backward compatibility, export an alias to the centralized EventBus
export const TransactionEventBus = EventBus;

export default function Transactions() {
  // Page component state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [restoringTransactionId, setRestoringTransactionId] = useState<string | null>(null);
  
  // State for asset transfers
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  
  // Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentTransactionMode, setCurrentTransactionMode] = useState<TransactionMode>('add');
  const [currentTransactionType, setCurrentTransactionType] = useState<'income' | 'expense'>('income');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | undefined>(undefined);
  
  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    title: '',
    category: '',
    description: '',
    date: '',
    account: ''
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState<TransactionFormErrors>({
    date: undefined
  });
  
  // Account state
  const [accounts, setAccounts] = useState<Asset[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Calculate total assets for more accurate balance display
  const totalAssets = useMemo(() => 
    accounts.reduce((total, asset) => total + (asset.isDeleted ? 0 : asset.balance), 0),
    [accounts]
  );

  // Fetch user accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await apiService.getAssets();
      if (response.success && response.data) {
        // Filter out deleted accounts
        const activeAccounts = response.data.filter(account => !account.isDeleted);
        setAccounts(activeAccounts);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts", {
        description: "Please try again later",
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Fetch asset transfers
  const fetchAssetTransfers = useCallback(async () => {
    try {
      const response = await apiService.getAssetTransfers();
      if (response.success && response.data) {
        setAssetTransfers(response.data);
      }
    } catch (error) {
      console.error("Error fetching asset transfers:", error);
      toast.error("Failed to load asset transfers", {
        description: "Please try again later",
      });
    }
  }, []);

  // Update the fetchTransactions function to use the new API parameter for resolving references
  const fetchTransactions = useCallback(async (options: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    showDeleted?: boolean;
    resolveReferences?: boolean;
  } = {}) => {
    try {
      // Add the resolveReferences flag to use the enhanced API feature
      const response = await apiService.getTransactions({ 
        ...options,
        resolveReferences: options.resolveReferences ?? true // Default to true if not specified
      });
      
      if (response.success && response.data) {
        // Process the transactions to ensure they're properly formatted
        const processedTransactions = response.data.map((transaction) => {
          // Ensure the transaction has a numeric id
          const id = transaction.id !== undefined ? Number(transaction.id) : 
                    (transaction._id ? parseInt(transaction._id.substring(0, 8), 16) : Math.floor(Math.random() * 100000) + 1);
          
          // Convert date to string if it's a Date object
          const date = transaction.date instanceof Date 
            ? transaction.date.toISOString().split('T')[0]
            : transaction.date;
          
          return { ...transaction, id, date };
        });
        
        setTransactions(processedTransactions as Transaction[]);
      } else {
        console.error(response.message || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : "An unknown error occurred");
    }
  }, []);

  // Function to reload all transaction-related data
  const refreshAllData = useCallback(async () => {
    console.log("Refreshing all transaction data...");
    try {
      await Promise.all([
        fetchTransactions({ resolveReferences: true }),
        fetchAccounts(),
        fetchAssetTransfers()
      ]);
      console.log("All transaction data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing transaction data:", error);
    }
  }, [fetchTransactions, fetchAccounts, fetchAssetTransfers]);

  // Fetch accounts and transfers when component mounts
  useEffect(() => {
    fetchAccounts();
    fetchAssetTransfers();
  }, [fetchAccounts, fetchAssetTransfers]);

  // Fetch transactions when component mounts or data changes
  useEffect(() => {
    fetchTransactions({ resolveReferences: true });
  }, [fetchTransactions]);

  // Function to handle permanent delete events  
  const handlePermanentDeleteEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    try {
      const { 
        transaction,
        wasAlreadySoftDeleted 
      } = customEvent.detail;
      
      console.log("🗑️ PERMANENT DELETE event received:", {
        transactionId: transaction.id,
        _id: transaction._id || 'none',
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        wasAlreadySoftDeleted
      });
      
      // Update asset balance based on transaction type
      const updateBalance = async () => {
        try {
          // CRITICAL CHANGE: ALWAYS update balance for permanent deletions,
          // even if it was previously soft-deleted (fixing the balance update bug)
          if (transaction.account) {
            const accountId = typeof transaction.account === 'object' 
              ? (transaction.account.id || transaction.account._id)
              : transaction.account;
              
            if (accountId) {
              // Fetch the current account data to get accurate balance
              const accountResponse = await apiService.getAccountById(accountId.toString());
              if (accountResponse.success && accountResponse.data) {
                const account = accountResponse.data;
                let newBalance = account.balance;
                const amount = Math.abs(transaction.amount);
                
                // ALWAYS update the balance, regardless of whether it was soft-deleted
                console.log(`💰 ALWAYS adjusting balance for permanent deletion of ${transaction.type} transaction:`, {
                  title: transaction.title,
                  amount,
                  currentBalance: account.balance,
                  wasAlreadySoftDeleted
                });
                
                // FINANCIAL LOGIC: Same as updateAssetBalanceForTransaction
                // Example 1: Asset with 100 - expense 30 = 70, then delete expense (+30) = 100 (original)
                // Example 2: Asset with 100 + income 30 = 130, then delete income (-30) = 100 (original)
                
                if (transaction.type === 'income') {
                  // When deleting income: DECREASE the balance (removing the income)
                  newBalance -= amount;
                  console.log(`🔻 Decreasing balance by ${amount} for permanently deleted income (${account.balance} - ${amount} = ${newBalance})`);
                } else if (transaction.type === 'expense') {
                  // When deleting expense: INCREASE the balance (adding back what was spent)
                  newBalance += amount;
                  console.log(`🔺 Increasing balance by ${amount} for permanently deleted expense (${account.balance} + ${amount} = ${newBalance})`);
                }
                
                // For debug/verification purposes
                console.log(`💵 PERMANENT DELETE RECALCULATION for ${transaction.title}:`);
                if (transaction.type === 'income') {
                  console.log(`  Original balance: ${account.balance}`);
                  console.log(`  Income amount: ${amount}`);
                  console.log(`  Permanently deleting income, so: ${account.balance} - ${amount} = ${account.balance - amount}`);
                } else if (transaction.type === 'expense') {
                  console.log(`  Original balance: ${account.balance}`);
                  console.log(`  Expense amount: ${amount}`);
                  console.log(`  Permanently deleting expense, so: ${account.balance} + ${amount} = ${account.balance + amount}`);
                }
                
                // Ensure balance is never negative
                if (newBalance < 0) {
                  console.warn(`⚠️ Calculated negative balance (${newBalance}) during permanent deletion, capping at 0`);
                  newBalance = 0;
                }
                
                console.log(`⚠️ New balance for ${account.name}: ${newBalance} (before: ${account.balance})`);
                
                // Update account balance
                await apiService.updateAsset(accountId.toString(), {
                  ...account,
                  balance: newBalance
                });
                
                // Refresh accounts to update UI
                await fetchAccounts();
              }
            }
          }
        } catch (error) {
          console.error('🔴 Error updating balance during permanent deletion:', error);
        }
      };
      
      // Update balance first
      updateBalance();
      
      // Update the local state to remove the transaction for immediate UI feedback
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => 
          (t.id !== transaction.id) && 
          (!t._id || !transaction._id || t._id !== transaction._id)
        )
      );
      
    } catch (error) {
      console.error("🔴 Error handling permanent delete event:", error);
    }
  }, [fetchAccounts]);

  // Listen for permanent delete events from the DeleteTransactionDialog
  useEffect(() => {
    document.addEventListener('transaction:permanentlyDeleted', handlePermanentDeleteEvent as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('transaction:permanentlyDeleted', handlePermanentDeleteEvent as EventListener);
    };
  }, [handlePermanentDeleteEvent]);

  // Helper function to update asset balance for a transaction
  const updateAssetBalanceForTransaction = async (transaction: Transaction, isDeleting: boolean) => {
    console.log(`🚨 BALANCE UPDATE: Transaction: ${transaction.title}, isDeleting=${isDeleting}, currentIsDeleted=${transaction.isDeleted}`);
    
    try {
      if (!transaction.account) {
        console.log("🔴 No account found for transaction, skipping balance update");
        return;
      }
      
      // Get the account ID from the transaction
      const accountId = typeof transaction.account === 'object' 
        ? (transaction.account.id || transaction.account._id)
        : transaction.account;
        
      if (!accountId) {
        console.log("🔴 No valid account ID found, skipping balance update");
        return;
      }
      
      // Fetch the current account data to get accurate balance
      console.log(`📊 Fetching current account data for ID: ${accountId}`);
      const accountResponse = await apiService.getAccountById(accountId.toString());
      if (!accountResponse.success || !accountResponse.data) {
        console.error("🔴 Failed to fetch account for balance update");
        return;
      }
      
      const account = accountResponse.data;
      let newBalance = account.balance;
      const amount = Math.abs(transaction.amount);
      const transactionType = transaction.type || 'unknown';
      
      console.log(`💰 BALANCE CALCULATION for ${transaction.title}:`, {
        action: isDeleting ? 'Deleting' : 'Restoring',
        transactionType,
        amount,
        currentBalance: account.balance
      });
      
      // When isDeleting=true, we're marking a transaction as deleted (soft delete)
      // When isDeleting=false, we're restoring a deleted transaction
      
      // FINANCIAL LOGIC: 
      // Example 1: Asset with 100 - expense 30 = 70, then delete expense (+30) = 100 (original)
      // Example 2: Asset with 100 + income 30 = 130, then delete income (-30) = 100 (original)
      
      if (isDeleting) {
        // DELETING TRANSACTION: Reverse its effect on the balance
        if (transactionType === 'income') {
          // When deleting income: DECREASE the balance (removing the income)
          console.log(`🔻 Deleting INCOME (${transaction.title}): Decreasing balance by ${amount} (${account.balance} - ${amount} = ${account.balance - amount})`);
          newBalance -= amount;
        } 
        else if (transactionType === 'expense') {
          // When deleting expense: INCREASE the balance (adding back what was spent)
          console.log(`🔺 Deleting EXPENSE (${transaction.title}): Increasing balance by ${amount} (${account.balance} + ${amount} = ${account.balance + amount})`);
          newBalance += amount;
        }
      } 
      else {
        // RESTORING TRANSACTION: Apply its original effect on the balance
        if (transactionType === 'income') {
          // When restoring income: INCREASE the balance (adding the income back)
          console.log(`🔺 Restoring INCOME (${transaction.title}): Increasing balance by ${amount} (${account.balance} + ${amount} = ${account.balance + amount})`);
          newBalance += amount;
        } 
        else if (transactionType === 'expense') {
          // When restoring expense: DECREASE the balance (applying the expense again)
          console.log(`🔻 Restoring EXPENSE (${transaction.title}): Decreasing balance by ${amount} (${account.balance} - ${amount} = ${account.balance - amount})`);
          newBalance -= amount;
        }
      }
      
      // For debug/verification purposes
      console.log(`💵 RECALCULATION for ${transaction.title}:`);
      if (isDeleting && transactionType === 'income') {
        console.log(`  Original balance: ${account.balance}`);
        console.log(`  Income amount: ${amount}`);
        console.log(`  Deleting income, so: ${account.balance} - ${amount} = ${account.balance - amount}`);
      } else if (isDeleting && transactionType === 'expense') {
        console.log(`  Original balance: ${account.balance}`);
        console.log(`  Expense amount: ${amount}`);
        console.log(`  Deleting expense, so: ${account.balance} + ${amount} = ${account.balance + amount}`);
      }
      
      // Ensure balance is never negative
      if (newBalance < 0) {
        console.warn(`⚠️ Calculated negative balance (${newBalance}), capping at 0`);
        newBalance = 0;
      }
      
      console.log(`⚠️ BALANCE CHANGE for account ${account.name}:`, { 
        oldBalance: account.balance, 
        newBalance, 
        difference: newBalance - account.balance 
      });
      
      // Update the account balance
      await apiService.updateAsset(accountId.toString(), {
        ...account,
        balance: newBalance
      });
      
      // Refresh accounts to update UI
      await fetchAccounts();
      console.log(`✅ Balance update complete. New balance for ${account.name}: ${newBalance}`);
    } catch (error) {
      console.error("🔴 Error updating asset balance:", error);
    }
  };

  // Set up event listeners to update data when transactions change
  useEffect(() => {
    // Listen for transaction events to refresh data
    const createdListener = TransactionEventBus.on('transaction:created', refreshAllData);
    const updatedListener = TransactionEventBus.on('transaction:updated', refreshAllData);
    const deletedListener = TransactionEventBus.on('transaction:softDeleted', refreshAllData);
    const restoredListener = TransactionEventBus.on('transaction:restored', refreshAllData);

    // Clean up listeners on unmount
    return () => {
      createdListener();
      updatedListener();
      deletedListener();
      restoredListener();
    };
  }, [refreshAllData]);

  // Function to convert AssetTransfer to Transaction format
  const convertTransfersToTransactions = useCallback((transfers: AssetTransfer[]): Transaction[] => {
    const usedIds = new Set<number>();
    
    const generateUniqueId = (seed?: string): number => {
      // Try to generate ID from seed if available
      let id: number;
      if (seed) {
        const substringLength = Math.min(seed.length, 8);
        const substring = seed.substring(0, substringLength);
        id = parseInt(substring, 16);
      } else {
        // If no seed is available, generate a random ID
        id = Math.floor(Math.random() * 100000) + 1;
      }
      
      // Ensure ID is valid
      if (isNaN(id) || id === 0 || usedIds.has(id)) {
        id = Math.floor(Math.random() * 100000) + 1;
        
        // Ensure new ID isn't a duplicate
        while (usedIds.has(id)) {
          id = Math.floor(Math.random() * 100000) + 1;
        }
      }
      
      // Add to set of used IDs
      usedIds.add(id);
      return id;
    };

    return transfers.map(transfer => {
      // Extract asset names - handling both string IDs and object references
      const fromAssetName = typeof transfer.fromAsset === 'object' && transfer.fromAsset 
        ? transfer.fromAsset.name 
        : typeof transfer.fromAsset === 'string' ? transfer.fromAsset : 'Unknown';
        
      const toAssetName = typeof transfer.toAsset === 'object' && transfer.toAsset
        ? transfer.toAsset.name
        : typeof transfer.toAsset === 'string' ? transfer.toAsset : 'Unknown';
      
      // Get ID from transfer
      const transferIdStr = String(transfer._id || transfer.id || '');
      
      // Generate unique ID for transaction
      const numericId = generateUniqueId(transferIdStr);
      
      // Create a proper transaction object from the transfer
      return {
        id: numericId,
        _id: transfer._id || undefined,
        title: `Transfer: ${fromAssetName} → ${toAssetName}`,
        amount: transfer.amount,
        date: typeof transfer.date === 'string' ? transfer.date : new Date(transfer.date).toISOString().split('T')[0],
        category: 'Transfer',
        description: transfer.description || `Transfer from ${fromAssetName} to ${toAssetName}`,
        account: fromAssetName,
        transferType: 'transfer',
        fromAsset: fromAssetName,
        toAsset: toAssetName,
        type: 'expense', // Default type for display purposes
        status: 'completed'
      };
    });
  }, []);

  // Combine regular transactions and transfers before displaying
  const getAllTransactions = useMemo(() => {
    const transferTransactions = convertTransfersToTransactions(assetTransfers);
    const combinedTransactions = [...transactions, ...transferTransactions];
    
    // Sort by date (newest first)
    return combinedTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, assetTransfers, convertTransfersToTransactions]);

  // Use getAllTransactions for calculations AND history display
  const activeTransactions = useMemo(
    () => getAllTransactions.filter(t => !t.isDeleted),
    [getAllTransactions]
  );
  
  const totalIncome = useMemo(() => 
    activeTransactions
    .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );
  
  const totalExpenses = useMemo(() => 
    activeTransactions
      .filter(t => t.type === "expense" && t.transferType !== "transfer")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [activeTransactions]
  );
  
  // Net amount based on total assets if available
  const netAmount = useMemo(() => 
    totalAssets > 0 ? totalAssets : (totalIncome - totalExpenses),
    [totalIncome, totalExpenses, totalAssets]
  );

  // Calculate trends from transactions
  const calculateTrend = (current: number, previous: number): { value: number, isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const percentChange = ((current - previous) / Math.abs(previous)) * 100;
    return { 
      value: Math.abs(Number(percentChange.toFixed(1))), 
      isPositive: percentChange >= 0 
    };
  };

  // Get current month and previous month transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTransactions = activeTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const previousMonthTransactions = activeTransactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
  });

  // Calculate current and previous month totals
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousMonthIncome = previousMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const currentMonthNet = currentMonthIncome - currentMonthExpenses;
  const previousMonthNet = previousMonthIncome - previousMonthExpenses;

  // Calculate trends
  const incomeTrend = calculateTrend(currentMonthIncome, previousMonthIncome);
  const expensesTrend = calculateTrend(currentMonthExpenses, previousMonthExpenses);
  const netTrend = calculateTrend(currentMonthNet, previousMonthNet);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({
      amount: '',
      title: '',
      category: '',
      description: '',
      date: '',
      account: ''
    });
    setFormErrors({});
  }, []);

  // Handle opening transaction modal for adding income
  const handleAddIncome = useCallback(() => {
    // Refresh accounts list when opening modal
    fetchAccounts();
    
    setCurrentTransactionMode('add');
    setCurrentTransactionType('income');
    setCurrentTransactionId(undefined);
    resetForm();
    setShowTransactionModal(true);
  }, [fetchAccounts, resetForm]);

  // Handle opening transaction modal for adding expense
  const handleAddExpense = useCallback(() => {
    // Refresh accounts list when opening modal
    fetchAccounts();
    
    setCurrentTransactionMode('add');
    setCurrentTransactionType('expense');
    setCurrentTransactionId(undefined);
    resetForm();
    setShowTransactionModal(true);
  }, [fetchAccounts, resetForm]);

  // Handle opening transaction modal for editing
  const handleEditTransaction = async (id: number | string) => {
    const transaction = transactions.find(t => 
      String(t.id) === String(id) || 
      (t._id && String(t._id) === String(id))
    );
    if (!transaction) return;
    
    console.log("Editing transaction:", transaction);
    
    // Set mode to edit first
    setCurrentTransactionMode('edit');
    
    // Ensure IDs are resolved to objects before opening the edit form
    if (typeof transaction.account === 'string' && /^[0-9a-f]{24}$/i.test(transaction.account)) {
      try {
        const accountResponse = await apiService.getAccountById(transaction.account);
        if (accountResponse.success && accountResponse.data) {
          // Update the transaction account with the full object
          (transaction as Transaction).account = accountResponse.data as AccountObject;
        }
      } catch (error) {
        console.error("Failed to resolve account:", error);
      }
    }
    
    if (typeof transaction.category === 'string' && /^[0-9a-f]{24}$/i.test(transaction.category)) {
      try {
        const categoryResponse = await apiService.getCategoryById(transaction.category);
        if (categoryResponse.success && categoryResponse.data) {
          // Update the transaction category with the full object
          (transaction as Transaction).category = categoryResponse.data as CategoryObject;
        }
      } catch (error) {
        console.error("Failed to resolve category:", error);
      }
    }
    
    // Now proceed with the edit as before
    setCurrentTransactionId(typeof id === 'string' ? parseInt(id) : id);
    setCurrentTransactionType(transaction.type as 'income' | 'expense');
    
    // Ensure the date is in YYYY-MM-DD format
    let formattedDate = transaction.date;
    if (transaction.date) {
      try {
        // Try to parse and format the date
        const parsedDate = new Date(transaction.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log("Formatted date for edit:", formattedDate);
        }
      } catch (error) {
        console.error("Error formatting date for edit:", error);
      }
    }
    
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      title: transaction.title || '',
      category: typeof transaction.category === 'object' && transaction.category !== null ? 
        ((transaction.category as CategoryObject)._id || (transaction.category as CategoryObject).id || '').toString() : 
        transaction.category?.toString() || '',
      description: transaction.description || '',
      date: formattedDate,
      account: typeof transaction.account === 'object' && transaction.account !== null ? 
        ((transaction.account as AccountObject)._id || (transaction.account as AccountObject).id || '').toString() : 
        transaction.account?.toString() || ''
    });
    
    console.log("Form data set for edit:", {
      amount: Math.abs(transaction.amount).toString(),
      title: transaction.title || '',
      category: typeof transaction.category === 'object' && transaction.category !== null ? 
        ((transaction.category as CategoryObject)._id || (transaction.category as CategoryObject).id || '').toString() : 
        transaction.category?.toString() || '',
      description: transaction.description || '',
      date: formattedDate,
      account: typeof transaction.account === 'object' && transaction.account !== null ? 
        ((transaction.account as AccountObject)._id || (transaction.account as AccountObject).id || '').toString() : 
        transaction.account?.toString() || ''
    });
    
    setFormErrors({});
    setShowTransactionModal(true);
  };

  // Handle closing transaction modal
  const handleCloseModal = useCallback(() => {
    setShowTransactionModal(false);
  }, []);

  // Handle changes to form fields
  const handleAmountChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
    
    // Clear error when user starts typing
    if (formErrors.amount && value) {
      setFormErrors(prev => ({ ...prev, amount: undefined }));
    }
  }, [formErrors]);

  const handleCategoryChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
    
    // Clear error when user selects a category
    if (formErrors.category) {
      setFormErrors(prev => ({ ...prev, category: undefined }));
    }
  }, [formErrors]);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, date: value }));
  }, []);

  // Validate form before submission
  const validateForm = useCallback(() => {
    const errors: TransactionFormErrors = {};

    // Check amount
    if (!formData.amount) {
      errors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = "Amount must be greater than zero";
    }

    // Check category
    if (!formData.category) {
      errors.category = "Category is required";
    }
    
    // Check title
    if (!formData.title) {
      errors.title = "Title is required";
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 30) {
      errors.title = "Title must be at most 30 characters";
    }
    
    // Check account
    if (!formData.account) {
      errors.account = "Account is required";
    }

    // Check date
    if (!formData.date) {
      errors.date = "Date is required";
    }

    // Description is optional, no validation needed

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Helper function to update financial data after transaction changes - defined before it's used
  const updateFinancialData = useCallback((type: 'income' | 'expense', amount: number) => {
    console.log(`Updating financial data: ${type} - $${amount}`);
    // Update financial statistics based on transaction type and amount
    setTransactions(prev => {
      // Just return the current state to trigger a re-render
      // The actual financial calculations are done by parent components
      return [...prev];
    });
    
    // Refresh data to ensure all components are updated
    refreshAllData();
  }, [refreshAllData]);

  const handleRestoreTransaction = useCallback(async (id: string | number) => {
    // Convert id to string to ensure compatibility
    const idStr = String(id);
    
    try {
      setRestoringTransactionId(idStr);
      
      // Find the transaction to restore
      const transactionToRestore = transactions.find(t => 
        String(t.id) === idStr || (t._id && String(t._id) === idStr)
      );
      
      if (!transactionToRestore) {
        console.error(`Transaction with ID ${idStr} not found for restoration`);
        return;
      }
      
      // Add loading state check for UI
      const isRestoring = Boolean(restoringTransactionId);
      console.log(`Restoring transaction: ${idStr}, loading state: ${isRestoring}`);
      
      // Call API to restore transaction
      const response = await apiService.restoreTransaction(idStr);
      
      if (response.success) {
        // Update local transaction state
        setTransactions(prev => 
          prev.map(t => {
            if (String(t.id) === idStr || (t._id && String(t._id) === idStr)) {
              // Ensure id is kept as a number even if the response returns a string
              const responseData = response.data || {};
              const responseId = responseData && 'id' in responseData ? responseData.id : null;
              
              return {
                ...t,
                isDeleted: false,
                ...responseData,
                id: typeof t.id === 'number' ? t.id : 
                    typeof responseId === 'number' ? responseId : 
                    parseInt(String(t.id || responseId), 10) || t.id
              };
            }
            return t;
          })
        );
        
        // Update financial data
        const amount = Math.abs(transactionToRestore.amount);
        const type = transactionToRestore.type as 'income' | 'expense';
        
        updateFinancialData(type, amount);
        
        toast.success("Transaction restored successfully");
        
        // Emit event for other components to react
        EventBus.emit('transaction:restored', {
          transaction: {
            ...transactionToRestore,
            isDeleted: false,
            ...response.data
          },
          type,
          amount
        });
      } else {
        toast.error("Failed to restore transaction");
      }
    } catch (error) {
      console.error("Error restoring transaction:", error);
      toast.error("Failed to restore transaction");
    } finally {
      setRestoringTransactionId(null);
    }
  }, [transactions, updateFinancialData, restoringTransactionId]);

  // Function to perform soft delete
  const performSoftDelete = async (transactionId: string, isDeleted: boolean) => {
    console.log(`🚨 [performSoftDelete] Transaction ID: ${transactionId}, Setting isDeleted: ${isDeleted}`);
    
    try {
      // Find transaction in state
      const transaction = transactions.find(t => 
        t.id.toString() === transactionId.toString() || 
        (t._id && t._id.toString() === transactionId.toString())
      );
      
      if (!transaction) {
        console.error(`🔴 Transaction not found with ID: ${transactionId}`);
        toast.error("Transaction not found", {
          description: "Could not find the transaction to delete.",
          position: "bottom-right"
        });
        return;
      }
      
      console.log(`📝 ${isDeleted ? 'SOFT DELETING' : 'RESTORING'} transaction:`, {
        id: transaction.id,
        _id: transaction._id || 'none',
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        currentIsDeleted: transaction.isDeleted
      });
      
      // Skip if transaction is already in the desired state
      if (transaction.isDeleted === isDeleted) {
        console.log(`⚠️ Transaction is already ${isDeleted ? 'deleted' : 'active'}, skipping operation`);
        return;
      }
      
      // Create a copy of the transaction with updated isDeleted state
      const updatedTransaction = { ...transaction, isDeleted };
      
      // If we have an account ID, try to get its current balance for debugging
      const logAccountBalanceBefore = async () => {
        try {
          const accountId = typeof transaction.account === 'object' 
            ? (transaction.account.id || transaction.account._id)
            : transaction.account;
            
          if (accountId) {
            const accountResponse = await apiService.getAccountById(accountId.toString());
            if (accountResponse.success && accountResponse.data) {
              const account = accountResponse.data;
              console.log(`💰 ASSET BALANCE BEFORE ${isDeleted ? 'DELETION' : 'RESTORATION'}: ${account.name} = ${account.balance}`);
              
              // Show expected update
              const amount = Math.abs(transaction.amount);
              
              if (isDeleted) {
                if (transaction.type === 'income') {
                  console.log(`💰 EXPECTED AFTER DELETION: ${account.balance} - ${amount} = ${account.balance - amount}`);
                } else if (transaction.type === 'expense') {
                  console.log(`💰 EXPECTED AFTER DELETION: ${account.balance} + ${amount} = ${account.balance + amount}`);
                }
              } else {
                if (transaction.type === 'income') {
                  console.log(`💰 EXPECTED AFTER RESTORATION: ${account.balance} + ${amount} = ${account.balance + amount}`);
                } else if (transaction.type === 'expense') {
                  console.log(`💰 EXPECTED AFTER RESTORATION: ${account.balance} - ${amount} = ${account.balance - amount}`);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error getting account balance for debugging:", error);
        }
      };
      
      // Log the account balance before the operation
      await logAccountBalanceBefore();
      
      // Update local state first for immediate UI feedback (using a more immutable approach)
      setTransactions(prevTransactions => {
        const newTransactions = prevTransactions.map(t => {
          // Match by both numeric id and MongoDB _id to be safe
          if (t.id.toString() === transaction.id?.toString() || 
              (t._id && transaction._id && t._id.toString() === transaction._id.toString())) {
            return updatedTransaction;
          }
          return t;
        });
        
        // Log the state change to verify transactions are being updated
        console.log(`🔄 State updated: ${isDeleted ? 'Removed' : 'Restored'} transaction from UI view`, {
          before: prevTransactions.length,
          after: newTransactions.length,
          activeAfter: newTransactions.filter(t => !t.isDeleted).length
        });
        
        return newTransactions;
      });
      
      // Force a refresh of the entire transaction state if we're deleting
      if (isDeleted) {
        // Give React a chance to process the state update with a small delay
        setTimeout(() => {
          console.log("🔄 Forcing transaction view update...");
          setTransactions(prev => [...prev]);
        }, 50);
      }
      
      console.log(`⚠️ BALANCE UPDATE OPERATION STARTING: ${isDeleted ? 'DELETING' : 'RESTORING'} ${transaction.type} transaction with amount ${Math.abs(transaction.amount)}`);
      
      // CRITICAL: Update asset balance based on transaction type and action
      // When soft-deleting (isDeleted=true) income: decrease account balance
      // When soft-deleting (isDeleted=true) expense: increase account balance
      // When restoring (isDeleted=false) income: increase account balance 
      // When restoring (isDeleted=false) expense: decrease account balance
      await updateAssetBalanceForTransaction(transaction, isDeleted);
      
      // Make API call to update isDeleted status
      const apiId = transaction._id?.toString() || transaction.id.toString();
      const result = await apiService.updateTransaction(apiId, { isDeleted });
      
      // If the operation was successful, log the new account balance
      const logAccountBalanceAfter = async () => {
        try {
          if (result.success) {
            const accountId = typeof transaction.account === 'object' 
              ? (transaction.account.id || transaction.account._id)
              : transaction.account;
              
            if (accountId) {
              const accountResponse = await apiService.getAccountById(accountId.toString());
              if (accountResponse.success && accountResponse.data) {
                const account = accountResponse.data;
                console.log(`💰 ASSET BALANCE AFTER ${isDeleted ? 'DELETION' : 'RESTORATION'}: ${account.name} = ${account.balance}`);
              }
            }
          }
        } catch (error) {
          console.error("Error getting account balance after operation:", error);
        }
      };
      
      // Log the account balance after the operation
      await logAccountBalanceAfter();
      
      if (result.success) {
        console.log(`✅ Transaction ${isDeleted ? 'soft deleted' : 'restored'} successfully`);
        
        // Emit event for other components to listen for
        TransactionEventBus.emit(
          isDeleted ? 'transaction:softDeleted' : 'transaction:restored', 
          updatedTransaction
        );
        
        // Show success toast ONLY for restore operations, not for soft delete (to avoid duplication)
        if ((!hasBulkOperation(transaction) || !transaction._bulkOperation) && !isDeleted) {
          toast.success(`Transaction restored`, {
            description: `"${transaction.title}" has been restored.`,
            position: "bottom-right"
          });
        }
      } else {
        console.error(`🔴 API Error ${isDeleted ? 'deleting' : 'restoring'} transaction:`, result.message);
        
        // Revert the state change on error
        setTransactions(prev => {
          return prev.map(t => {
            if (t.id.toString() === transaction.id?.toString() || 
                (t._id && transaction._id && t._id.toString() === transaction._id.toString())) {
              return { ...t, isDeleted: !isDeleted }; // Revert to previous state
            }
            return t;
          });
        });
        
        // Show error toast
        toast.error(`Failed to ${isDeleted ? 'delete' : 'restore'} transaction`, {
          description: result.message || `There was an error ${isDeleted ? 'deleting' : 'restoring'} "${transaction.title}".`,
          position: "bottom-right"
        });
      }
    } catch (error) {
      console.error(`🔴 Error during ${isDeleted ? 'soft delete' : 'restore'}:`, error);
      toast.error(`Failed to ${isDeleted ? 'delete' : 'restore'} transaction`, {
        description: 'An unexpected error occurred. Please try again.',
        position: "bottom-right"
      });
    }
  };

  // Handle soft delete transaction
  const handleSoftDelete = useCallback((id: string | number) => {
    // Find the transaction by ID, including soft-deleted transactions
    // by directly accessing the full transactions array
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
      console.error("Transaction not found for soft delete:", id);
      return;
    }
    
    console.log('Setting transaction to delete:', {
      id: transaction.id,
      _id: transaction._id,
      idType: typeof transaction.id,
      title: transaction.title
    });
    
    // Store the complete transaction reference for later use
    setTransactionToDelete(transaction);
    
    // Open the delete dialog - don't mark as deleted yet
    setShowDeleteDialog(true);
    
    // The actual deletion happens when the user confirms in the dialog
    // and the dialog calls performSoftDelete
  }, [transactions]);

  // Handle submitting transaction
  const handleSubmitTransaction = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const type = currentTransactionType;
    
    // Parse amount from form data
    let amount = 0;
    try {
      // Remove any currency symbols or formatting and parse as a float
      amount = parseFloat(formData.amount.replace(/[^\d.-]/g, ''));
    } catch (error) {
      console.error("Error parsing amount:", error);
      setFormErrors(prev => ({ ...prev, amount: "Invalid amount format" }));
      return;
    }

    // If amount is not a valid number, show error
    if (isNaN(amount) || amount <= 0) {
      setFormErrors(prev => ({ ...prev, amount: "Amount must be a positive number" }));
      return;
    }
    
    try {
      setShowTransactionModal(false);
      
      // Format date for API
      let formattedDate = formData.date;
      
      try {
        // Try to parse and format the date if needed
        const parsedDate = new Date(formData.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      } catch (error) {
        console.error("Error formatting date:", error);
      }
      
      // Store categories and accounts data in localStorage for TransactionItem to use
      try {
        // Store categories data
        const allCategories = await apiService.getCategories();
        if (allCategories && allCategories.data && Array.isArray(allCategories.data) && allCategories.data.length > 0) {
          localStorage.setItem('user_categories', JSON.stringify(allCategories.data));
        }
        
        // Store accounts/assets data
        localStorage.setItem('user_assets', JSON.stringify(accounts));
      } catch (error) {
        console.error("Error caching entity data:", error);
      }

    if (currentTransactionMode === 'add') {
        // Prepare transaction data for API
        const transactionData = {
          amount,
          type,
        category: formData.category,
          title: formData.title || (type === 'income' ? 'Income' : 'Expense'), // Default title if empty
          description: formData.description || '', // Default empty string if not provided
          date: formattedDate || new Date().toISOString().split('T')[0], // Format date properly
        account: formData.account
      };
      
        // Debug log the transaction data
        console.log('Submitting transaction data:', transactionData);

        // Send to API
        const response = await apiService.createTransaction(transactionData);
        
        // Log any validation errors
        if (!response.success && response.errors) {
          console.error('Transaction validation errors:', response.errors);
        }
        
        if (response.success && response.data) {
          // Emit event to notify other components
          TransactionEventBus.emit('transaction:created', {
            transaction: response.data,
            type,
            amount
          });
          
          // Show success toast
      toast.success("Transaction added", {
            description: `${type === "income" ? "Income" : "Expense"} of $${Math.abs(response.data.amount).toFixed(2)} has been added.`,
        position: "bottom-right",
            id: `add-transaction-${response.data._id}`, // Use unique ID
      });
        }
    } else if (currentTransactionMode === 'edit' && currentTransactionId) {
        // Get the transaction to edit
        const transactionToEdit = transactions.find(t => t.id === currentTransactionId);
        if (!transactionToEdit) {
          console.error("Transaction to edit not found:", currentTransactionId);
          return;
        }

        // Keep track of the original amount and type for event emission
        const originalAmount = Math.abs(transactionToEdit.amount);
        const originalType = transactionToEdit.type;
        const typeChanged = originalType !== type;

        // Prepare transaction data for API
        const transactionData = {
          amount,
          type,
          category: formData.category,
            title: formData.title,
            description: formData.description,
          date: formattedDate,
            account: formData.account
          };

        console.log('Updating transaction data:', {
          id: transactionToEdit._id?.toString() || transactionToEdit.id.toString(),
          data: transactionData
        });

        // Send update request to API
        const response = await apiService.updateTransaction(
          transactionToEdit._id?.toString() || transactionToEdit.id.toString(), 
          transactionData
        );
        
        console.log('Update transaction response:', response);
        
        if (response.success && response.data) {
          // After edit, resolve the account and category objects before updating state
          const updatedTransaction = { ...(response.data as Transaction) };
          
          // Resolve account reference
          if (updatedTransaction.account && 
              typeof updatedTransaction.account === 'string' && 
              /^[0-9a-f]{24}$/i.test(updatedTransaction.account)) {
            const accountResponse = await apiService.getAccountById(updatedTransaction.account);
            if (accountResponse.success && accountResponse.data) {
              updatedTransaction.account = accountResponse.data;
            }
          }
          
          // Resolve category reference
          if (updatedTransaction.category && 
              typeof updatedTransaction.category === 'string' && 
              /^[0-9a-f]{24}$/i.test(updatedTransaction.category)) {
            const categoryResponse = await apiService.getCategoryById(updatedTransaction.category);
            if (categoryResponse.success && categoryResponse.data) {
              updatedTransaction.category = categoryResponse.data;
            }
          }
          
          console.log('Resolved updated transaction:', updatedTransaction);
          
          // Make sure the transaction has both _id and id properties for consistent handling
          if (updatedTransaction._id && !updatedTransaction.id) {
            updatedTransaction.id = Number(transactionToEdit.id);
          } else if (updatedTransaction.id && !updatedTransaction._id) {
            updatedTransaction._id = transactionToEdit._id;
          }
          
          // Ensure the numeric ID is preserved for consistent reference
          if (typeof updatedTransaction.id !== 'number' && transactionToEdit.id) {
            updatedTransaction.id = Number(transactionToEdit.id);
          }
          
          // Update state with the fully resolved transaction
          setTransactions(prev => 
            prev.map(t => (t.id === currentTransactionId || t._id === transactionToEdit._id) ? updatedTransaction : t)
          );
          
          // Emit event to notify other components of the transaction update
          TransactionEventBus.emit('transaction:updated', {
            transaction: updatedTransaction,
            originalType,
            originalAmount,
            newType: type,
            newAmount: amount,
            typeChanged
          });
          
          // Show success toast
          toast.success("Transaction updated", {
            description: `${updatedTransaction.title} has been updated successfully.`,
            position: "bottom-right",
            id: `update-transaction-${updatedTransaction._id || updatedTransaction.id}`,
          });
        } else {
          console.error('Transaction update failed:', response.message || 'Unknown error');
          toast.error("Transaction update failed", {
            description: response.message || "An error occurred while updating the transaction",
            position: "bottom-right"
          });
        }
      }

      // Refresh data to ensure UI is up-to-date
      await refreshAllData();
      
      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error("Transaction error:", error);
      // Show error toast
      toast.error("Transaction error", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        position: "bottom-right"
      });
    }
  }, [currentTransactionId, currentTransactionMode, currentTransactionType, formData, formErrors, handleCloseModal, validateForm, refreshAllData]);

  // Handler for transaction state change events - more generic approach to handle all types of events
  const handleTransactionStateChanged = useCallback((event: Event) => {
    try {
      const customEvent = event as CustomEvent;
      const { transaction, action, wasSoftDeleted } = customEvent.detail;
      
      console.log(`🔄 [handleTransactionStateChanged] Action: ${action}`, {
        transaction: transaction.title,
      id: transaction.id,
        _id: transaction._id || 'none',
        isDeleted: transaction.isDeleted,
        type: transaction.type,
        amount: transaction.amount,
        wasSoftDeleted
      });
      
      if (action === 'permanentlyDeleted') {
        console.log(`🗑️ Permanently removing transaction from UI: ${transaction.title}`);
        
        // Remove from array
        setTransactions(prevTransactions => 
          prevTransactions.filter(t => 
            t.id !== transaction.id && 
            (!t._id || !transaction._id || t._id !== transaction._id)
          )
        );
        
        // Force a refresh
        setTimeout(() => {
          console.log("🔄 Force refreshing transaction state after permanent deletion");
          setTransactions(prev => [...prev]);
        }, 100);
      } else if (action === 'softDeleted') {
        console.log(`🗑️ Soft-deleting transaction in UI: ${transaction.title}`);
        
        // Mark as deleted
        setTransactions(prevTransactions => 
          prevTransactions.map(t => {
            if (t.id === transaction.id || (t._id && transaction._id && t._id === transaction._id)) {
              return { ...t, isDeleted: true };
            }
            return t;
          })
        );
      } else if (action === 'restored') {
        console.log(`🔄 Restoring transaction in UI: ${transaction.title}`);
        
        // Mark as not deleted
        setTransactions(prevTransactions => 
          prevTransactions.map(t => {
            if (t.id === transaction.id || (t._id && transaction._id && t._id === transaction._id)) {
              return { ...t, isDeleted: false };
            }
            return t;
          })
        );
      }
    } catch (error) {
      console.error("🔴 Error handling transaction state change event:", error);
    }
  }, []);

  // Listen for transaction state changed events
  useEffect(() => {
    document.addEventListener('transaction:stateChanged', handleTransactionStateChanged as EventListener);
    
    return () => {
      document.removeEventListener('transaction:stateChanged', handleTransactionStateChanged as EventListener);
    };
  }, [handleTransactionStateChanged]);

  // Export the handleRestoreTransaction function to make it used
  // This prevents the unused warning while keeping the function available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).handleRestoreTransactionFromTransactions = handleRestoreTransaction;

  // Monitor changes to transactions for debugging
  useEffect(() => {
    const deletedCount = getAllTransactions.filter(t => t.isDeleted).length;
    const activeCount = getAllTransactions.filter(t => !t.isDeleted).length;
    
    console.log(`🧩 [TransactionsMonitor] Transactions state updated:`, {
      total: getAllTransactions.length,
      active: activeCount,
      deleted: deletedCount
    });
    
    // Log the first few active and deleted transactions for debugging
    const firstFewActive = getAllTransactions.filter(t => !t.isDeleted).slice(0, 3);
    const firstFewDeleted = getAllTransactions.filter(t => t.isDeleted).slice(0, 3);
    
    if (firstFewActive.length > 0) {
      console.log('📝 First few active transactions:', firstFewActive.map(t => ({
        id: t.id,
        _id: t._id || 'none',
        title: t.title,
        isDeleted: t.isDeleted
      })));
    }
    
    if (firstFewDeleted.length > 0) {
      console.log('🗑️ First few deleted transactions:', firstFewDeleted.map(t => ({
        id: t.id,
        _id: t._id || 'none',
        title: t.title,
        isDeleted: t.isDeleted
      })));
    }
  }, [getAllTransactions]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <DashboardHeader 
        title="Transactions" 
        description="Manage your income and expenses"
        icon={<CreditCard className="h-8 w-8 text-primary" />}
      />
      
      {/* Transaction summary */}
      <TransactionOverview
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netAmount={netAmount}
        incomeTrend={incomeTrend}
        expensesTrend={expensesTrend}
        netTrend={netTrend}
      />
      
      {/* Transaction actions */}
      <TransactionActions
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />
      
      {/* Transaction history - Use getAllTransactions instead of just transactions */}
      <TransactionHistory
        transactions={getAllTransactions}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleSoftDelete}
        onAddTransaction={type => type === 'income' ? handleAddIncome() : handleAddExpense()}
      />
      
      {/* Transaction modals - Use ResponsiveTransactionModal directly */}
      <ResponsiveTransactionModal
        mode={currentTransactionMode}
        type={currentTransactionType}
        isOpen={showTransactionModal}
        transactionAmount={formData.amount}
        transactionTitle={formData.title}
        transactionCategory={formData.category}
        transactionDescription={formData.description}
        transactionDate={formData.date}
        transactionAccount={formData.account}
        formErrors={formErrors}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTransaction}
        onAmountChange={handleAmountChange}
        onTitleChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
        onCategoryChange={handleCategoryChange}
        onDescriptionChange={handleDescriptionChange}
        onDateChange={handleDateChange}
        onAccountChange={(value) => setFormData(prev => ({ ...prev, account: value }))}
        accounts={accounts}
        isLoadingAccounts={isLoadingAccounts}
      />
      
      {/* Delete transaction dialog */}
      {transactionToDelete && (
        <DeleteTransactionDialog
          transaction={transactionToDelete}
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onSoftDelete={(id, isSoftDeleted) => {
            // Convert number id to string if needed
            const stringId = typeof id === 'number' ? id.toString() : id;
            performSoftDelete(stringId, isSoftDeleted);
          }}
        />
      )}
    </div>
  );
} 