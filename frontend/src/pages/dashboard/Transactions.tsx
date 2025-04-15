import { useState, useCallback, useEffect, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
  DeleteTransactionDialog,
} from "@/components/dashboard/transactions";
import { toast } from "sonner";
import apiService from "@/services/api";
import { Asset, AssetTransfer } from "@/types/assets";
import { EventBus } from "@/lib/utils";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

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
function hasBulkOperation(
  transaction: Transaction
): transaction is TransactionWithBulkOp {
  return "_bulkOperation" in transaction;
}

// For backward compatibility, export an alias to the centralized EventBus
export const TransactionEventBus = EventBus;

export default function Transactions() {
  // Page component state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [restoringTransactionId, setRestoringTransactionId] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAutoCategory, setUseAutoCategory] = useState<boolean>(true);
  const [searchParams] = useSearchParams();
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);

  // Initialize the currency formatting hook
  const { formatCurrency } = useCurrencyFormat();

  // State for asset transfers
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);

  // Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentTransactionMode, setCurrentTransactionMode] =
    useState<TransactionMode>("add");
  const [currentTransactionType, setCurrentTransactionType] = useState<
    "income" | "expense"
  >("income");
  const [currentTransactionId, setCurrentTransactionId] = useState<
    number | undefined
  >(undefined);

  // Form state
  const [formData, setFormData] = useState<TransactionFormData & { type?: 'income' | 'expense' }>({
    amount: "",
    title: "",
    category: "",
    description: "",
    date: "",
    account: "",
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<TransactionFormErrors>({
    date: undefined,
  });

  // Account state
  const [accounts, setAccounts] = useState<Asset[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Calculate total assets for more accurate balance display
  const totalAssets = useMemo(
    () =>
      accounts.reduce(
        (total, asset) => total + (asset.isDeleted ? 0 : asset.balance),
        0
      ),
    [accounts]
  );

  // Fetch user accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await apiService.getAssets();
      if (response.success && response.data) {
        // Filter out deleted accounts
        const activeAccounts = response.data.filter(
          (account) => !account.isDeleted
        );
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
  const fetchTransactions = useCallback(
    async (
      options: {
        page?: number;
        limit?: number;
        type?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        showDeleted?: boolean;
        resolveReferences?: boolean;
      } = {}
    ) => {
      try {
        // Add the resolveReferences flag to use the enhanced API feature
        const response = await apiService.getTransactions({
          ...options,
          resolveReferences: options.resolveReferences ?? true, // Default to true if not specified
        });

        if (response.success && response.data) {
          // Process the transactions to ensure they're properly formatted
          const processedTransactions = response.data.map((transaction) => {
            // Ensure the transaction has a numeric id
            const id =
              transaction.id !== undefined
                ? Number(transaction.id)
                : transaction._id
                ? parseInt(transaction._id.substring(0, 8), 16)
                : Math.floor(Math.random() * 100000) + 1;

            // Convert date to string if it's a Date object
            const date =
              transaction.date instanceof Date
                ? transaction.date.toISOString().split("T")[0]
                : transaction.date;

            return { ...transaction, id, date };
          });

          setTransactions(processedTransactions as Transaction[]);
        } else {
          console.error(response.message || "Failed to fetch transactions");
        }
      } catch (error) {
        console.error(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      }
    },
    []
  );

  // Function to reload all transaction-related data
  const refreshAllData = useCallback(async () => {
    console.log("Refreshing all transaction data...");
    try {
      await Promise.all([
        fetchTransactions({ resolveReferences: true }),
        fetchAccounts(),
        fetchAssetTransfers(),
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

  // Handle URL parameters for transaction highlighting
  useEffect(() => {
    // Check for transaction ID in URL
    const transactionId = searchParams.get('id');
    if (transactionId) {
      console.log(`[Transactions] Found transaction ID in URL: ${transactionId}`);
      setHighlightedTransactionId(transactionId);
      
      // Find the transaction by ID and highlight it
      // We'll need to wait for transactions to be loaded
      if (transactions.length > 0) {
        const transaction = transactions.find(t => 
          t._id === transactionId || t.id.toString() === transactionId
        );
        
        if (transaction) {
          console.log(`[Transactions] Found matching transaction: ${transaction.title}`);
          // Scroll to the transaction after a short delay to ensure rendering
          setTimeout(() => {
            const element = document.getElementById(`transaction-${transactionId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight effect - add a temporary class that will fade
              element.classList.add('highlight-transaction');
              // Remove the highlight after animation completes
              setTimeout(() => {
                element.classList.remove('highlight-transaction');
              }, 3000);
            }
          }, 500);
        }
      }
    }
  }, [searchParams, transactions]);

  // Add CSS for highlighting transactions at the top of the component
  useEffect(() => {
    // Add the CSS for transaction highlighting
    const style = document.createElement('style');
    style.textContent = `
      .highlight-transaction {
        animation: highlight-pulse 3s ease-in-out;
        --highlight-color: 59, 130, 246; /* Blue color in RGB format */
      }
      
      @keyframes highlight-pulse {
        0% { 
          box-shadow: 0 0 0 0 rgba(var(--highlight-color), 0.2);
          background-color: rgba(var(--highlight-color), 0.1);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(var(--highlight-color), 0);
          background-color: rgba(var(--highlight-color), 0.05);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(var(--highlight-color), 0);
          background-color: transparent;
        }
      }
      
      /* Dark mode adjustments */
      html.dark .highlight-transaction {
        --highlight-color: 96, 165, 250; /* Lighter blue for dark mode */
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Utility function for calculating new balance based on transaction type and action
  const calculateNewBalance = (
    currentBalance: number,
    transactionAmount: number,
    transactionType: string,
    isReversingEffect: boolean // true when deleting/removing transaction's effect, false when applying/restoring it
  ): number => {
    const amount = Math.abs(transactionAmount);
    let newBalance = currentBalance;
    
    if (isReversingEffect) {
      // REVERSING: When deleting or permanent deleting
      if (transactionType === "income") {
        // Removing income: DECREASE balance
        newBalance -= amount;
      } else if (transactionType === "expense") {
        // Removing expense: INCREASE balance
        newBalance += amount;
      }
    } else {
      // APPLYING: When restoring or creating
      if (transactionType === "income") {
        // Adding income: INCREASE balance
        newBalance += amount;
      } else if (transactionType === "expense") {
        // Adding expense: DECREASE balance
        newBalance -= amount;
        
        // CRITICAL: Prevent negative balance when adding expense
        if (newBalance < 0) {
          console.warn(`⚠️ Prevented negative balance: Expense ${amount} would make balance ${newBalance}, capping at 0`);
          newBalance = 0;
        }
      }
    }
    
    // Ensure balance is never negative (safety check)
    if (newBalance < 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Calculated negative balance (${newBalance}), capping at 0`);
      }
      newBalance = 0;
    }
    
    return newBalance;
  };

  // Function to handle permanent delete events
  const handlePermanentDeleteEvent = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent;
      try {
        const { transaction, wasAlreadySoftDeleted } = customEvent.detail;

        if (process.env.NODE_ENV !== 'production') {
          console.log("🗑️ PERMANENT DELETE event received:", {
            transactionId: transaction.id,
            _id: transaction._id || "none",
            title: transaction.title,
            amount: transaction.amount,
            type: transaction.type,
            wasAlreadySoftDeleted,
          });
        }

        // Update asset balance based on transaction type
        const updateBalance = async () => {
          try {
            // CRITICAL CHANGE: ALWAYS update balance for permanent deletions,
            // even if it was previously soft-deleted (fixing the balance update bug)
            if (transaction.account) {
              const accountId =
                typeof transaction.account === "object"
                  ? transaction.account.id || transaction.account._id
                  : transaction.account;

              if (accountId) {
                // Fetch the current account data to get accurate balance
                const accountResponse = await apiService.getAccountById(
                  accountId.toString()
                );
                if (accountResponse.success && accountResponse.data) {
                  const account = accountResponse.data;
                  const amount = Math.abs(transaction.amount);

                  // ALWAYS update the balance, regardless of whether it was soft-deleted
                  if (process.env.NODE_ENV !== 'production') {
                    console.log(
                      `💰 ALWAYS adjusting balance for permanent deletion of ${transaction.type} transaction:`,
                      {
                        title: transaction.title,
                        amount,
                        currentBalance: account.balance,
                        wasAlreadySoftDeleted,
                      }
                    );
                  }

                  // Calculate new balance using the shared utility function
                  // For permanent delete, we always need to reverse the transaction effect
                  const newBalance = calculateNewBalance(
                    account.balance,
                    transaction.amount,
                    transaction.type,
                    true // isReversingEffect = true for permanent deletion
                  );

                  // For debug/verification purposes
                  if (process.env.NODE_ENV !== 'production') {
                    console.log(
                      `💵 PERMANENT DELETE RECALCULATION for ${transaction.title}:`
                    );
                    if (transaction.type === "income") {
                      console.log(`  Original balance: ${account.balance}`);
                      console.log(`  Income amount: ${amount}`);
                      console.log(
                        `  Permanently deleting income, so: ${
                          account.balance
                        } - ${amount} = ${account.balance - amount}`
                      );
                    } else if (transaction.type === "expense") {
                      console.log(`  Original balance: ${account.balance}`);
                      console.log(`  Expense amount: ${amount}`);
                      console.log(
                        `  Permanently deleting expense, so: ${
                          account.balance
                        } + ${amount} = ${account.balance + amount}`
                      );
                    }

                    console.log(
                      `⚠️ New balance for ${account.name}: ${newBalance} (before: ${account.balance})`
                    );
                  }

                  // Update account balance
                  await apiService.updateAsset(accountId.toString(), {
                    ...account,
                    balance: newBalance,
                  });

                  // Update local accounts state directly instead of fetching again
                  setAccounts(prevAccounts => 
                    prevAccounts.map(prevAccount => {
                      if (prevAccount._id === accountId || prevAccount.id === accountId) {
                        return {
                          ...prevAccount,
                          balance: newBalance
                        };
                      }
                      return prevAccount;
                    })
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              "🔴 Error updating balance during permanent deletion:",
              error
            );
          }
        };

        // Update balance first
        updateBalance();

        // Update the local state to remove the transaction for immediate UI feedback
        setTransactions((prevTransactions) =>
          prevTransactions.filter(
            (t) =>
              t.id !== transaction.id &&
              (!t._id || !transaction._id || t._id !== transaction._id)
          )
        );
      } catch (error) {
        console.error("🔴 Error handling permanent delete event:", error);
      }
    },
    [fetchAccounts]
  );

  // Listen for permanent delete events from the DeleteTransactionDialog
  useEffect(() => {
    document.addEventListener(
      "transaction:permanentlyDeleted",
      handlePermanentDeleteEvent as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "transaction:permanentlyDeleted",
        handlePermanentDeleteEvent as EventListener
      );
    };
  }, [handlePermanentDeleteEvent]);

  // Set up event listeners to update data when transactions change
  useEffect(() => {
    // Only listen for transaction creation and updates, not delete/restore
    const createdListener = TransactionEventBus.on(
      "transaction:created",
      (data) => {
        console.log("Transaction created, refreshing data", data);
        // For new transactions we do need to refresh data
        refreshAllData();
      }
    );
    
    const updatedListener = TransactionEventBus.on(
      "transaction:updated",
      (data) => {
        console.log("Transaction updated, refreshing data", data);
        // For updates we do need to refresh data
        refreshAllData();
      }
    );
    
    // For delete and restore operations, explicitly do nothing
    // The state is already updated locally
    const deletedListener = TransactionEventBus.on(
      "transaction:softDeleted",
      (data) => {
        console.log("Received soft delete event, NO refresh", data);
        // Do nothing - state is already updated
      }
    );
    
    const restoredListener = TransactionEventBus.on(
      "transaction:restored",
      (data) => {
        console.log("Received restore event, NO refresh", data);
        // Do nothing - state is already updated
      }
    );

    // Clean up listeners on unmount
    return () => {
      createdListener();
      updatedListener();
      deletedListener();
      restoredListener();
    };
  }, [refreshAllData]);

  // Function to convert AssetTransfer to Transaction format
  const convertTransfersToTransactions = useCallback(
    (transfers: AssetTransfer[]): Transaction[] => {
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

      return transfers.map((transfer) => {
        // Extract asset names - handling both string IDs and object references
        const fromAssetName =
          typeof transfer.fromAsset === "object" && transfer.fromAsset
            ? transfer.fromAsset.name
            : typeof transfer.fromAsset === "string"
            ? transfer.fromAsset
            : "Unknown";

        const toAssetName =
          typeof transfer.toAsset === "object" && transfer.toAsset
            ? transfer.toAsset.name
            : typeof transfer.toAsset === "string"
            ? transfer.toAsset
            : "Unknown";

        // Get ID from transfer
        const transferIdStr = String(transfer._id || transfer.id || "");

        // Generate unique ID for transaction
        const numericId = generateUniqueId(transferIdStr);

        // Create a proper transaction object from the transfer
        return {
          id: numericId,
          _id: transfer._id || undefined,
          title: `Transfer: ${fromAssetName} → ${toAssetName}`,
          amount: transfer.amount,
          date:
            typeof transfer.date === "string"
              ? transfer.date
              : new Date(transfer.date).toISOString().split("T")[0],
          category: "Transfer",
          description:
            transfer.description ||
            `Transfer from ${fromAssetName} to ${toAssetName}`,
          account: fromAssetName,
          transferType: "transfer",
          fromAsset: fromAssetName,
          toAsset: toAssetName,
          type: "expense", // Default type for display purposes
          status: "completed",
        };
      });
    },
    []
  );

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
    () => getAllTransactions.filter((t) => !t.isDeleted),
    [getAllTransactions]
  );

  // CRITICAL: Ensure we're only counting active transactions
  const totalIncome = useMemo(
    () =>
      activeTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );

  // CRITICAL: Ensure we're only counting active transactions
  const totalExpenses = useMemo(
    () =>
      activeTransactions
        .filter((t) => t.type === "expense" && t.transferType !== "transfer")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [activeTransactions]
  );

  // Calculate trends from transactions
  const calculateTrend = (
    current: number,
    previous: number
  ): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const percentChange = ((current - previous) / Math.abs(previous)) * 100;
    return {
      value: Math.abs(Number(percentChange.toFixed(1))),
      isPositive: percentChange >= 0,
    };
  };

  // Calculate the net amount
  const netAmount = useMemo(() => {
    // Calculate base amount
    let calculatedAmount = totalAssets > 0 ? totalAssets : totalIncome - totalExpenses;
    
    // CRITICAL FIX: Ensure netAmount is never negative
    if (calculatedAmount < 0) {
      console.warn(`⚠️ Prevented negative netAmount: ${calculatedAmount}, capping at 0`);
      calculatedAmount = 0;
    }
    
    return calculatedAmount;
  }, [totalAssets, totalIncome, totalExpenses]);

  // Get current month and previous month transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTransactions = activeTransactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  const previousMonthTransactions = activeTransactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === previousMonth && date.getFullYear() === previousYear
    );
  });

  // Calculate current and previous month totals
  const currentMonthIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const previousMonthIncome = previousMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const previousMonthExpenses = previousMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const currentMonthNet = currentMonthIncome - currentMonthExpenses;
  const previousMonthNet = previousMonthIncome - previousMonthExpenses;

  // Calculate trends
  const incomeTrend = calculateTrend(currentMonthIncome, previousMonthIncome);
  const expensesTrend = calculateTrend(
    currentMonthExpenses,
    previousMonthExpenses
  );
  const netTrend = calculateTrend(currentMonthNet, previousMonthNet);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({
      amount: "",
      title: "",
      category: "",
      description: "",
      date: "",
      account: "",
    });
    setFormErrors({});
  }, []);

  // Handle opening transaction modal for adding income
  const handleAddIncome = useCallback(() => {
    // Refresh accounts list when opening modal
    fetchAccounts();

    setCurrentTransactionMode("add");
    setCurrentTransactionType("income");
    setCurrentTransactionId(undefined);
    resetForm();
    setShowTransactionModal(true);
  }, [fetchAccounts, resetForm]);

  // Handle opening transaction modal for adding expense
  const handleAddExpense = useCallback(() => {
    // Refresh accounts list when opening modal
    fetchAccounts();

    setCurrentTransactionMode("add");
    setCurrentTransactionType("expense");
    setCurrentTransactionId(undefined);
    resetForm();
    setShowTransactionModal(true);
  }, [fetchAccounts, resetForm]);

  // Handle opening transaction modal for editing
  const handleEditTransaction = async (id: number | string) => {
    const transaction = transactions.find(
      (t) =>
        String(t.id) === String(id) || (t._id && String(t._id) === String(id))
    );
    if (!transaction) return;

    console.log("Editing transaction:", transaction);

    // Set mode to edit first
    setCurrentTransactionMode("edit");

    // Ensure IDs are resolved to objects before opening the edit form
    if (
      typeof transaction.account === "string" &&
      /^[0-9a-f]{24}$/i.test(transaction.account)
    ) {
      try {
        const accountResponse = await apiService.getAccountById(
          transaction.account
        );
        if (accountResponse.success && accountResponse.data) {
          // Update the transaction account with the full object
          (transaction as Transaction).account =
            accountResponse.data as AccountObject;
        }
      } catch (error) {
        console.error("Failed to resolve account:", error);
      }
    }

    try {
      const categoryId = String(transaction.category);
      const categoryResponse = await apiService.getCategoryById(
        categoryId
      );
      if (categoryResponse.success && categoryResponse.data) {
        // Update the transaction category with the full object
        (transaction as Transaction).category =
          categoryResponse.data as CategoryObject;
      }
    } catch (error) {
      console.error("Failed to resolve category:", error);
      // When failing to resolve category, at least keep it as a string ID
      (transaction as Transaction).category = String(transaction.category);
    }

    // Now proceed with the edit as before
    setCurrentTransactionId(typeof id === "string" ? parseInt(id) : id);
    setCurrentTransactionType(transaction.type as "income" | "expense");

    // Ensure the date is in YYYY-MM-DD format
    let formattedDate = transaction.date;
    if (transaction.date) {
      try {
        // Try to parse and format the date
        const parsedDate = new Date(transaction.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split("T")[0]; // YYYY-MM-DD format
          console.log("Formatted date for edit:", formattedDate);
        }
      } catch (error) {
        console.error("Error formatting date for edit:", error);
      }
    }

    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      title: transaction.title || "",
      category:
        typeof transaction.category === "object" &&
        transaction.category !== null
          ? (
              (transaction.category as CategoryObject)._id ||
              (transaction.category as CategoryObject).id ||
              ""
            ).toString()
          : transaction.category?.toString() || "",
      description: transaction.description || "",
      date: formattedDate,
      account:
        typeof transaction.account === "object" && transaction.account !== null
          ? (
              (transaction.account as AccountObject)._id ||
              (transaction.account as AccountObject).id ||
              ""
            ).toString()
          : transaction.account?.toString() || "",
    });

    console.log("Form data set for edit:", {
      amount: Math.abs(transaction.amount).toString(),
      title: transaction.title || "",
      category:
        typeof transaction.category === "object" &&
        transaction.category !== null
          ? (
              (transaction.category as CategoryObject)._id ||
              (transaction.category as CategoryObject).id ||
              ""
            ).toString()
          : transaction.category?.toString() || "",
      description: transaction.description || "",
      date: formattedDate,
      account:
        typeof transaction.account === "object" && transaction.account !== null
          ? (
              (transaction.account as AccountObject)._id ||
              (transaction.account as AccountObject).id ||
              ""
            ).toString()
          : transaction.account?.toString() || "",
    });

    setFormErrors({});
    setShowTransactionModal(true);
  };

  // Handle closing transaction modal
  const handleCloseModal = useCallback(() => {
    setShowTransactionModal(false);
  }, []);

  // Handle changes to form fields
  const handleAmountChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, amount: value }));

      // Clear error when user starts typing
      if (formErrors.amount && value) {
        setFormErrors((prev) => ({ ...prev, amount: undefined }));
      }
    },
    [formErrors]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, category: value }));

      // Clear error when user selects a category
      if (formErrors.category) {
        setFormErrors((prev) => ({ ...prev, category: undefined }));
      }
    },
    [formErrors]
  );

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, date: value }));
  }, []);

  // Validate form before submission
  const validateForm = useCallback(() => {
    const errors: TransactionFormErrors = {};

    // Check amount
    if (!formData.amount) {
      errors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = "Amount must be greater than zero";
    } else {
      // Check if expense exceeds account balance
      const isNewTransaction = currentTransactionMode === "add";
      const isExpense = currentTransactionType === 'expense';
      
      if (isExpense && formData.account && isNewTransaction) {
        // Find the selected account
        const selectedAccount = accounts.find(acc => 
          acc._id === formData.account || acc.id === formData.account
        );
        
        if (selectedAccount && parseFloat(formData.amount) > selectedAccount.balance) {
          errors.amount = `Expense exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`;
        }
      } else if (isExpense && formData.account && !isNewTransaction && currentTransactionId) {
        // For editing expenses, check balance against the difference of new amount and old amount
        const originalTransaction = transactions.find(t => 
          t.id === currentTransactionId || 
          (typeof currentTransactionId === 'string' && t._id === currentTransactionId)
        );
        
        if (originalTransaction) {
          const oldAmount = Math.abs(originalTransaction.amount);
          const newAmount = parseFloat(formData.amount);
          
          // Only validate if the new amount is greater than the old amount
          if (newAmount > oldAmount) {
            const amountDifference = newAmount - oldAmount;
            
            // Find the selected account
            const selectedAccount = accounts.find(acc => 
              acc._id === formData.account || acc.id === formData.account
            );
            
            // Check if account changed
            const originalAccountId = typeof originalTransaction.account === 'object' ? 
              (originalTransaction.account as AccountObject)._id || (originalTransaction.account as AccountObject).id : 
              originalTransaction.account;
            
            const accountChanged = originalAccountId?.toString() !== formData.account;
            
            // Only validate balance if account hasn't changed and the difference exceeds balance
            if (!accountChanged && selectedAccount && amountDifference > selectedAccount.balance) {
              errors.amount = `The increase of ${formatCurrency(amountDifference)} exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`;
            } else if (accountChanged && selectedAccount && newAmount > selectedAccount.balance) {
              // If account changed, check if the full amount exceeds the new account's balance
              errors.amount = `Expense exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`;
            }
          }
        }
      }
    }

    // Check category - only required if auto-categorization is disabled
    if (!formData.category && !useAutoCategory) {
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
  }, [formData, accounts, formatCurrency, useAutoCategory, currentTransactionType, currentTransactionMode, currentTransactionId, transactions]);

  // Helper function to update financial data after transaction changes - defined before it's used
  const updateFinancialData = useCallback(
    (type: "income" | "expense", amount: number) => {
      console.log(`Updating financial data: ${type} - $${amount}`);
      
      // No need to refresh all data - this is causing the page refresh issue
      // Update only what's needed for the UI
      
      // We'll update the local state calculations instead
      // For income add to totalIncome, for expense add to totalExpenses
      // This will be reflected in the UI without a full refresh
      
      // We don't need to do anything here since the transaction state is already updated
      // All derived calculations (totalIncome, totalExpenses, etc) will automatically update
    },
    []
  );

  const handleRestoreTransaction = useCallback(
    async (id: string | number) => {
      // Convert id to string to ensure compatibility
      const idStr = String(id);

      try {
        setRestoringTransactionId(idStr);

        // Find the transaction to restore
        const transactionToRestore = transactions.find(
          (t) => String(t.id) === idStr || (t._id && String(t._id) === idStr)
        );

        if (!transactionToRestore) {
          console.error(
            `Transaction with ID ${idStr} not found for restoration`
          );
          return;
        }

        // Add loading state check for UI
        const isRestoring = Boolean(restoringTransactionId);
        console.log(
          `Restoring transaction: ${idStr}, loading state: ${isRestoring}`
        );

        // Call API to restore transaction
        const response = await apiService.restoreTransaction(idStr);

        if (response.success) {
          // Update local transaction state
          setTransactions((prev) =>
            prev.map((t) => {
              if (
                String(t.id) === idStr ||
                (t._id && String(t._id) === idStr)
              ) {
                // Ensure id is kept as a number even if the response returns a string
                const responseData = response.data || {};
                const responseId =
                  responseData && "id" in responseData ? responseData.id : null;

                return {
                  ...t,
                  isDeleted: false,
                  ...responseData,
                  id:
                    typeof t.id === "number"
                      ? t.id
                      : typeof responseId === "number"
                      ? responseId
                      : parseInt(String(t.id || responseId), 10) || t.id,
                };
              }
              return t;
            })
          );

          // Update financial data
          const amount = Math.abs(transactionToRestore.amount);
          const type = transactionToRestore.type as "income" | "expense";

          updateFinancialData(type, amount);

          toast.success("Transaction restored successfully");

          // Emit event for other components to react
          // But don't include data that would cause a full refresh
          EventBus.emit("transaction:restored", {
            transaction: {
              id: transactionToRestore.id,
              _id: transactionToRestore._id,
              isDeleted: false,
              // Don't include unnecessary properties that might trigger extensive updates
            },
            // We don't need to send type and amount here since
            // those are used to trigger financial updates which we've optimized
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
    },
    [transactions, updateFinancialData, restoringTransactionId]
  );

  // Update performSoftDelete to make immediate changes to the transactions list
  const performSoftDelete = async (
    transactionId: string,
    isDeleted: boolean
  ) => {
    console.log(
      `🚨 [performSoftDelete] Transaction ID: ${transactionId}, Setting isDeleted: ${isDeleted}`
    );

    try {
      // Find transaction in state
      const transaction = transactions.find(
        (t) =>
          t.id.toString() === transactionId.toString() ||
          (t._id && t._id.toString() === transactionId.toString())
      );

      if (!transaction) {
        console.error(`🔴 Transaction not found with ID: ${transactionId}`);
        toast.error("Transaction not found", {
          description: "Could not find the transaction to delete.",
          position: "bottom-right",
        });
        return;
      }

      console.log(
        `📝 ${isDeleted ? "SOFT DELETING" : "RESTORING"} transaction:`,
        {
          id: transaction.id,
          _id: transaction._id || "none",
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          currentIsDeleted: transaction.isDeleted,
        }
      );

      // Skip if transaction is already in the desired state
      if (transaction.isDeleted === isDeleted) {
        console.log(
          `⚠️ Transaction is already ${
            isDeleted ? "deleted" : "active"
          }, skipping operation`
        );
        return;
      }

      // Create a copy of the transaction with updated isDeleted state
      const updatedTransaction = { ...transaction, isDeleted };

      // IMMEDIATE UI UPDATE: Update the transactions array directly to refresh calculations
      // This will trigger immediate recalculation of totals
      setTransactions(prevTransactions => 
        prevTransactions.map(t => {
          if (
            t.id.toString() === transactionId.toString() ||
            (t._id && t._id.toString() === transactionId.toString())
          ) {
            // Return transaction with updated isDeleted flag
            return updatedTransaction;
          }
          return t;
        })
      );

      // FURTHER VISUAL FEEDBACK - Set preview amount directly
      const amount = Math.abs(transaction.amount);
      
      // Calculate current total for better logging
      const currentTotal = totalAssets > 0 ? totalAssets : totalIncome - totalExpenses;
      
      console.log(`💰 Current balance: ${currentTotal}, Transaction amount: ${amount}, Type: ${transaction.type}`);
      
      // CRITICAL BALANCE UPDATE: Execute asset balance update with proper calculation
      try {
        // Get the account ID
        const accountId = typeof transaction.account === "object"
              ? transaction.account.id || transaction.account._id
              : transaction.account;

          if (accountId) {
          // Get current account data
          const accountResponse = await apiService.getAccountById(accountId.toString());
          
            if (accountResponse.success && accountResponse.data) {
              const account = accountResponse.data;
              const amount = Math.abs(transaction.amount);
            
            // Calculate new balance based on operation type
            let newBalance = account.balance;

              if (isDeleted) {
              // SOFT DELETING
                if (transaction.type === "income") {
                // For income deletion: reduce the balance
                newBalance = Math.max(0, account.balance - amount);
                console.log(`💰 SOFT DELETE INCOME: ${account.balance} - ${amount} = ${newBalance}`);
                } else if (transaction.type === "expense") {
                // For expense deletion: increase the balance
                newBalance = account.balance + amount;
                console.log(`💰 SOFT DELETE EXPENSE: ${account.balance} + ${amount} = ${newBalance}`);
                }
              } else {
              // RESTORING
                if (transaction.type === "income") {
                // For income restoration: increase the balance
                newBalance = account.balance + amount;
                console.log(`💰 RESTORE INCOME: ${account.balance} + ${amount} = ${newBalance}`);
                } else if (transaction.type === "expense") {
                // For expense restoration: decrease the balance
                newBalance = Math.max(0, account.balance - amount);
                console.log(`💰 RESTORE EXPENSE: ${account.balance} - ${amount} = ${newBalance}`);
              }
            }
            
            // CRITICAL: Immediately update the accounts state to reflect the change in the UI
            setAccounts(prevAccounts => 
              prevAccounts.map(a => {
                if (a._id === accountId || a.id === accountId) {
                  console.log(`💰 IMMEDIATELY updating account balance for ${a.name}: ${a.balance} -> ${newBalance}`);
                  return {
                    ...a,
                    balance: newBalance
                  };
                }
                return a;
              })
            );
            
            // Update the account balance through the API
            const updateResult = await apiService.updateAsset(accountId.toString(), {
              ...account,
              balance: newBalance
            });
            
            if (updateResult.success) {
              console.log(`✅ Account balance updated successfully to ${newBalance}`);
            } else {
              console.error("Failed to update account balance:", updateResult.message);
            }
          }
        }
      } catch (error) {
        console.error("Error updating account balance:", error);
      }

      // Rest of the function - API calls and error handling...

      // Make API call to update isDeleted status
      const apiId = transaction._id?.toString() || transaction.id.toString();
      const result = await apiService.updateTransaction(apiId, { isDeleted });

      if (result.success) {
        console.log(
          `✅ Transaction ${
            isDeleted ? "soft deleted" : "restored"
          } successfully`
        );

        // Emit a clearer event for other components to listen for with more data
        // Include enough data for the UI to properly update
        const eventName = isDeleted ? "transaction:softDeleted" : "transaction:restored";
        
        // Create a custom event that includes all necessary transaction data
        const stateChangedEvent = new CustomEvent('transaction:stateChanged', {
          detail: {
            transaction: updatedTransaction,
            action: isDeleted ? 'softDeleted' : 'restored',
            wasSoftDeleted: transaction.isDeleted
          },
          bubbles: true
        });
        
        // Dispatch the event to ensure all components are notified
        document.dispatchEvent(stateChangedEvent);
        
        // Also emit through the EventBus for components explicitly listening there
        TransactionEventBus.emit(eventName, {
          id: updatedTransaction.id,
          _id: updatedTransaction._id,
          isDeleted: updatedTransaction.isDeleted,
          transaction: updatedTransaction // Include the full transaction data
        });

        // Show success toast ONLY for restore operations, not for soft delete (to avoid duplication)
        if (
          (!hasBulkOperation(transaction) || !transaction._bulkOperation) &&
          !isDeleted
        ) {
          toast.success(`Transaction restored`, {
            description: `"${transaction.title}" has been restored.`,
            position: "bottom-right",
          });
        }
      } else {
        console.error(
          `🔴 API Error ${isDeleted ? "deleting" : "restoring"} transaction:`,
          result.message
        );

        // Revert the state change on error
        setTransactions((prev) => {
          return prev.map((t) => {
            if (
              t.id.toString() === transaction.id?.toString() ||
              (t._id &&
                transaction._id &&
                t._id.toString() === transaction._id.toString())
            ) {
              return { ...t, isDeleted: !isDeleted }; // Revert to previous state
            }
            return t;
          });
        });

        // Show error toast
        toast.error(
          `Failed to ${isDeleted ? "delete" : "restore"} transaction`,
          {
            description:
              result.message ||
              `There was an error ${isDeleted ? "deleting" : "restoring"} "${
                transaction.title
              }".`,
            position: "bottom-right",
          }
        );
      }
    } catch (error) {
      console.error(
        `🔴 Error during ${isDeleted ? "soft delete" : "restore"}:`,
        error
      );
      toast.error(`Failed to ${isDeleted ? "delete" : "restore"} transaction`, {
        description: "An unexpected error occurred. Please try again.",
        position: "bottom-right",
      });
    }
  };

  // Handle soft delete transaction
  const handleSoftDelete = useCallback(
    (id: string | number) => {
      // Find the transaction by ID, including soft-deleted transactions
      // by directly accessing the full transactions array
      const transaction = transactions.find((t) => 
        typeof t.id === typeof id 
          ? t.id === id 
          : String(t.id) === String(id) || 
            (t._id && String(t._id) === String(id))
      );

      if (!transaction) {
        console.error("Transaction not found for soft delete:", id);
        return;
      }

      console.log("Setting transaction to delete:", {
        id: transaction.id,
        _id: transaction._id,
        idType: typeof transaction.id,
        title: transaction.title,
      });

      // Store the complete transaction reference for later use
      setTransactionToDelete(transaction);

      // Open the delete dialog - don't mark as deleted yet
      setShowDeleteDialog(true);

      // The actual deletion happens when the user confirms in the dialog
      // and the dialog calls performSoftDelete
    },
    [transactions]
  );

  // Handle submitting transaction
  const handleSubmitTransaction = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    // Set loading state to prevent multiple submissions
    setIsSubmitting(true);

    const type = currentTransactionType;

    // Parse amount from form data
    let amount = 0;
    try {
      // Remove any currency symbols or formatting and parse as a float
      amount = parseFloat(formData.amount.replace(/[^\d.-]/g, ""));
    } catch (error) {
      console.error("Error parsing amount:", error);
      setFormErrors((prev) => ({ ...prev, amount: "Invalid amount format" }));
      setIsSubmitting(false);
      return;
    }

    // If amount is not a valid number, show error
    if (isNaN(amount) || amount <= 0) {
      setFormErrors((prev) => ({
        ...prev,
        amount: "Amount must be a positive number",
      }));
      setIsSubmitting(false);
      return;
    }

    // ADDITIONAL CHECK: For expense transactions, verify account has sufficient balance
    if (type === 'expense' && formData.account) {
      // Check if we're editing an existing transaction
      const isEditing = currentTransactionMode === 'edit' && currentTransactionId;
      
      if (isEditing) {
        // Find the original transaction
        const originalTransaction = transactions.find(t => 
          t.id === currentTransactionId || 
          (typeof currentTransactionId === 'string' && t._id === currentTransactionId)
        );
        
        if (originalTransaction) {
          const oldAmount = Math.abs(originalTransaction.amount);
          const newAmount = amount; // We already parsed this above
          
          // Only validate if the amount is increasing
          if (newAmount > oldAmount) {
            const amountDifference = newAmount - oldAmount;
            
            // Find the selected account
            const selectedAccount = accounts.find(acc => 
              acc._id === formData.account || acc.id === formData.account
            );
            
            // Check if account changed
            const originalAccountId = typeof originalTransaction.account === 'object' ? 
              (originalTransaction.account as AccountObject)._id || (originalTransaction.account as AccountObject).id : 
              originalTransaction.account;
            
            const accountChanged = originalAccountId?.toString() !== formData.account;
            
            // Only validate balance if account hasn't changed and the difference exceeds balance
            if (!accountChanged && selectedAccount && amountDifference > selectedAccount.balance) {
              setFormErrors(prev => ({
                ...prev,
                amount: `The increase of ${formatCurrency(amountDifference)} exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`
              }));
              setIsSubmitting(false);
              return;
            } else if (accountChanged && selectedAccount && newAmount > selectedAccount.balance) {
              // If account changed, check if the full amount exceeds the new account's balance
              setFormErrors(prev => ({
                ...prev,
                amount: `Expense exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`
              }));
              setIsSubmitting(false);
              return;
            }
          }
        }
      } else {
        // Logic for new expense transactions
        const selectedAccount = accounts.find(acc => 
          acc._id === formData.account || acc.id === formData.account
        );
        
        if (selectedAccount && amount > selectedAccount.balance) {
          setFormErrors(prev => ({
            ...prev,
            amount: `Expense exceeds your ${selectedAccount.name} balance of ${formatCurrency(selectedAccount.balance)}`
          }));
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      // Format date for API
      let formattedDate = formData.date;

      try {
        // Try to parse and format the date if needed
        const parsedDate = new Date(formData.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split("T")[0]; // YYYY-MM-DD format
        }
      } catch (error) {
        console.error("Error formatting date:", error);
      }

      // Store categories and accounts data in localStorage for TransactionItem to use
      try {
        // Store categories data
        const allCategories = await apiService.getCategories();
        if (
          allCategories &&
          allCategories.data &&
          Array.isArray(allCategories.data) &&
          allCategories.data.length > 0
        ) {
          localStorage.setItem(
            "user_categories",
            JSON.stringify(allCategories.data)
          );
        }

        // Store accounts/assets data
        localStorage.setItem("user_assets", JSON.stringify(accounts));
      } catch (error) {
        console.error("Error caching entity data:", error);
      }

      if (currentTransactionMode === "add") {
        // Prepare transaction data for API
        const transactionData: {
          amount: number;
          type: "income" | "expense";
          title: string;
          description: string;
          date: string;
          account: string;
          useAutoCategory: boolean;
          category?: string;
        } = {
          amount,
          type,
          title: formData.title || (type === "income" ? "Income" : "Expense"), // Default title if empty
          description: formData.description || "", // Default empty string if not provided
          date: formattedDate || new Date().toISOString().split("T")[0], // Format date properly
          account: formData.account,
          useAutoCategory: useAutoCategory
        };

        // Only include category if auto-categorization is disabled
        if (!useAutoCategory) {
          transactionData.category = formData.category;
        }

        // Debug log the transaction data
        console.log("Submitting transaction data:", transactionData);

        // Send to API
        const response = await apiService.createTransaction(transactionData);

        // Log any validation errors
        if (!response.success && response.errors) {
          console.error("Transaction validation errors:", response.errors);
          toast.error("Failed to add transaction", {
            description: "Please check your information and try again.",
          });
        }

        if (response.success && response.data) {
          // Emit event to notify other components
          TransactionEventBus.emit("transaction:created", {
            transaction: response.data,
            type,
            amount,
          });

          // Show success toast
          toast.success("Transaction added", {
            description: `${
              type === "income" ? "Income" : "Expense"
            } of $${Math.abs(response.data.amount).toFixed(2)} has been added.`,
            position: "bottom-right",
            id: `add-transaction-${response.data._id}`, // Use unique ID
          });

          // Close modal only after successful submission
          setShowTransactionModal(false);
        }
      } else if (currentTransactionMode === "edit" && currentTransactionId) {
        // Get the transaction to edit
        const transactionToEdit = transactions.find(
          (t) => t.id === currentTransactionId
        );
        if (!transactionToEdit) {
          console.error("Transaction to edit not found:", currentTransactionId);
          return;
        }

        // Keep track of the original amount and type for event emission
        const originalAmount = Math.abs(transactionToEdit.amount);
        const originalType = transactionToEdit.type;
        const typeChanged = originalType !== type;

        // Prepare transaction data for API
        const transactionData: {
          amount: number;
          type: "income" | "expense";
          title: string;
          description: string;
          date: string;
          account: string;
          useAutoCategory: boolean;
          category?: string;
        } = {
          amount,
          type,
          title: formData.title,
          description: formData.description,
          date: formattedDate,
          account: formData.account,
          useAutoCategory: useAutoCategory
        };

        // Only include category if auto-categorization is disabled
        if (!useAutoCategory) {
          transactionData.category = formData.category;
        }

        console.log("Updating transaction data:", {
          id:
            transactionToEdit._id?.toString() ||
            transactionToEdit.id.toString(),
          data: transactionData,
        });

        // Send update request to API
        const response = await apiService.updateTransaction(
          transactionToEdit._id?.toString() || transactionToEdit.id.toString(),
          transactionData
        );

        console.log("Update transaction response:", response);

        if (response.success && response.data) {
          // After edit, resolve the account and category objects before updating state
          const updatedTransaction = { ...(response.data as Transaction) };

          // Resolve account reference
          if (
            updatedTransaction.account &&
            typeof updatedTransaction.account === "string" &&
            /^[0-9a-f]{24}$/i.test(updatedTransaction.account)
          ) {
            const accountResponse = await apiService.getAccountById(
              updatedTransaction.account
            );
            if (accountResponse.success && accountResponse.data) {
              updatedTransaction.account = accountResponse.data;
            }
          }

          // Resolve category reference
          if (
            updatedTransaction.category &&
            typeof updatedTransaction.category === "string" &&
            /^[0-9a-f]{24}$/i.test(updatedTransaction.category)
          ) {
            const categoryResponse = await apiService.getCategoryById(
              updatedTransaction.category
            );
            if (categoryResponse.success && categoryResponse.data) {
              updatedTransaction.category = categoryResponse.data;
            }
          }

          console.log("Resolved updated transaction:", updatedTransaction);

          // Make sure the transaction has both _id and id properties for consistent handling
          if (updatedTransaction._id && !updatedTransaction.id) {
            updatedTransaction.id = Number(transactionToEdit.id);
          } else if (updatedTransaction.id && !updatedTransaction._id) {
            updatedTransaction._id = transactionToEdit._id;
          }

          // Ensure the numeric ID is preserved for consistent reference
          if (
            typeof updatedTransaction.id !== "number" &&
            transactionToEdit.id
          ) {
            updatedTransaction.id = Number(transactionToEdit.id);
          }

          // Update state with the fully resolved transaction
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === currentTransactionId || t._id === transactionToEdit._id
                ? updatedTransaction
                : t
            )
          );

          // Emit event to notify other components of the transaction update
          TransactionEventBus.emit("transaction:updated", {
            transaction: updatedTransaction,
            originalType,
            originalAmount,
            newType: type,
            newAmount: amount,
            typeChanged,
          });

          // Show success toast
          toast.success("Transaction updated", {
            description: `${updatedTransaction.title} has been updated successfully.`,
            position: "bottom-right",
            id: `update-transaction-${
              updatedTransaction._id || updatedTransaction.id
            }`,
          });
        } else {
          console.error(
            "Transaction update failed:",
            response.message || "Unknown error"
          );
          toast.error("Transaction update failed", {
            description:
              response.message ||
              "An error occurred while updating the transaction",
            position: "bottom-right",
          });
        }
      }

      // Refresh data to ensure UI is up-to-date
      await refreshAllData();

      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting transaction:", error);
      toast.error("Failed to process transaction", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      // Reset loading state
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    currentTransactionType,
    formData,
    accounts,
    currentTransactionMode,
    currentTransactionId,
    transactions,
    useAutoCategory,
  ]);

  // Handler for transaction state change events - more generic approach to handle all types of events
  const handleTransactionStateChanged = useCallback((event: Event) => {
    try {
      const customEvent = event as CustomEvent;
      const { transaction, action, wasSoftDeleted } = customEvent.detail;

      console.log(`🔄 [handleTransactionStateChanged] Action: ${action}`, {
        transaction: transaction.title,
        id: transaction.id,
        _id: transaction._id || "none",
        isDeleted: transaction.isDeleted,
        type: transaction.type,
        amount: transaction.amount,
        wasSoftDeleted,
      });

      if (action === "permanentlyDeleted") {
        console.log(
          `🗑️ Permanently removing transaction from UI: ${transaction.title}`
        );

        // Remove from array
        setTransactions((prevTransactions) =>
          prevTransactions.filter(
            (t) =>
              t.id !== transaction.id &&
              (!t._id || !transaction._id || t._id !== transaction._id)
          )
        );

        // Force a refresh
        setTimeout(() => {
          console.log(
            "🔄 Force refreshing transaction state after permanent deletion"
          );
          setTransactions((prev) => [...prev]);
        }, 100);
      } else if (action === "softDeleted") {
        console.log(`🗑️ Soft-deleting transaction in UI: ${transaction.title}`);

        // Mark as deleted
        setTransactions((prevTransactions) =>
          prevTransactions.map((t) => {
            if (
              t.id === transaction.id ||
              (t._id && transaction._id && t._id === transaction._id)
            ) {
              return { ...t, isDeleted: true };
            }
            return t;
          })
        );
        
        // Force a re-evaluation of activeTransactions and derived values
        // This ensures netAmount is recalculated correctly based on the updated isDeleted flags
        setTimeout(() => {
          console.log("🔄 Forcing re-evaluation of financial calculations after soft delete");
          setTransactions(prev => [...prev]);
        }, 100);
      } else if (action === "restored") {
        console.log(`🔄 Restoring transaction in UI: ${transaction.title}`);

        // Mark as not deleted
        setTransactions((prevTransactions) =>
          prevTransactions.map((t) => {
            if (
              t.id === transaction.id ||
              (t._id && transaction._id && t._id === transaction._id)
            ) {
              return { ...t, isDeleted: false };
            }
            return t;
          })
        );
        
        // Force a re-evaluation of activeTransactions and derived values
        // This ensures netAmount is recalculated correctly based on the updated isDeleted flags
        setTimeout(() => {
          console.log("🔄 Forcing re-evaluation of financial calculations after restore");
          setTransactions(prev => [...prev]);
        }, 100);
      }
    } catch (error) {
      console.error("🔴 Error handling transaction state change event:", error);
    }
    // This callback only uses setTransactions which is stable and doesn't need dependencies.
    // We intentionally don't include accounts or transactions as dependencies to avoid
    // recreating this handler when those change, which would cause unnecessary re-renders.
  }, []);

  // Listen for transaction state changed events
  useEffect(() => {
    document.addEventListener(
      "transaction:stateChanged",
      handleTransactionStateChanged as EventListener
    );

    return () => {
      document.removeEventListener(
        "transaction:stateChanged",
        handleTransactionStateChanged as EventListener
      );
    };
  }, [handleTransactionStateChanged]);

  // Export the handleRestoreTransaction function to make it used
  // This prevents the unused warning while keeping the function available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).handleRestoreTransactionFromTransactions =
    handleRestoreTransaction;

  // Monitor changes to transactions for debugging
  useEffect(() => {
    const deletedCount = getAllTransactions.filter((t) => t.isDeleted).length;
    const activeCount = getAllTransactions.filter((t) => !t.isDeleted).length;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🧩 [TransactionsMonitor] Transactions state updated:`, {
        total: getAllTransactions.length,
        active: activeCount,
        deleted: deletedCount,
      });
    }

    // Log the first few active and deleted transactions for debugging
    const firstFewActive = getAllTransactions
      .filter((t) => !t.isDeleted)
      .slice(0, 3);
    const firstFewDeleted = getAllTransactions
      .filter((t) => t.isDeleted)
      .slice(0, 3);

    if (firstFewActive.length > 0 && process.env.NODE_ENV !== 'production') {
      console.log(
        "📝 First few active transactions:",
        firstFewActive.map((t) => ({
          id: t.id,
          _id: t._id || "none",
          title: t.title,
          isDeleted: t.isDeleted,
        }))
      );
    }

    if (firstFewDeleted.length > 0 && process.env.NODE_ENV !== 'production') {
      console.log(
        "🗑️ First few deleted transactions:",
        firstFewDeleted.map((t) => ({
          id: t.id,
          _id: t._id || "none",
          title: t.title,
          isDeleted: t.isDeleted,
        }))
      );
    }
  }, [getAllTransactions]);

  // Add an auto-categorization toggle handler function
  const handleAutoCategorizationChange = useCallback((value: boolean) => {
    setUseAutoCategory(value);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <DashboardHeader
        title="Transactions"
        description="Manage your income and expenses"
        icon={<CreditCard className="h-8 w-8 text-primary" />}
      />

      {/* Transaction summary - Use displayNetAmount instead of netAmount */}
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
        onAddTransaction={(type) =>
          type === "income" ? handleAddIncome() : handleAddExpense()
        }
        highlightedTransactionId={highlightedTransactionId}
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
        onTitleChange={(value) =>
          setFormData((prev) => ({ ...prev, title: value }))
        }
        onCategoryChange={handleCategoryChange}
        onDescriptionChange={handleDescriptionChange}
        onDateChange={handleDateChange}
        onAccountChange={(value) =>
          setFormData((prev) => ({ ...prev, account: value }))
        }
        useAutoCategory={useAutoCategory}
        onAutoCategorizationChange={handleAutoCategorizationChange}
        accounts={accounts}
        isLoadingAccounts={isLoadingAccounts}
        isSubmitting={isSubmitting}
      />

      {/* Delete transaction dialog */}
      {transactionToDelete && (
        <DeleteTransactionDialog
          transaction={transactionToDelete}
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onSoftDelete={(id, isSoftDeleted) => {
            // Convert number id to string if needed
            const stringId = typeof id === "number" ? id.toString() : id;
            performSoftDelete(stringId, isSoftDeleted);
          }}
        />
      )}
    </div>
  );
}
