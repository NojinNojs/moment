import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PlusCircle,
  Receipt
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Import utils
import { EventBus } from "@/lib/utils";

// Import modular components from the overview directory
import { StatCard } from "@/components/dashboard/overview";

// Import other dashboard components
import {
  DashboardHeader,
  TransactionList,
} from "@/components/dashboard";

// Import transaction modals
import { 
  ResponsiveTransactionModal, 
  DeleteTransactionDialog,
  Transaction
} from "@/components/dashboard/transactions";

// Import the auth context at the top
import { useAuth } from "@/contexts/auth-utils";

// Import UnderConstruction component
import { UnderConstruction } from "@/components/dashboard/common/UnderConstruction";

// Import toast
import { toast } from "sonner";

// Import the TransactionActions component
import { TransactionActions } from "@/components/dashboard/transactions/core/TransactionActions";

// Import API service
import apiService from "@/services/api";

// Import the Asset type
import { Asset, AssetTransfer } from "@/types/assets";

// Import the useCurrencyFormat hook
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

// Simple fade in animation preset
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
};

// Simple slide up animation preset
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

// Define form errors interface
interface TransactionFormErrors {
  amount?: string;
  category?: string;
  title?: string;
  account?: string;
  date?: string;
  description?: string;
}

// Calculate percentages (handle division by zero)
const calculatePercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Empty state component for transaction list
const EmptyTransactionState = ({ onAddTransaction }: { onAddTransaction: () => void }) => (
  <div className="text-center py-12 space-y-4">
    <div className="bg-muted/30 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
      <Receipt className="h-8 w-8 text-muted-foreground opacity-70" />
    </div>
    <h3 className="text-base font-medium">No transactions yet</h3>
    <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
      Start tracking your finances by adding your first income or expense transaction.
    </p>
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button 
        variant="outline" 
        onClick={onAddTransaction}
        className="flex items-center gap-1"
      >
        <PlusCircle className="h-4 w-4" />
        Add Transaction
      </Button>
    </div>
  </div>
);

// Add this function at the top level after imports but before component definition
// EMERGENCY FUNCTION: Direct API call to update asset balance
const emergencyDirectAssetBalanceUpdate = async (account: Record<string, unknown>, amount: number) => {
  try {
    console.log("🚑 EMERGENCY: Making direct API call to update asset balance");
    
    if (!account || !account._id) {
      console.error("🚑 EMERGENCY FAILED: No valid account provided", account);
      return false;
    }
    
    // Bypass the service layer completely and call API directly with fetch
    const apiUrl = `/api/assets/${account._id}`;
    const currentBalance = account.balance as number || 0;
    const newBalance = currentBalance + amount;
    
    console.log(`🚑 EMERGENCY: Directly updating asset balance: ${currentBalance} + ${amount} = ${newBalance}`);
    
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        balance: newBalance
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("🚑 EMERGENCY FAILED: API error", errorData);
      return false;
    }
    
    const data = await response.json();
    console.log("🚑 EMERGENCY SUCCESS: Asset balance updated", data);
    return true;
  } catch (error) {
    console.error("🚑 EMERGENCY FAILED: Exception", error);
    return false;
  }
};

