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

// For backward compatibility, export an alias to the centralized EventBus
export const TransactionEventBus = EventBus;

export default function Transactions() {
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // State for asset transfers
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  
  // Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentTransactionMode, setCurrentTransactionMode] = useState<TransactionMode>('add');
  const [currentTransactionType, setCurrentTransactionType] = useState<'income' | 'expense'>('income');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | undefined>(undefined);
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
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

  // Fetch accounts and transfers when component mounts
  useEffect(() => {
    fetchAccounts();
    fetchAssetTransfers();
  }, [fetchAccounts, fetchAssetTransfers]);

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions({ resolveReferences: true });
  }, [fetchTransactions]);

  // Function to convert AssetTransfer to Transaction format
  const convertTransfersToTransactions = useCallback((transfers: AssetTransfer[]): Transaction[] => {
    // Buat map untuk menyimpan ID yang sudah dibuat agar tidak ada duplikasi
    const usedIds = new Set<number>();
    
    // Helper function untuk generate ID unik
    const generateUniqueId = (seed?: string): number => {
      // Coba generate ID dari seed jika ada
      let id: number;
      if (seed) {
        // Pastikan substring tidak melebihi panjang string asli
        const substringLength = Math.min(seed.length, 8);
        const substring = seed.substring(0, substringLength);
        id = parseInt(substring, 16);
      } else {
        // Jika tidak ada seed, generate random ID
        id = Math.floor(Math.random() * 100000) + 1;
      }
      
      // Pastikan ID valid
      if (isNaN(id) || id === 0 || usedIds.has(id)) {
        // Jika invalid atau sudah digunakan, generate ID baru
        id = Math.floor(Math.random() * 100000) + 1;
        
        // Pastikan ID baru tidak duplikat (recursive check)
        while (usedIds.has(id)) {
          id = Math.floor(Math.random() * 100000) + 1;
        }
      }
      
      // Tambahkan ke set ID yang sudah digunakan
      usedIds.add(id);
      return id;
    };

    return transfers.map(transfer => {
      // Extract asset names - handling both string IDs and object references
      const fromAssetName = typeof transfer.fromAsset === 'object' && transfer.fromAsset 
        ? transfer.fromAsset.name 
        : 'Unknown';
        
      const toAssetName = typeof transfer.toAsset === 'object' && transfer.toAsset
        ? transfer.toAsset.name
        : 'Unknown';
      
      // Dapatkan ID dari transfer (object ID, string ID, atau property ID)
      const transferIdStr = String(transfer._id || transfer.id || '');
      
      // Generate ID unik untuk transaction
      const numericId = generateUniqueId(transferIdStr);
      
      return {
        id: numericId,
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

  // Use getAllTransactions for calculations
  const activeTransactions = useMemo(() => 
    getAllTransactions.filter(t => !t.isDeleted),
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
  const handleEditTransaction = async (id: number) => {
    const transaction = transactions.find(t => t.id === id);
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
    setCurrentTransactionId(id);
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
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    // Check category
    if (!formData.category) {
      errors.category = "Please select a category";
    }
    
    // Check title
    if (!formData.title) {
      errors.title = "Please enter a title";
    } else if (formData.title.length < 2) {
      errors.title = "Title must be at least 2 characters";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be at most 100 characters";
    }
    
    // Check account
    if (!formData.account) {
      errors.account = "Please select an account";
    }

    // Check date
    if (!formData.date) {
      errors.date = "Please select a date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle submitting transaction
  const handleSubmitTransaction = useCallback(async () => {
    if (!validateForm()) {
      console.error("Form validation failed:", formErrors);
      return;
    }

    try {
    // Get the transaction type and convert amount
    const type = currentTransactionType;
    const amount = parseFloat(formData.amount);

      // Ensure date is properly formatted
      let formattedDate = formData.date;
      try {
        if (formData.date) {
          const dateObj = new Date(formData.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }
      } catch (error) {
        console.error("Error formatting date for submit:", error);
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
      // Add to transactions list
          setTransactions(prev => [response.data as Transaction, ...prev]);
          
          // Emit event to notify other components (e.g. Overview) of the new transaction
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
          
          // Update state with the fully resolved transaction
          setTransactions(prev => 
            prev.map(t => t.id === currentTransactionId ? updatedTransaction : t)
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

      // Fetch all transactions with resolved references
      await fetchTransactions({ resolveReferences: true });
      
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
  }, [currentTransactionId, currentTransactionMode, currentTransactionType, formData, formErrors, handleCloseModal, validateForm, transactions, fetchTransactions]);

  // Handle soft delete transaction
  const handleSoftDelete = useCallback((id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Set the transaction to delete
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  }, [transactions]);
  
  // Actual implementation of soft delete
  const performSoftDelete = useCallback((id: number, isSoftDeleted: boolean) => {
    // Find the transaction before updating state
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Update local state
    setTransactions(prev => prev.map(t => 
      t.id === id
        ? { ...t, isDeleted: isSoftDeleted }
        : t
    ));
    
    // Get transaction details for event
    const amount = Math.abs(transaction.amount);
    const type = transaction.type;
    
    // Only make API call when soft-deleting (not when restoring via undo button)
    if (isSoftDeleted) {
      // Perform the actual API call for soft delete
      apiService.deleteTransaction(transaction._id?.toString() || transaction.id.toString())
        .then(response => {
          if (!response.success) {
            console.error("Failed to soft delete transaction:", response.message);
            // Revert UI state if API call failed
            setTransactions(prev => prev.map(t => 
              t.id === id ? { ...t, isDeleted: false } : t
            ));
            toast.error("Failed to delete transaction", {
              description: response.message,
              position: "bottom-right"
            });
          } else {
            // Emit event to notify other components
            TransactionEventBus.emit('transaction:softDeleted', {
              transaction,
              type,
              amount
            });
    
    // Only show toast when NOT triggered by the DeleteTransactionDialog component
    if (!showDeleteDialog) {
              // Toast completely removed to avoid duplication with Overview.tsx
            }
          }
          });
        } else {
      // This is for restoring via the undo button in toast
      
      // Emit event to notify other components
      TransactionEventBus.emit('transaction:restored', {
        transaction,
        type,
        amount
      });
      
      // Only show toast when NOT triggered by the DeleteTransactionDialog component
      if (!showDeleteDialog) {
        // REMOVE THIS TOAST
        // toast.success("Transaction restored", {
        //   description: `${transaction.title} has been restored.`,
        //   position: "bottom-right",
        //   id: `restore-${id}`, // Use unique ID to prevent duplicates
        // });
      }
    }
  }, [transactions, showDeleteDialog]);
  
  // Handle permanent deletion
  const handlePermanentDelete = useCallback((id: number) => {
      const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Get transaction details for event
    const amount = Math.abs(transaction.amount);
    const type = transaction.type;
    
    // Remove from array optimistically
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // Make the API call to permanently delete
    apiService.permanentDeleteTransaction(transaction._id?.toString() || transaction.id.toString())
      .then(response => {
        if (!response.success) {
          console.error("Failed to permanently delete transaction:", response.message);
          // If API call failed, add the transaction back to the state
          setTransactions(prev => [...prev, transaction]);
          
          toast.error("Failed to delete transaction", {
            description: response.message,
            position: "bottom-right"
          });
        } else {
          // Emit event to notify other components
          TransactionEventBus.emit('transaction:permanentlyDeleted', {
            transaction,
            type,
            amount
          });
          
          // Show success toast only if not already handled by dialog
          if (!showDeleteDialog) {
            // REMOVE THIS TOAST
            // toast("Transaction permanently deleted", {
            //   description: `${transaction.title} has been permanently deleted.`,
            //   position: "bottom-right",
            //   id: `permanent-delete-${id}`, // Use unique ID to prevent duplicates
            // });
          }
        }
      });
  }, [transactions, showDeleteDialog]);

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
      
      {/* Transaction history */}
      <TransactionHistory
        transactions={transactions}
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
          onConfirm={handlePermanentDelete}
          onSoftDelete={performSoftDelete}
        />
      )}
    </div>
  );
} 