export default function Overview() {
  // Remove unused navigate
  const { formatCurrency } = useCurrencyFormat();
  // Add auth context
  const { user } = useAuth();

  // Add refreshTrigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for transaction modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionAccount, setTransactionAccount] = useState("");
  const [formErrors, setFormErrors] = useState<TransactionFormErrors>({});
  
  // State for edit transaction
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTransactionType] = useState<'income' | 'expense'>('income');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | undefined>(undefined);
  
  // State for delete transaction dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [, setTransactionsError] = useState<string | null>(null);

  // Use refs for scroll state to prevent update loops
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({
    isAtStart: true,
    isAtEnd: false,
    activeIndex: 0,
  });
  const isInitialRender = useRef(true);
  const frameIdRef = useRef<number | null>(null);

  // Use this state only for UI updates, not for logic
  const [scrollIndicators, setScrollIndicators] = useState({
    isAtStart: true,
    isAtEnd: false,
    activeIndex: 0,
  });

  // Functions for fetching accounts and calculating totals
  const [accounts, setAccounts] = useState<Asset[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [, setAccountsError] = useState<string | null>(null);

  // State for asset transfers
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // Calculate asset totals
  const totalAssets = useMemo(() => 
    accounts.reduce((total, asset) => total + (asset.isDeleted ? 0 : asset.balance), 0),
    [accounts]
  );

  // Memoize fetchAccounts to prevent it from causing re-renders
  const fetchAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    setAccountsError(null);
    
    try {
      console.log("Fetching accounts...");
      const response = await apiService.getAssets();
      
      if (response.success && response.data) {
        // Filter out deleted accounts
        const activeAccounts = response.data.filter(account => !account.isDeleted);
        setAccounts(activeAccounts);
      } else {
        console.error("Failed to fetch accounts:", response.message);
        setAccountsError("Failed to fetch accounts");
        toast.error("Failed to load accounts", {
          description: response.message || "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccountsError("An error occurred while fetching accounts");
      toast.error("Failed to load accounts", {
        description: "Please try again later",
      });
    } finally {
      setIsAccountsLoading(false);
    }
  }, []);

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch asset transfers when component mounts
  const fetchAssetTransfers = useCallback(async () => {
    setIsLoadingTransfers(true);
    try {
      const response = await apiService.getAssetTransfers();
      if (response.success && response.data) {
        setAssetTransfers(response.data);
      }
    } catch (error) {
      console.error("Error fetching asset transfers:", error);
    } finally {
      setIsLoadingTransfers(false);
    }
  }, []);

  // Fetch asset transfers when component mounts
  useEffect(() => {
    fetchAssetTransfers();
  }, [fetchAssetTransfers]);

  // Calculate date range dynamically with useCallback
  const getDateRange = useCallback(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Return Date objects for calculations
    return {
      startDate: thirtyDaysAgo,
      endDate: today,
      // Keep these for display purposes
      start: thirtyDaysAgo.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      }),
      end: today.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      })
    };
  }, []);

  // State for financial data
  const [financialData, setFinancialData] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
    incomePercentage: 0,
    expensesPercentage: 0,
    savingsPercentage: 0,
    balancePercentage: 0
  });

  // Use ref to store previous financial data to avoid infinite loops
  const prevFinancialDataRef = useRef(financialData);

  // Calculate and update financial data
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      // Keep defaults if there's no transaction data
      return;
    }
    
    // Filter transactions by selected date range and active status
    const { startDate, endDate } = getDateRange();
    
    // Get current period's active transactions
    const currentPeriodTransactions = transactions.filter(t => {
      // Must check date exists and isn't null
      if (!t.date) return false;
      
      // Only include active transactions (not deleted)
      if (t.isDeleted) return false;
      
      // Check date range
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= startDate &&
        transactionDate <= endDate
      );
    });
    
    // Get previous period's active transactions (for trend calculation)
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
    
    const previousPeriodTransactions = transactions.filter(t => {
      // Must check date exists and isn't null
      if (!t.date) return false;
      
      // Only include active transactions (not deleted)
      if (t.isDeleted) return false;
      
      // Check date range
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= previousStartDate &&
        transactionDate <= previousEndDate
      );
    });
    
    // Calculate current period values
    const currentIncome = currentPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const currentExpenses = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const currentSavings = Math.max(0, currentIncome - currentExpenses);
    
    // Current balance (prefer total assets if available, otherwise use income - expenses)
    const currentBalance = totalAssets || (currentIncome - currentExpenses);
    
    // Calculate previous period values
    const previousIncome = previousPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const previousExpenses = previousPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const previousSavings = Math.max(0, previousIncome - previousExpenses);
    
    // Previous balance (for trend calculation)
    const previousBalance = previousIncome - previousExpenses;
    
    // Calculate percentages (handle division by zero)
    const incomePercentage = calculatePercentage(currentIncome, previousIncome);
    const expensesPercentage = calculatePercentage(currentExpenses, previousExpenses);
    const savingsPercentage = calculatePercentage(currentSavings, previousSavings);
    const balancePercentage = calculatePercentage(currentBalance, previousBalance);
    
    // Create the next financial data state
    const nextFinancialData = {
      balance: currentBalance,
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      incomePercentage: parseFloat(incomePercentage.toFixed(1)),
      expensesPercentage: parseFloat(expensesPercentage.toFixed(1)),
      savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
      balancePercentage: parseFloat(balancePercentage.toFixed(1))
    };
    
    // Compare new data with ref (previous data) to avoid unnecessary updates
    const prevData = prevFinancialDataRef.current;
    const hasChanged = 
      nextFinancialData.balance !== prevData.balance ||
      nextFinancialData.income !== prevData.income ||
      nextFinancialData.expenses !== prevData.expenses ||
      nextFinancialData.savings !== prevData.savings ||
      nextFinancialData.incomePercentage !== prevData.incomePercentage ||
      nextFinancialData.expensesPercentage !== prevData.expensesPercentage ||
      nextFinancialData.savingsPercentage !== prevData.savingsPercentage ||
      nextFinancialData.balancePercentage !== prevData.balancePercentage;
    
    // Only update state if the data has changed
    if (hasChanged) {
      setFinancialData(nextFinancialData);
      prevFinancialDataRef.current = nextFinancialData;
    }
  }, [transactions, totalAssets, getDateRange]);

  // Handle opening appropriate modal/drawer for income
  const handleAddIncome = () => {
    // Refresh accounts list when opening modal
    fetchAccounts();
    
    setTransactionType('income');
    setTransactionAmount("");
    setTransactionTitle("");
    setTransactionCategory("");
    setTransactionDescription("");
    setTransactionDate("");
    setTransactionAccount("");
    setFormErrors({});
    setShowTransactionModal(true);
  };

  // Handle opening appropriate modal/drawer for expense
  const handleAddExpense = () => {
    // Refresh accounts list when opening modal
    fetchAccounts();
    
    setTransactionType('expense');
    setTransactionAmount("");
    setTransactionTitle("");
    setTransactionCategory("");
    setTransactionDescription("");
    setTransactionDate("");
    setTransactionAccount("");
    setFormErrors({});
    setShowTransactionModal(true);
  };

  // Handle closing transaction modals
  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setTransactionAmount(value);

    // Clear error when user starts typing
    if (formErrors.amount && value) {
      setFormErrors((prev: TransactionFormErrors) => ({ ...prev, amount: undefined }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors: TransactionFormErrors = {};

    // Check amount
    if (!transactionAmount) {
      errors.amount = "Amount is required";
    } else if (parseFloat(transactionAmount) <= 0) {
      errors.amount = "Amount must be greater than zero";
    }

    // Check category
    if (!transactionCategory) {
      errors.category = "Category is required";
    }
    
    // Check title - make it required
    if (!transactionTitle) {
      errors.title = "Title is required";
    } else if (transactionTitle.length < 3) {
        errors.title = "Title must be at least 3 characters";
      } else if (transactionTitle.length > 30) {
        errors.title = "Title must be at most 30 characters";
    }
    
    // Check account
    if (!transactionAccount) {
      errors.account = "Account is required";
    }

    // Check date
    if (!transactionDate) {
      errors.date = "Date is required";
    }

    // Description is optional, no validation needed

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit a new transaction
  const handleSubmitTransaction = async (type: 'income' | 'expense') => {
    if (!validateForm()) {
      return;
    }

    try {
      const amount = parseFloat(transactionAmount);
      const transactionData = {
        amount: amount,
        type: type,
      category: transactionCategory,
        title: transactionTitle,
        description: transactionDescription || '',
        date: transactionDate || new Date().toISOString().split('T')[0],
        account: transactionAccount
      };

      const response = await apiService.createTransaction(transactionData);

      if (response.success && response.data) {
        // Add to transactions array
        const newTransaction = response.data as Transaction;
        
        // Ensure the transaction has a truly unique ID
        const timestamp = new Date().getTime();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const uniqueId = Math.floor(Math.random() * 1000000) + timestamp % 1000 + randomSuffix;
        
        const transactionToEmit = {
          ...newTransaction,
          id: newTransaction.id || uniqueId
        };
        
        // Emit transaction created event immediately
        console.log('>>> EMITTING transaction:created event with data:', {
          transaction: transactionToEmit,
          type,
          amount
        });
        
        EventBus.emit('transaction:created', {
          transaction: transactionToEmit,
          type,
          amount
        });
        
        // Update financial data immediately without waiting for the useEffect
        // This ensures StatCard values are updated right away
        setFinancialData(prevData => {
          const currentIncome = type === 'income' 
            ? prevData.income + amount 
            : prevData.income;
            
          const currentExpenses = type === 'expense' 
            ? prevData.expenses + amount 
            : prevData.expenses;
            
          const currentSavings = Math.max(0, currentIncome - currentExpenses);
          
          // Calculate new balance (use totalAssets if available)
          const currentBalance = totalAssets > 0 
            ? (type === 'income' ? totalAssets + amount : totalAssets - amount)
            : (currentIncome - currentExpenses);
            
          return {
            ...prevData,
            income: currentIncome,
            expenses: currentExpenses,
            savings: currentSavings,
            balance: currentBalance,
          };
        });
        
        // Update accounts data to reflect the new balance
        fetchAccounts();
    
    // Show success toast
        toast.success(`${type === 'income' ? 'Income' : 'Expense'} added`, {
          description: `${response.data.title} • $${Math.abs(response.data.amount).toLocaleString()}`,
      position: "bottom-right",
          id: `add-transaction-${response.data._id}`, // Use unique ID to prevent duplicates
    });

    // Close the transaction modal
        setShowTransactionModal(false);
      }
    } catch (error) {
      // Show error toast
      toast.error("Failed to add transaction", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        position: "bottom-right"
      });
    }
  };

  // Handler for the transaction modal's onSubmit
  const handleFormSubmit = () => {
    // Use the current transaction type
    handleSubmitTransaction(transactionType);
  };

  // Function to handle scroll events and update ref (not state)
  const handleScroll = useRef(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (scrollContainer && scrollArea) {
      const { scrollLeft } = scrollArea;
      const cardWidth = scrollContainer.querySelector("div")?.offsetWidth || 0;
      const gap = 16; // Sesuai dengan space-x-4
      const cardWithGap = cardWidth + gap;

      // Calculate active index based on scroll position
      const activeIndex = Math.min(Math.round(scrollLeft / cardWithGap), 3);
      const isAtStart = scrollLeft < 20;
      const isAtEnd = activeIndex >= 3;

      // Only update if values actually changed to prevent render loops
      if (
        scrollPositionRef.current.isAtStart !== isAtStart ||
        scrollPositionRef.current.isAtEnd !== isAtEnd ||
        scrollPositionRef.current.activeIndex !== activeIndex
      ) {
        // Update ref without triggering re-renders
        scrollPositionRef.current = { isAtStart, isAtEnd, activeIndex };

        // Update UI state only (doesn't trigger any effects)
        // Use a stable function reference to avoid unnecessary re-renders
        setScrollIndicators({ isAtStart, isAtEnd, activeIndex });
      }
    }
  }).current;

  // Set up scroll event listener
  useEffect(() => {
    // Skip first render cycle to avoid potential initialization issues
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let scrollArea: Element | null = null;

    // Throttled scroll handler
    const throttledScrollHandler = () => {
      // Cancel any existing animation frame
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }

      // Schedule new animation frame
      frameIdRef.current = requestAnimationFrame(() => {
        handleScroll();
        frameIdRef.current = null;
      });
    };

    // Find the scroll area and attach event listener
    const setupScrollListener = () => {
      const viewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );

      if (viewport) {
        scrollArea = viewport;
        scrollArea.addEventListener("scroll", throttledScrollHandler);

        // Initial check (after DOM is ready)
        setTimeout(() => {
          if (scrollAreaRef.current) {
            handleScroll();
          }
        }, 100);
      }
    };

    setupScrollListener();

    // Clean up function - CRITICAL to prevent memory leaks
    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener("scroll", throttledScrollHandler);
      }

      // Cancel any pending animation frame
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [handleScroll]); // Add handleScroll to the dependency array

  // Function to scroll to a specific card - doesn't use state
  const scrollToCard = (index: number) => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    const scrollContainer = scrollContainerRef.current;

    if (scrollArea && scrollContainer) {
      const viewportWidth = scrollArea.offsetWidth;
      const cardWidth = scrollContainer.querySelector("div")?.offsetWidth || 0;
      const gap = 16; // Match with space-x-4

      // Calculate position that centers the card in the viewport
      const cardWithGap = cardWidth + gap;
      const leftOffset = (viewportWidth - cardWidth) / 2;
      const scrollPos = index * cardWithGap - leftOffset;

      // Use scrollTo instead of setting state to prevent update loops
      scrollArea.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });

      // Update ref directly
      scrollPositionRef.current = {
        activeIndex: index,
        isAtStart: index === 0,
        isAtEnd: index === 3,
      };

      // Update UI state separately
      setScrollIndicators({
        activeIndex: index,
        isAtStart: index === 0,
        isAtEnd: index === 3,
      });
    }
  };

  // Scroll handlers using the current values from ref
  const scrollLeft = () => {
    if (scrollPositionRef.current.activeIndex > 0) {
      scrollToCard(scrollPositionRef.current.activeIndex - 1);
    }
  };

  const scrollRight = () => {
    if (scrollPositionRef.current.activeIndex < 3) {
      scrollToCard(scrollPositionRef.current.activeIndex + 1);
    }
  };

  // Memoize fetchTransactions to prevent it from causing re-renders
  const fetchTransactions = useCallback(async () => {
    setIsTransactionsLoading(true);
    setTransactionsError(null);
    
    try {
      console.log("Fetching transactions...");
      // Add the resolveReferences flag to use the enhanced API feature
      const response = await apiService.getTransactions({ 
        limit: 20, // Increase limit to get more recent transactions
        resolveReferences: true // This will ensure IDs are resolved to names
      });
      
      if (response.success && response.data) {
        console.log("Raw transactions from API:", response.data);
        
        // Map transactions with valid IDs or generate temporary IDs if needed
        const processedTransactions = response.data.map(transaction => {
          // Check if id is missing or undefined
          if (transaction.id === undefined || transaction.id === null) {
            console.warn("Transaction without ID found:", transaction);
            // Generate a temporary ID based on other properties
            const tempId = Math.floor(Math.random() * 1000000) + 1;
            return { ...transaction, id: tempId };
          }
          return transaction;
        });
        
        console.log("Processed transactions:", processedTransactions);
        console.log("Transactions loaded successfully:", processedTransactions.length);
        
        // Use proper type assertion
        setTransactions(processedTransactions as Transaction[]);
      } else {
        setTransactionsError(response.message || "Failed to fetch transactions");
        console.error("Failed to fetch transactions:", response.message);
      }
    } catch (error) {
      setTransactionsError(error instanceof Error ? error.message : "An unknown error occurred");
      console.error("Error fetching transactions:", error);
    } finally {
      setIsTransactionsLoading(false);
    }
  }, []);

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Create a ref for handling state updates in event handlers
  const financialDataRef = useRef(financialData);
  
  // Update ref whenever financialData changes
  useEffect(() => {
    financialDataRef.current = financialData;
  }, [financialData]);
  
  // Memoize our event handlers to prevent infinite re-renders
  const _handleTransactionCreated = useMemo(() => {
    return (data: {
      transaction: Transaction, 
      type: 'income' | 'expense', 
      amount: number
    }) => {
      console.log('[Overview] Transaction created event received:', data);
      
      if (data.transaction) {
        // Add the transaction to our state (but don't trigger re-renders needlessly)
        setTransactions(prev => {
          // Check if transaction already exists
          const exists = prev.some(t => 
            (t.id && t.id === data.transaction.id) || 
            (t._id && data.transaction._id && t._id === data.transaction._id)
          );
          
          // Only update if it doesn't exist
          return exists ? prev : [data.transaction, ...prev];
        });
        
        // Update financial data without causing a re-render loop
        // Get current financial data from ref
        const prevData = financialDataRef.current;
        
        // Calculate new values
          const currentIncome = data.type === 'income' 
            ? prevData.income + data.amount 
            : prevData.income;
            
          const currentExpenses = data.type === 'expense' 
            ? prevData.expenses + data.amount 
            : prevData.expenses;
            
          const currentSavings = Math.max(0, currentIncome - currentExpenses);
        const currentBalance = totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses);
        
        // Only update if values actually changed
        if (
          currentIncome !== prevData.income ||
          currentExpenses !== prevData.expenses ||
          currentSavings !== prevData.savings ||
          currentBalance !== prevData.balance
        ) {
          setFinancialData({
            ...prevData,
            income: currentIncome,
            expenses: currentExpenses,
            savings: currentSavings,
            balance: currentBalance,
        });
        }
        
        // Refresh accounts data
        fetchAccounts();
      }
    };
  }, [totalAssets, fetchAccounts]);
    
  // Memoize transaction update handler
  const _handleTransactionUpdated = useMemo(() => {
    return (data: {
      transaction: Transaction,
      originalType?: 'income' | 'expense',
      newType?: 'income' | 'expense',
      typeChanged?: boolean,
      originalAmount?: number,
      newAmount?: number
    }) => {
      console.log('[Overview] Transaction updated event received:', data);
      
      if (data.transaction) {
        // Update the transaction in our state
        setTransactions(prev => 
          prev.map(t => t.id === data.transaction.id ? data.transaction : t)
        );
        
        // Update financial data based on the change - using ref to avoid re-render loops
        const prevData = financialDataRef.current;
          let currentIncome = prevData.income;
          let currentExpenses = prevData.expenses;
          
          // Handle income/expense type changes
          if (data.typeChanged) {
            // If original was income and now expense, remove from income, add to expense
            if (data.originalType === 'income' && data.newType === 'expense') {
              currentIncome -= data.originalAmount || 0;
              currentExpenses += data.newAmount || 0;
            }
            // If original was expense and now income, remove from expense, add to income
            else if (data.originalType === 'expense' && data.newType === 'income') {
              currentExpenses -= data.originalAmount || 0;
              currentIncome += data.newAmount || 0;
            }
          } 
          // No type change, just update amount
          else {
            // Update income amount
            if (data.newType === 'income') {
              currentIncome = prevData.income - (data.originalAmount || 0) + (data.newAmount || 0);
            }
            // Update expense amount
            else {
              currentExpenses = prevData.expenses - (data.originalAmount || 0) + (data.newAmount || 0);
            }
          }
          
          const currentSavings = Math.max(0, currentIncome - currentExpenses);
        const currentBalance = totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses);
        
        // Only update if values have changed
        if (
          currentIncome !== prevData.income ||
          currentExpenses !== prevData.expenses ||
          currentSavings !== prevData.savings ||
          currentBalance !== prevData.balance
        ) {
          setFinancialData({
            ...prevData,
            income: currentIncome,
            expenses: currentExpenses,
            savings: currentSavings,
            balance: currentBalance,
        });
        }
        
        // Refresh accounts data
        fetchAccounts();
      }
    };
  }, [totalAssets, fetchAccounts]);
    
  // Event handler for the transaction:restored event
  const _handleTransactionRestored = useCallback((data: {
    transaction: Transaction,
    type: 'income' | 'expense',
    amount: number
  }) => {
    const { transaction, type, amount } = data;
    
    // Ensure we have an ID
    if (!transaction || (!transaction.id && !transaction._id)) {
      console.error("Cannot restore transaction without ID");
      return;
    }
    
    // Create a normalized restored transaction 
    const id = transaction.id || Number(transaction._id);
    const restoredTransaction = {
      ...transaction,
      id,
      _id: transaction._id,
      isDeleted: false,
      // Ensure we convert Date objects to strings for consistent handling
      date: typeof transaction.date === 'object' 
        ? (transaction.date as Date).toISOString()
        : transaction.date
    };
    
    // Update the transactions state with the restored transaction
    setTransactions(prev =>
      prev.map(t => (String(t.id) === String(id) || (t._id && String(t._id) === String(id)))
        ? restoredTransaction 
        : t
      )
    );
    
    // Update financial stats
            setFinancialData(prevData => {
      let currentIncome = prevData.income;
      let currentExpenses = prevData.expenses;
      
      if (type === 'income') {
        currentIncome = prevData.income + amount;
      } else if (type === 'expense') {
        currentExpenses = prevData.expenses + amount;
      }
                
              const currentSavings = Math.max(0, currentIncome - currentExpenses);
      const currentBalance = totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses);
              
              return {
                ...prevData,
                income: currentIncome,
                expenses: currentExpenses,
                savings: currentSavings,
        balance: currentBalance,
              };
            });
            
    // Refresh accounts data
            fetchAccounts();
    
    toast.success("Transaction restored successfully");
  }, [totalAssets, fetchAccounts]);

  // Handle soft delete transaction events
  const _handleTransactionSoftDeleted = useCallback((data: {
    transaction: Transaction, 
    type: 'income' | 'expense', 
    amount: number
  }) => {
    console.log('[Overview] Transaction soft deleted event received:', data);
    
    if (data.transaction) {
      // Mark transaction as deleted
      setTransactions(prev => prev.map(t => 
        t.id === data.transaction.id ? { ...t, isDeleted: true } : t
      ));
      
      // Update financial data - using ref to avoid re-render loops
      const prevData = financialDataRef.current;
      
      // Update income/expenses based on transaction type
      const currentIncome = data.type === 'income' 
        ? prevData.income - data.amount 
        : prevData.income;
      
      const currentExpenses = data.type === 'expense' 
        ? prevData.expenses - data.amount 
        : prevData.expenses;
      
      const currentSavings = Math.max(0, currentIncome - currentExpenses);
      const currentBalance = totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses);
      
      // Only update if values have changed
      if (
        currentIncome !== prevData.income ||
        currentExpenses !== prevData.expenses ||
        currentSavings !== prevData.savings ||
        currentBalance !== prevData.balance
      ) {
        setFinancialData({
          ...prevData,
          income: currentIncome,
          expenses: currentExpenses,
          savings: currentSavings,
          balance: currentBalance,
        });
      }
      
      // Refresh accounts
      fetchAccounts();
    }
  }, [totalAssets, fetchAccounts]);

  // Handle permanent delete transaction events
  const _handleTransactionPermanentlyDeleted = useCallback((data: {
    transaction: Transaction, 
    type: 'income' | 'expense', 
    amount: number
  }) => {
    console.log('[Overview] Transaction permanently deleted event received:', data);
    
    if (data.transaction) {
      // Completely remove from our state
      setTransactions(prev => prev.filter(t => t.id !== data.transaction.id));
      
      // No need to update financial data as the transaction was already soft deleted
      // But we'll refresh accounts just in case
      fetchAccounts();
    }
  }, [fetchAccounts]);

  // Function to handle permanent deletion event
  const handlePermanentDeleteEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail) {
      console.error("🔴 Invalid event data:", event);
      return;
    }
    
    // Extract transaction data from the event detail
    const detail = customEvent.detail;
    let transactionId, _id, title, amount, type, wasAlreadySoftDeleted, transaction, account;
    
    if (detail.transaction) {
      // If we have a complete transaction object, use it
      transaction = detail.transaction;
      transactionId = transaction.id;
      _id = transaction._id;
      title = transaction.title;
      amount = transaction.amount;
      type = transaction.type;
      wasAlreadySoftDeleted = detail.wasAlreadySoftDeleted;
      account = transaction.account;
    } else {
      // Fallback to individual properties
      transactionId = detail.transactionId;
      _id = detail._id;
      title = detail.title;
      amount = detail.amount;
      type = detail.type;
      wasAlreadySoftDeleted = detail.wasAlreadySoftDeleted;
      account = detail.account;
    }
    
    console.log("⚡ TRANSACTION DELETE HANDLER ACTIVATED:", {
      transactionId,
      _id: _id || 'none',
      title,
      amount,
      type,
      wasAlreadySoftDeleted,
      account
    });
    
    // If we don't have a transaction ID, try to use _id
    const idToRemove = transactionId || _id;
    
    // Update the UI immediately by removing the transaction from state
    if (idToRemove) {
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => 
          (t.id !== idToRemove) && 
          (!t._id || t._id !== idToRemove)
        )
      );
    }

    // IMMEDIATE FINANCIAL DATA UPDATE - do this for all transaction types
    if (amount && type) {
      console.log(`💰 Immediate financial data update for ${type} transaction with amount ${amount}`);
      
      if (type === 'expense') {
        // For expense, we ADD the amount back to balance and REDUCE expenses
        setFinancialData(prev => {
          const newBalance = prev.balance + amount;
          const newExpenses = Math.max(0, prev.expenses - amount);
          
          console.log(`Updating balance: ${prev.balance} + ${amount} = ${newBalance}`);
          console.log(`Updating expenses: ${prev.expenses} - ${amount} = ${newExpenses}`);
      
          return {
            ...prev,
            expenses: newExpenses,
            balance: newBalance,
            incomePercentage: prev.incomePercentage,
            expensesPercentage: prev.expensesPercentage,
            savingsPercentage: prev.savingsPercentage,
            balancePercentage: prev.balancePercentage
          };
        });
      } else if (type === 'income' && !wasAlreadySoftDeleted) {
        // For income, we SUBTRACT the amount from balance and REDUCE income
        setFinancialData(prev => {
          const newBalance = Math.max(0, prev.balance - amount);
          const newIncome = Math.max(0, prev.income - amount);
          
          console.log(`Updating balance: ${prev.balance} - ${amount} = ${newBalance}`);
          console.log(`Updating income: ${prev.income} - ${amount} = ${newIncome}`);
          
          return {
            ...prev,
            income: newIncome,
            balance: newBalance,
            incomePercentage: prev.incomePercentage,
            expensesPercentage: prev.expensesPercentage,
            savingsPercentage: prev.savingsPercentage,
            balancePercentage: prev.balancePercentage
          };
        });
      }
    }
    
    // Handle expense transactions with account balance update
    if (type === 'expense') {
      console.log("🔥 EXPENSE DELETION: Updating asset balance");
      
      // Function to update the account balance
      const updateAccountBalance = async () => {
        try {
          let accountObj = null;
          
          // Try to use the account from the transaction
          if (account) {
            if (typeof account === 'object' && account !== null) {
              accountObj = account;
            } else if (typeof account === 'string') {
              // If it's a string ID, fetch the account
              try {
                const response = await apiService.getAccountById(account);
                if (response.success && response.data) {
                  accountObj = response.data;
                }
              } catch (err) {
                console.error("Failed to fetch account by ID:", err);
              }
            }
          }
          
          if (!accountObj || !accountObj._id) {
            console.error("❌ Cannot find valid account for transaction:", account);
      return;
    }
    
          console.log("✅ Found account for balance update:", accountObj);
          
          // Calculate the new balance
          const currentBalance = accountObj.balance || 0;
          const newBalance = currentBalance + amount;
          
          console.log(`💰 Updating balance: ${currentBalance} + ${amount} = ${newBalance}`);
          
          // Update using the API service
          const updateResult = await apiService.updateAsset(accountObj._id, {
            ...accountObj,
            balance: newBalance
          });
          
          if (updateResult.success) {
            console.log("✅ Asset balance updated successfully:", updateResult.data);
            // Success! Update our local state
            setAccounts(prevAccounts => {
              return prevAccounts.map(a => {
                if (a._id === accountObj._id) {
                  return {
                    ...a,
                    balance: newBalance
                  };
                }
                return a;
              });
            });
            
            // Remove duplicate toast notification - keeping only the one with undo button
            // toast.success("Balance updated successfully", {
            //  description: `New balance: $${newBalance.toFixed(2)}`,
            //  duration: 3000
            // });
            
            // Force UI refresh but NO page reload
            setRefreshTrigger(prev => prev + 1);
        } else {
            console.error("❌ Failed to update asset balance:", updateResult.message);
            
            // Try emergency update
            console.log("🚨 Attempting emergency direct update");
            const emergencySuccess = await emergencyDirectAssetBalanceUpdate(
              accountObj as unknown as Record<string, unknown>, 
            amount
            );
            
            if (emergencySuccess) {
              console.log("🚨 Emergency update succeeded");
              // Update accounts to refresh the UI
              fetchAccounts();
              // Force UI refresh but NO page reload
              setRefreshTrigger(prev => prev + 1);
              
              // Remove duplicate toast notification
              // toast.success("Balance updated successfully (emergency mode)", {
              //  description: `Balance updated with direct API access`,
              //  duration: 3000
              // });
            } else {
              console.error("🚨 Emergency update failed");
              // Keep error toasts as they're important for user feedback
              toast.error("Failed to update balance", {
                description: "Please refresh the page and try again",
                duration: 5000
              });
            }
          }
        } catch (error) {
          console.error("❌ Error updating account balance:", error);
          // Keep error toasts as they're important for user feedback
          toast.error("Error updating balance", {
            description: "An unexpected error occurred",
            duration: 5000
          });
        }
      };
      
      // Execute the update
      updateAccountBalance();
      
      // Force refresh accounts to update immediately
      fetchAccounts();
    } else {
      // For income or other types, still refresh accounts
      fetchAccounts();
    }
    
  }, [fetchAccounts, setRefreshTrigger, setFinancialData, setAccounts]);
  
  // Force fetch accounts whenever financial data is updated
  useEffect(() => {
    // Only run after initial render
    if (financialData.balance !== 0 || financialData.income !== 0 || financialData.expenses !== 0) {
      console.log("💰 Financial data changed, refreshing accounts");
      fetchAccounts();
    }
  }, [financialData, fetchAccounts]);

  // Modify the useEffect that updates financial data to always recalculate based on totalAssets
  useEffect(() => {
    if (transactions.length > 0 || refreshTrigger > 0) {
      console.log("💰 Recalculating financial data based on transactions and assets");
      console.log(`Current totalAssets: ${totalAssets}`);
      
      let currentIncome = 0;
      let currentExpenses = 0;
      
      // Only count non-deleted transactions
      transactions.filter(t => !t.isDeleted).forEach(transaction => {
        if (transaction.type === 'income') {
          currentIncome += Math.abs(transaction.amount || 0);
        } else if (transaction.type === 'expense') {
          currentExpenses += Math.abs(transaction.amount || 0);
        }
      });
      
      const currentSavings = Math.max(0, currentIncome - currentExpenses);
      
      // CRITICAL FIX: Always use totalAssets as the balance 
      // This ensures that asset balance changes are always reflected
      const currentBalance = totalAssets;
      
      // Calculate percentage values for UI display
      const total = currentIncome + currentExpenses;
      const incomePercentage = total > 0 ? (currentIncome / total) * 100 : 0;
      const expensesPercentage = total > 0 ? (currentExpenses / total) * 100 : 0;
      const savingsPercentage = currentIncome > 0 ? (currentSavings / currentIncome) * 100 : 0;
      const balancePercentage = total > 0 ? (currentBalance / total) * 100 : 0;
      
      console.log("💰 Financial data calculation results:", {
        totalAssets,
        currentIncome,
        currentExpenses, 
        currentSavings,
        calculatedBalance: currentBalance
      });
      
      setFinancialData({
        income: currentIncome,
        expenses: currentExpenses,
        savings: currentSavings,
        balance: currentBalance,
        incomePercentage,
        expensesPercentage,
        savingsPercentage,
        balancePercentage
      });
    }
  }, [transactions, totalAssets, refreshTrigger]);

  // Add event listener for permanent delete events
  useEffect(() => {
    // Add event listener to document
    document.addEventListener('transaction:permanentlyDeleted', handlePermanentDeleteEvent);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('transaction:permanentlyDeleted', handlePermanentDeleteEvent);
    };
  }, [handlePermanentDeleteEvent]);

  // Function to handle transaction state changed events
  const handleTransactionStateChanged = useCallback((event: Event) => {
    try {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail) {
        console.error("🔴 Invalid transaction:stateChanged event data:", event);
        return;
      }
      
      const { transaction, action, wasSoftDeleted } = customEvent.detail;
      
      if (!transaction || !action) {
        console.error("🔴 Missing transaction or action in state change event:", customEvent.detail);
        return;
      }
      
      console.log(`🔄 Transaction state changed in Overview: action=${action}, transaction=${transaction.title}, id=${transaction.id}, type=${transaction.type}, amount=${transaction.amount}, wasSoftDeleted=${wasSoftDeleted}`);
      
      if (action === 'permanentlyDeleted') {
        // We have a dedicated handler for this, but handle UI update here
        setTransactions(prevTransactions => 
          prevTransactions.filter(t => t.id !== transaction.id && (!t._id || t._id !== transaction._id))
        );
        
        // For permanentlyDeleted events, we'll let handlePermanentDeleteEvent do the work
      } 
      else if (action === 'softDeleted') {
        console.log("🔄 SOFT DELETE detected, updating financial data and UI");
        
        // Mark as deleted in UI
        setTransactions(prevTransactions => 
          prevTransactions.map(t => {
            if (t.id === transaction.id || (t._id && transaction._id && t._id === transaction._id)) {
              return { ...t, isDeleted: true };
            }
            return t;
          })
        );
        
        // Update financial data
        if (transaction.amount && transaction.type) {
          if (transaction.type === 'expense') {
            console.log(`💰 Expense soft deleted, amount: ${transaction.amount}. Updating expenses and balance.`);
            
            // For expense, we ADD the amount back to balance and REDUCE expenses
            setFinancialData(prev => {
              const newBalance = prev.balance + transaction.amount;
              const newExpenses = Math.max(0, prev.expenses - transaction.amount);
              
              console.log(`Updating balance: ${prev.balance} + ${transaction.amount} = ${newBalance}`);
              console.log(`Updating expenses: ${prev.expenses} - ${transaction.amount} = ${newExpenses}`);
              
              return {
                ...prev,
                expenses: newExpenses,
                balance: newBalance,
                incomePercentage: prev.incomePercentage,
                expensesPercentage: prev.expensesPercentage,
                savingsPercentage: prev.savingsPercentage,
                balancePercentage: prev.balancePercentage
              };
            });
            
            // Update the account balance if we have account information
            if (transaction.account) {
              updateAccountBalanceForSoftDelete(transaction.account, transaction.amount);
            }
          } else if (transaction.type === 'income') {
            console.log(`💰 Income soft deleted, amount: ${transaction.amount}. Updating income and balance.`);
            
            // For income, we SUBTRACT the amount from balance and REDUCE income
            setFinancialData(prev => {
              const newBalance = Math.max(0, prev.balance - transaction.amount);
              const newIncome = Math.max(0, prev.income - transaction.amount);
              
              console.log(`Updating balance: ${prev.balance} - ${transaction.amount} = ${newBalance}`);
              console.log(`Updating income: ${prev.income} - ${transaction.amount} = ${newIncome}`);
              
              return {
                ...prev,
                income: newIncome,
                balance: newBalance,
                incomePercentage: prev.incomePercentage,
                expensesPercentage: prev.expensesPercentage,
                savingsPercentage: prev.savingsPercentage,
                balancePercentage: prev.balancePercentage
              };
            });
          }
        }
        
        // Refresh accounts data
        fetchAccounts();
        // Force UI refresh 
        setRefreshTrigger(prev => prev + 1);
      } 
      else if (action === 'restored') {
        console.log("🔄 RESTORE detected, updating financial data and UI");
        
        // Mark as not deleted in UI
        setTransactions(prevTransactions => 
          prevTransactions.map(t => {
            if (t.id === transaction.id || (t._id && transaction._id && t._id === transaction._id)) {
              return { ...t, isDeleted: false };
            }
            return t;
          })
        );
        
        // Update financial data
        if (transaction.amount && transaction.type) {
          if (transaction.type === 'expense') {
            console.log(`💰 Expense restored, amount: ${transaction.amount}. Updating expenses and balance.`);
            
            // For expense, we SUBTRACT the amount from balance and ADD to expenses
            setFinancialData(prev => {
              const newBalance = Math.max(0, prev.balance - transaction.amount);
              const newExpenses = prev.expenses + transaction.amount;
              
              console.log(`Updating balance: ${prev.balance} - ${transaction.amount} = ${newBalance}`);
              console.log(`Updating expenses: ${prev.expenses} + ${transaction.amount} = ${newExpenses}`);
      
      return {
                ...prev,
                expenses: newExpenses,
                balance: newBalance,
                incomePercentage: prev.incomePercentage,
                expensesPercentage: prev.expensesPercentage,
                savingsPercentage: prev.savingsPercentage,
                balancePercentage: prev.balancePercentage
      };
    });
            
            // Update the account balance if we have account information
            if (transaction.account) {
              updateAccountBalanceForRestore(transaction.account, transaction.amount);
            }
          } else if (transaction.type === 'income') {
            console.log(`💰 Income restored, amount: ${transaction.amount}. Updating income and balance.`);
            
            // For income, we ADD the amount to balance and ADD to income
            setFinancialData(prev => {
              const newBalance = prev.balance + transaction.amount;
              const newIncome = prev.income + transaction.amount;
              
              console.log(`Updating balance: ${prev.balance} + ${transaction.amount} = ${newBalance}`);
              console.log(`Updating income: ${prev.income} + ${transaction.amount} = ${newIncome}`);
              
              return {
                ...prev,
                income: newIncome,
                balance: newBalance,
                incomePercentage: prev.incomePercentage,
                expensesPercentage: prev.expensesPercentage,
                savingsPercentage: prev.savingsPercentage,
                balancePercentage: prev.balancePercentage
              };
            });
          }
        }
        
        // Refresh accounts data
        fetchAccounts();
        // Force UI refresh 
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("🔴 Error handling transaction state change event in Overview:", error);
    }
  }, [fetchAccounts, setRefreshTrigger]);

  // Listen for transaction state changed events
  useEffect(() => {
    document.addEventListener('transaction:stateChanged', handleTransactionStateChanged as EventListener);
    
    return () => {
      document.removeEventListener('transaction:stateChanged', handleTransactionStateChanged as EventListener);
    };
  }, [handleTransactionStateChanged]);

  // Helper function to update account balance for soft delete
  const updateAccountBalanceForSoftDelete = useCallback(async (account: string | Record<string, unknown>, amount: number) => {
    try {
      let accountObj: Asset | null = null;
      
      // Try to use the account from the transaction
      if (account) {
        if (typeof account === 'object' && account !== null) {
          accountObj = account as unknown as Asset;
        } else if (typeof account === 'string') {
          // If it's a string ID, fetch the account
          try {
            const response = await apiService.getAccountById(account);
            if (response.success && response.data) {
              accountObj = response.data as Asset;
            }
          } catch (err) {
            console.error("Failed to fetch account by ID:", err);
          }
        }
      }
      
      if (!accountObj || !accountObj._id) {
        console.error("❌ Cannot find valid account for soft delete balance update:", account);
        return;
      }
      
      console.log("✅ Found account for soft delete balance update:", accountObj);
      
      // Calculate the new balance - for soft delete of expense, ADD the amount back
      const currentBalance = accountObj.balance || 0;
      const newBalance = currentBalance + amount;
      
      console.log(`💰 Soft Delete: Updating balance: ${currentBalance} + ${amount} = ${newBalance}`);
      
      // Update using the API service
      const updateResult = await apiService.updateAsset(accountObj._id, {
        ...accountObj,
        balance: newBalance
      });
      
      if (updateResult.success) {
        console.log("✅ Asset balance updated successfully for soft delete:", updateResult.data);
        // Success! Update our local state
        setAccounts(prevAccounts => {
          return prevAccounts.map(a => {
            if (a._id === accountObj?._id) {
              return {
                ...a,
                balance: newBalance
              };
            }
            return a;
          });
        });
        
        // Removed simple toast notification - keeping only the one with undo button
      } else {
        console.error("❌ Failed to update asset balance for soft delete:", updateResult.message);
        
        // Try emergency update
        console.log("🚨 Attempting emergency direct update for soft delete");
        await emergencyDirectAssetBalanceUpdate(
          accountObj as unknown as Record<string, unknown>, 
          amount
        );
      }
    } catch (error) {
      console.error("❌ Error updating account balance for soft delete:", error);
    }
  }, [setAccounts]);

  // Helper function to update account balance for restore
  const updateAccountBalanceForRestore = useCallback(async (account: string | Record<string, unknown>, amount: number) => {
    try {
      let accountObj: Asset | null = null;
      
      // Try to use the account from the transaction
      if (account) {
        if (typeof account === 'object' && account !== null) {
          accountObj = account as unknown as Asset;
        } else if (typeof account === 'string') {
          // If it's a string ID, fetch the account
          try {
            const response = await apiService.getAccountById(account);
            if (response.success && response.data) {
              accountObj = response.data as Asset;
            }
          } catch (err) {
            console.error("Failed to fetch account by ID:", err);
          }
        }
      }
      
      if (!accountObj || !accountObj._id) {
        console.error("❌ Cannot find valid account for restore balance update:", account);
        return;
      }
      
      console.log("✅ Found account for restore balance update:", accountObj);
      
      // Calculate the new balance - for restore of expense, SUBTRACT the amount
      const currentBalance = accountObj.balance || 0;
      const newBalance = Math.max(0, currentBalance - amount);
      
      console.log(`💰 Restore: Updating balance: ${currentBalance} - ${amount} = ${newBalance}`);
      
      // Update using the API service
      const updateResult = await apiService.updateAsset(accountObj._id, {
        ...accountObj,
        balance: newBalance
      });
      
      if (updateResult.success) {
        console.log("✅ Asset balance updated successfully for restore:", updateResult.data);
        // Success! Update our local state
        setAccounts(prevAccounts => {
          return prevAccounts.map(a => {
            if (a._id === accountObj?._id) {
              return {
                ...a,
                balance: newBalance
              };
            }
            return a;
          });
        });
        
        // Removed simple toast notification - keeping only the one with undo button
      } else {
        console.error("❌ Failed to update asset balance for restore:", updateResult.message);
        
        // Try emergency update
        console.log("🚨 Attempting emergency direct update for restore");
        await emergencyDirectAssetBalanceUpdate(
          accountObj as unknown as Record<string, unknown>, 
          -amount  // Negate amount for restore
        );
      }
    } catch (error) {
      console.error("❌ Error updating account balance for restore:", error);
    }
  }, [setAccounts]);

  // Function to convert AssetTransfer to Transaction format
  const convertTransfersToTransactions = (transfers: AssetTransfer[]): Transaction[] => {
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
        // If no seed exists, generate random ID
        id = Math.floor(Math.random() * 100000) + 1;
      }
      
      // Ensure ID is valid
      if (isNaN(id) || id === 0 || usedIds.has(id)) {
        // If invalid or already used, generate new ID
        id = Math.floor(Math.random() * 100000) + 1;
        
        // Make sure the new ID is not a duplicate (recursive check)
        while (usedIds.has(id)) {
          id = Math.floor(Math.random() * 100000) + 1;
        }
      }
      
      // Add to the set of used IDs
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
      
      // Get ID from transfer (object ID, string ID, or property ID)
      const transferIdStr = String(transfer._id || transfer.id || '');
      
      // Generate ID unik untuk transaction
      const numericId = generateUniqueId(transferIdStr);
      
      // Define transfer type as const
      const transferType = 'transfer' as const;
      
      return {
        id: numericId,
        title: `Transfer: ${fromAssetName} → ${toAssetName}`,
        amount: transfer.amount,
        date: typeof transfer.date === 'string' ? transfer.date : new Date(transfer.date).toISOString().split('T')[0],
        category: 'Transfer',
        description: transfer.description || `Transfer from ${fromAssetName} to ${toAssetName}`,
        account: fromAssetName,
        transferType, // Use the const defined above
        fromAsset: fromAssetName,
        toAsset: toAssetName,
        type: 'expense', // Default type for display purposes
        status: 'completed'
      };
    });
  };

  // Combine regular transactions and transfers before displaying
  const getAllTransactions = useMemo(() => {
    const transferTransactions = convertTransfersToTransactions(assetTransfers);
    
    // Filter hanya transaksi yang benar-benar undefined
    const validTransactions = transactions.filter(t => 
      t && t.id !== undefined
    );
    
    const combinedTransactions = [...validTransactions, ...transferTransactions];
    
    // Sort by date (newest first)
    return combinedTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, assetTransfers]);

  // Navigate to transactions page
  const handleViewAllTransactions = () => {
    window.location.href = '/dashboard/transactions';
  };

  // Function for editing transactions
  const handleEditTransaction = (id: number) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setCurrentTransactionId(id);
      setShowEditModal(true);
    }
  };

  // Function for deleting transactions
  const handleDeleteTransaction = (id: string | number) => {
    const transaction = transactions.find((t) => 
      t.id === id || (typeof t.id === 'string' && typeof id === 'string' && t.id === id)
    );
    if (transaction) {
      setTransactionToDelete(transaction);
      setShowDeleteDialog(true);
    }
  };

  // Soft delete handler
  const handleSoftDelete = (id: string | number, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: boolean
  ) => {
    const transaction = transactions.find((t) => 
      t.id === id || (typeof t.id === 'string' && typeof id === 'string' && t.id === id)
    );
    if (transaction) {
      setTransactionToDelete(transaction);
      setShowDeleteDialog(true);
    }
  };

  // Find the useEffect that sets up and cleans up transaction event listeners
  useEffect(() => {
    console.log('[Overview] Loading TransactionEventBus');
    
    // Load transaction event listeners
    const eventBusLoaded = () => {
      console.log('[Overview] TransactionEventBus loaded: SUCCESS');
      
      // Set up event listeners for transaction changes
      EventBus.on('transaction:created', _handleTransactionCreated);
      EventBus.on('transaction:updated', _handleTransactionUpdated);
      EventBus.on('transaction:softDeleted', _handleTransactionSoftDeleted);
      EventBus.on('transaction:permanentlyDeleted', _handleTransactionPermanentlyDeleted);
      EventBus.on('transaction:restored', _handleTransactionRestored);
        
      console.log('[Overview] Successfully registered all transaction event handlers');
    };
    
    eventBusLoaded();
    
    // Clean up event listeners when component unmounts
    return () => {
      console.log('[Overview] Cleaning up transaction event listeners');
      
      // Use EventBus.off directly with the handler functions
      EventBus.off('transaction:created', _handleTransactionCreated);
      EventBus.off('transaction:updated', _handleTransactionUpdated);
      EventBus.off('transaction:softDeleted', _handleTransactionSoftDeleted);
      EventBus.off('transaction:permanentlyDeleted', _handleTransactionPermanentlyDeleted);
      EventBus.off('transaction:restored', _handleTransactionRestored);
    };
  }, [_handleTransactionCreated, _handleTransactionUpdated, _handleTransactionSoftDeleted, _handleTransactionPermanentlyDeleted, _handleTransactionRestored]);

  return (
    <div className="w-full py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Page Header - Pass user name to the description */}
        <motion.div {...fadeIn}>
          <DashboardHeader
            title="Overview"
            description={`Welcome back${user?.name ? ", " + user.name : ""}`}
            icon={
              <LayoutDashboard className="h-8 w-8 text-primary opacity-85" />
            }
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="mb-8 relative"
          {...fadeIn}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Financial Overview
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your last 30 days ({getDateRange().start} - {getDateRange().end})
              </p>
            </div>
          </div>

          {/* Mobile view - scrollable cards */}
          <div className="md:hidden relative">
            <ScrollArea className="pb-4" ref={scrollAreaRef}>
              <div
                ref={scrollContainerRef}
                className="flex space-x-4 px-4 py-1"
              >
                <motion.div
                  className="min-w-[80vw] w-[80vw] first:ml-0 h-[135px]"
                  {...slideUp}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <StatCard
                    title="Balance"
                    value={financialData.balance}
                    formatter={formatCurrency}
                    icon={Wallet}
                    color="green"
                    period="Total assets value"
                    percentage={financialData.balancePercentage}
                    onClick={() => scrollToCard(0)}
                  />
                </motion.div>

                <motion.div
                  className="min-w-[80vw] w-[80vw] h-[135px]"
                  {...slideUp}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <StatCard
                    title="Income"
                    value={financialData.income}
                    formatter={formatCurrency}
                    icon={ArrowUpRight}
                    color="blue"
                    period="Last 30 days"
                    percentage={financialData.incomePercentage}
                    onClick={() => scrollToCard(1)}
                  />
                </motion.div>

                <motion.div
                  className="min-w-[80vw] w-[80vw] h-[135px]"
                  {...slideUp}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <StatCard
                    title="Expenses"
                    value={financialData.expenses}
                    formatter={formatCurrency}
                    icon={ArrowDownRight}
                    color="red"
                    period="Last 30 days"
                    percentage={financialData.expensesPercentage}
                    onClick={() => scrollToCard(2)}
                  />
                </motion.div>

                <motion.div
                  className="min-w-[80vw] w-[80vw] h-[135px]"
                  {...slideUp}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <StatCard
                    title="Savings"
                    value="Coming Soon"
                    icon={PiggyBank}
                    color="purple"
                    subtitle="Under development"
                    className="shadow-sm bg-muted/10 border-dashed"
                  />
                </motion.div>
              </div>

              <ScrollBar orientation="horizontal" className="h-0" />

              {/* Overlay gradients for scroll indication */}
              {!scrollIndicators.isAtStart && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
              )}
              {!scrollIndicators.isAtEnd && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
              )}
            </ScrollArea>

            {/* Pagination dots for mobile */}
            <motion.div
              className="flex items-center justify-center mt-3 gap-4"
              {...fadeIn}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button
                size="icon"
                variant="outline"
                className={`h-6 w-6 text-foreground border-border rounded-full ${
                  scrollIndicators.isAtStart
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
                onClick={scrollLeft}
                disabled={scrollIndicators.isAtStart}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <div className="flex justify-center gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    onClick={() => scrollToCard(index)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      scrollIndicators.activeIndex === index
                        ? "w-6 bg-primary opacity-70"
                        : "w-1.5 bg-primary/30 hover:bg-primary/50"
                    }`}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                size="icon"
                variant="outline"
                className={`h-6 w-6 text-foreground border-border rounded-full ${
                  scrollIndicators.isAtEnd
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
                onClick={scrollRight}
                disabled={scrollIndicators.isAtEnd}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>

          {/* Desktop view - grid layout with staggered animation */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <motion.div {...slideUp} transition={{ delay: 0.1, duration: 0.3 }}>
              <StatCard
                title="Balance"
                value={financialData.balance}
                formatter={formatCurrency}
                icon={Wallet}
                color="green"
                period="Total assets value"
                percentage={financialData.balancePercentage}
              />
            </motion.div>

            <motion.div {...slideUp} transition={{ delay: 0.15, duration: 0.3 }}>
              <StatCard
                title="Income"
                value={financialData.income}
                formatter={formatCurrency}
                icon={ArrowUpRight}
                color="blue"
                period="Last 30 days"
                percentage={financialData.incomePercentage}
              />
            </motion.div>

            <motion.div {...slideUp} transition={{ delay: 0.2, duration: 0.3 }}>
              <StatCard
                title="Expenses"
                value={financialData.expenses}
                formatter={formatCurrency}
                icon={ArrowDownRight}
                color="red"
                period="Last 30 days"
                percentage={financialData.expensesPercentage}
              />
            </motion.div>

            <motion.div {...slideUp} transition={{ delay: 0.25, duration: 0.3 }}>
              <StatCard
              title="Savings"
              value="Coming Soon"
              icon={PiggyBank}
              color="purple"
              subtitle="Under development"
              className="shadow-sm bg-muted/10 border-dashed"
              isComingSoon
            />
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mb-8"
          {...fadeIn}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <TransactionActions 
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
          />
        </motion.div>

        {/* Desktop: Recent Transactions and Upcoming Bills */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Transactions Section */}
          <motion.div
            className="lg:col-span-2"
            {...slideUp}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            {transactions.filter(t => !t.isDeleted).length === 0 && !isTransactionsLoading && assetTransfers.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyTransactionState onAddTransaction={handleAddIncome} />
                </CardContent>
              </Card>
            ) : (
              <TransactionList
                transactions={getAllTransactions.filter(t => !t.isDeleted)}
                title="Recent Transactions"
                description="Your latest financial activity"
                limit={5}
                compactMode={true}
                showActions={true}
                groupByDate={true}
                onViewAllTransactions={handleViewAllTransactions}
                onEditTransaction={(id) => handleEditTransaction(Number(id))}
                onDeleteTransaction={(id) => handleDeleteTransaction(id)}
                isLoading={isTransactionsLoading || isLoadingTransfers}
              />
            )}
          </motion.div>

          {/* Upcoming Bills Section */}
          <motion.div
            className="lg:col-span-1"
            {...slideUp}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bills</CardTitle>
                <CardDescription>Bills due in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <UnderConstruction minimal />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Mobile: Upcoming Bills first, then Recent Transactions */}
        <div className="md:hidden grid grid-cols-1 gap-6 mb-16">
          {/* Upcoming Bills Section */}
          <motion.div {...slideUp} transition={{ delay: 0.25, duration: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bills</CardTitle>
                <CardDescription>Bills due in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <UnderConstruction minimal />
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions Section */}
          <motion.div {...slideUp} transition={{ delay: 0.3, duration: 0.4 }}>
            {transactions.filter(t => !t.isDeleted).length === 0 && !isTransactionsLoading && assetTransfers.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyTransactionState onAddTransaction={handleAddIncome} />
                </CardContent>
              </Card>
            ) : (
              <TransactionList
                transactions={getAllTransactions.filter(t => !t.isDeleted)}
                title="Recent Transactions"
                description="Your latest financial activity"
                limit={5}
                compactMode={true}
                showActions={true}
                groupByDate={true}
                onViewAllTransactions={handleViewAllTransactions}
                onEditTransaction={(id) => handleEditTransaction(Number(id))}
                onDeleteTransaction={(id) => handleDeleteTransaction(id)}
                isLoading={isTransactionsLoading || isLoadingTransfers}
              />
            )}
          </motion.div>
        </div>

        {/* Add Transaction Modal */}
        <ResponsiveTransactionModal
          mode="add"
          type={transactionType}
          isOpen={showTransactionModal}
          transactionAmount={transactionAmount}
          transactionTitle={transactionTitle}
          transactionCategory={transactionCategory}
          transactionDescription={transactionDescription}
          transactionDate={transactionDate}
          transactionAccount={transactionAccount}
          formErrors={formErrors}
          onClose={handleCloseTransactionModal}
          onSubmit={handleFormSubmit}
          onAmountChange={handleAmountChange}
          onTitleChange={(value: string) => setTransactionTitle(value)}
          onCategoryChange={(value: string) => setTransactionCategory(value)}
          onDescriptionChange={(value: string) =>
            setTransactionDescription(value)
          }
          onDateChange={(value: string) => setTransactionDate(value)}
          onAccountChange={(value: string) => setTransactionAccount(value)}
          accounts={accounts}
          isLoadingAccounts={isAccountsLoading}
        />
        
        {/* Edit Transaction Modal */}
        <ResponsiveTransactionModal
          mode="edit"
          type={currentTransactionType}
          isOpen={showEditModal}
          transactionAmount={transactionAmount}
          transactionTitle={transactionTitle}
          transactionCategory={transactionCategory}
          transactionDescription={transactionDescription}
          transactionDate={transactionDate}
          transactionAccount={transactionAccount}
          formErrors={formErrors}
          onClose={() => {
            setShowEditModal(false);
            
            // Reset form state completely to allow editing again
            setTransactionAmount("");
            setTransactionTitle("");
            setTransactionCategory("");
            setTransactionDescription("");
            setTransactionDate("");
            setTransactionAccount("");
            setFormErrors({});
            setCurrentTransactionId(undefined);
          }}
          onSubmit={async () => {
            if (!validateForm()) return;
            
            // Get original transaction for comparison
            const originalTransaction = transactions.find(t => t.id === currentTransactionId);
            if (!originalTransaction) return;
            
            // Get the values for calculation
                const amount = parseFloat(transactionAmount);
            const oldAmount = Math.abs(originalTransaction.amount);
            const oldType = originalTransaction.type;
            
            // Determine if there's a type change for balance calculations
            const typeChanged = currentTransactionType !== oldType;
            
            try {
              // Ensure date is properly formatted
              let formattedDate = transactionDate;
              try {
                if (transactionDate) {
                  const dateObj = new Date(transactionDate);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
                  }
                }
              } catch (error) {
                console.error("Error formatting date for submit:", error);
              }
              
              // Prepare transaction data for API
              const transactionData = {
                amount,
                  type: currentTransactionType,
                  category: transactionCategory,
                title: transactionTitle,
                  description: transactionDescription,
                date: formattedDate,
                  account: transactionAccount
                };
              
              console.log('Updating transaction data:', {
                id: originalTransaction._id?.toString() || originalTransaction.id.toString(),
                data: transactionData
              });
              
              // Send update request to API
              const response = await apiService.updateTransaction(
                originalTransaction._id?.toString() || originalTransaction.id.toString(), 
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
                  updatedTransaction.id = Number(originalTransaction.id);
                } else if (updatedTransaction.id && !updatedTransaction._id) {
                  updatedTransaction._id = originalTransaction._id;
                }
                
                // Ensure the numeric ID is preserved for consistent reference
                if (typeof updatedTransaction.id !== 'number' && originalTransaction.id) {
                  updatedTransaction.id = Number(originalTransaction.id);
                }
                
                // Update state with the fully resolved transaction
                setTransactions(prev => 
                  prev.map(t => (t.id === currentTransactionId || t._id === originalTransaction._id) ? updatedTransaction : t)
                );
                
                // Emit event to notify other components
                EventBus.emit('transaction:updated', {
                  transaction: updatedTransaction,
                  originalType: oldType,
                  originalAmount: oldAmount,
                  newType: currentTransactionType,
                  newAmount: amount,
                  typeChanged
                });
                
                // Update financial data immediately
                setFinancialData(prevData => {
                  let currentIncome = prevData.income;
                  let currentExpenses = prevData.expenses;
                  
                  // Handle income/expense type changes
                  if (typeChanged) {
                    // If original was income and now expense, remove from income, add to expense
                    if (oldType === 'income' && currentTransactionType === 'expense') {
                      currentIncome -= oldAmount;
                      currentExpenses += amount;
                    }
                    // If original was expense and now income, remove from expense, add to income
                    else if (oldType === 'expense' && currentTransactionType === 'income') {
                      currentExpenses -= oldAmount;
                      currentIncome += amount;
                    }
                  } 
                  // No type change, just update amount
                  else {
                    // Update income amount
                    if (currentTransactionType === 'income') {
                      currentIncome = prevData.income - oldAmount + amount;
                    }
                    // Update expense amount
                    else {
                      currentExpenses = prevData.expenses - oldAmount + amount;
                    }
                  }
                  
                  const currentSavings = Math.max(0, currentIncome - currentExpenses);
                  
                  // Calculate new balance
                  const currentBalance = totalAssets > 0 
                    ? totalAssets // Will be updated from fetchAccounts()
                    : (currentIncome - currentExpenses);
                    
                  return {
                    ...prevData,
                    income: currentIncome,
                    expenses: currentExpenses,
                    savings: currentSavings,
                    balance: currentBalance,
                  };
                });
                
                // Update accounts since balance may have changed
                fetchAccounts();
            
            // Show success toast
            toast.success("Transaction updated", {
                  description: `${updatedTransaction.title} has been updated successfully.`,
                  position: "bottom-right",
                  id: `update-transaction-${updatedTransaction._id || updatedTransaction.id}`,
                });
                
                // Reset form state completely to allow editing again
                setTransactionAmount("");
                setTransactionTitle("");
                setTransactionCategory("");
                setTransactionDescription("");
                setTransactionDate("");
                setTransactionAccount("");
                setFormErrors({});
                setCurrentTransactionId(undefined);
            
            // Close modal
            setShowEditModal(false);
              } else {
                console.error('Transaction update failed:', response.message || 'Unknown error');
                toast.error("Transaction update failed", {
                  description: response.message || "An error occurred while updating the transaction",
                  position: "bottom-right"
                });
              }
            } catch (error) {
              console.error("Transaction error:", error);
              // Show error toast
              toast.error("Transaction error", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                position: "bottom-right"
              });
            }
          }}
          onAmountChange={handleAmountChange}
          onTitleChange={(value: string) => setTransactionTitle(value)}
          onCategoryChange={(value: string) => setTransactionCategory(value)}
          onDescriptionChange={(value: string) => setTransactionDescription(value)}
          onDateChange={(value: string) => setTransactionDate(value)}
          onAccountChange={(value: string) => setTransactionAccount(value)}
          accounts={accounts}
          isLoadingAccounts={isAccountsLoading}
        />
        
        {/* Delete Transaction Dialog */}
        {transactionToDelete && (
          <DeleteTransactionDialog
            transaction={transactionToDelete}
            isOpen={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSoftDelete={handleSoftDelete}
          />
        )}
      </div>
    </div>
  );
}
