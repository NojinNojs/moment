import { useState, useEffect, useRef, useMemo } from "react";
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
import { useNavigate } from "react-router-dom";

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

export default function Overview() {
  const navigate = useNavigate();
  // Add auth context
  const { user } = useAuth();

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
  const [currentTransactionType, setCurrentTransactionType] = useState<'income' | 'expense'>('income');
  const [currentTransactionId, setCurrentTransactionId] = useState<number | undefined>(undefined);
  
  // State for delete transaction dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

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

  // State for user accounts
  const [accounts, setAccounts] = useState<Asset[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // State for asset transfers
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // Calculate asset totals
  const totalAssets = useMemo(() => 
    accounts.reduce((total, asset) => total + (asset.isDeleted ? 0 : asset.balance), 0),
    [accounts]
  );

  // Fetch user accounts
  const fetchAccounts = async () => {
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
  };

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch asset transfers when component mounts
  const fetchAssetTransfers = async () => {
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
  };

  // Fetch asset transfers when component mounts
  useEffect(() => {
    fetchAssetTransfers();
  }, []);

  // Calculate date range dynamically
  const getDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    };
    
    return {
      start: formatDate(thirtyDaysAgo),
      end: formatDate(today)
    };
  };

  // State for tracking which transactions are being deleted
  const [deletingTransactionIds, setDeletingTransactionIds] = useState<number[]>([]);

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

  // Calculate financial data from transactions
  useEffect(() => {
    const activeTransactions = transactions.filter(t => !t.isDeleted);
    
    // Get current and previous period transactions
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    // Current period (last 30 days)
    const currentPeriodTransactions = activeTransactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= thirtyDaysAgo && txDate <= today;
    });
    
    // Previous period (30-60 days ago)
    const previousPeriodTransactions = activeTransactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo;
    });
    
    // Calculate current period totals
    const currentIncome = currentPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const currentExpenses = currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const currentSavings = Math.max(0, currentIncome - currentExpenses);
    
    // Use total assets for current balance if available
    const currentBalance = totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses);
    
    // Calculate previous period totals
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
    
    setFinancialData({
      balance: currentBalance,
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      incomePercentage: parseFloat(incomePercentage.toFixed(1)),
      expensesPercentage: parseFloat(expensesPercentage.toFixed(1)),
      savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
      balancePercentage: parseFloat(balancePercentage.toFixed(1))
    });
  }, [transactions, totalAssets]);

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

    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    if (!transactionCategory) {
      errors.category = "Please select a category";
    }
    
    if (transactionTitle) {
      if (transactionTitle.length < 5) {
        errors.title = "Title must be at least 5 characters";
      } else if (transactionTitle.length > 20) {
        errors.title = "Title must be at most 20 characters";
      }
    } else {
      errors.title = "Please enter a title";
    }
    
    if (!transactionAccount) {
      errors.account = "Please select an account";
    }

    if (!transactionDate) {
      errors.date = "Please select a date";
    }

    if (!transactionDescription) {
      errors.description = "Please enter a description";
    }

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
        title: transactionTitle || (type === 'income' ? 'Income' : 'Expense'),
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

  // Fetch transactions when component mounts
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
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
      setIsLoadingTransactions(false);
    }
  };

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Subscription to transaction events - use more robust import method
  useEffect(() => {
    // Import event bus from Transactions component
    let unsubscribeCreated = () => {};
    let unsubscribeUpdated = () => {};
    let unsubscribeDeleted = () => {};
    let unsubscribeRestored = () => {};
    
    // Define event handlers outside the import to avoid circular reference issues
    const handleTransactionCreated = (data: {
      transaction: Transaction, 
      type: 'income' | 'expense', 
      amount: number
    }) => {
      console.log('[Overview] Transaction created event received:', data);
      
      // Add new transaction to local state if not already there
      if (data.transaction) {
        setTransactions(prev => {
          // Check if transaction already exists in our list
          const exists = prev.some(t => 
            (t.id && t.id === data.transaction.id) || 
            (t._id && t._id === data.transaction._id)
          );
          
          if (exists) {
            return prev; // Already exists, don't add duplicate
          } else {
            return [data.transaction, ...prev]; // Add to start of list
          }
        });
        
        // Update financialData immediately
        setFinancialData(prevData => {
          const currentIncome = data.type === 'income' 
            ? prevData.income + data.amount 
            : prevData.income;
            
          const currentExpenses = data.type === 'expense' 
            ? prevData.expenses + data.amount 
            : prevData.expenses;
            
          const currentSavings = Math.max(0, currentIncome - currentExpenses);
          const currentBalance = totalAssets > 0 
            ? (data.type === 'income' ? totalAssets + data.amount : totalAssets - data.amount)
            : (currentIncome - currentExpenses);
            
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
      }
    };
    
    // Handler for transaction updates
    const handleTransactionUpdated = (data: {
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
        
        // Update financial data based on the change
        setFinancialData(prevData => {
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
          
          return {
            ...prevData,
            income: currentIncome,
            expenses: currentExpenses,
            savings: currentSavings,
            balance: totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses), 
          };
        });
        
        // Refresh accounts data
        fetchAccounts();
      }
    };
    
    // Import the event bus safely
    const importAndSetupListeners = () => {
      try {
        console.log('[Overview] Loading TransactionEventBus');
        
        // Since we imported at the top of the file, use it directly
        console.log('[Overview] TransactionEventBus loaded:', EventBus ? 'SUCCESS' : 'FAILED');
        
        // Register for events
        unsubscribeCreated = EventBus.on('transaction:created', handleTransactionCreated);
        unsubscribeUpdated = EventBus.on('transaction:updated', handleTransactionUpdated);
        
        // Create handlers for deletion
        const handleDeletedTransaction = (data: {
          transaction: Transaction, 
          type: 'income' | 'expense', 
          amount: number, 
          permanent: boolean
        }) => {
          console.log('[Overview] Transaction deleted event received:', data);
          
          if (data.transaction) {
            // For permanent delete, remove from our state
            if (data.permanent) {
              setTransactions(prev => prev.filter(t => t.id !== data.transaction.id));
            } 
            // For soft delete, mark as deleted
            else {
              setTransactions(prev => prev.map(t => 
                t.id === data.transaction.id ? { ...t, isDeleted: true } : t
              ));
            }
            
            // Update financial data
            setFinancialData(prevData => {
              // Remove this transaction from income or expenses totals
              const currentIncome = data.type === 'income' 
                ? prevData.income - data.amount 
                : prevData.income;
                
              const currentExpenses = data.type === 'expense' 
                ? prevData.expenses - data.amount 
                : prevData.expenses;
                
              const currentSavings = Math.max(0, currentIncome - currentExpenses);
              
              return {
                ...prevData,
                income: currentIncome,
                expenses: currentExpenses,
                savings: currentSavings,
                balance: totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses),
              };
            });
            
            // Refresh accounts
            fetchAccounts();
          }
        };
        
        // Handler for restored transactions
        const handleRestoredTransaction = (data: {
          transaction: Transaction, 
          type: 'income' | 'expense', 
          amount: number
        }) => {
          console.log('[Overview] Transaction restored event received:', data);
          
          if (data.transaction) {
            // Update transaction in our state (mark as not deleted)
            setTransactions(prev => prev.map(t => 
              t.id === data.transaction.id ? { ...data.transaction, isDeleted: false } : t
            ));
            
            // Update financial data
            setFinancialData(prevData => {
              // Add this transaction back to income or expenses totals
              const currentIncome = data.type === 'income' 
                ? prevData.income + data.amount 
                : prevData.income;
                
              const currentExpenses = data.type === 'expense' 
                ? prevData.expenses + data.amount 
                : prevData.expenses;
                
              const currentSavings = Math.max(0, currentIncome - currentExpenses);
              
              return {
                ...prevData,
                income: currentIncome,
                expenses: currentExpenses,
                savings: currentSavings,
                balance: totalAssets > 0 ? totalAssets : (currentIncome - currentExpenses),
              };
            });
            
            // Refresh accounts data
            fetchAccounts();
          }
        };
        
        // Register deletion handlers
        unsubscribeDeleted = EventBus.on('transaction:softDeleted', 
          (data: {transaction: Transaction, type: 'income' | 'expense', amount: number}) => 
            handleDeletedTransaction({ ...data, permanent: false }));
          
        EventBus.on('transaction:permanentlyDeleted', 
          (data: {transaction: Transaction, type: 'income' | 'expense', amount: number}) => 
            handleDeletedTransaction({ ...data, permanent: true }));
        
        // Register restore handler
        unsubscribeRestored = EventBus.on('transaction:restored', handleRestoredTransaction);
        
        console.log('[Overview] Successfully registered all transaction event handlers');
      } catch (error) {
        console.error('[Overview] Error setting up transaction event listeners:', error);
      }
    };
    
    // Setup listeners immediately
    importAndSetupListeners();
    
    // Clean up subscriptions
    return () => {
      console.log('[Overview] Cleaning up transaction event listeners');
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeRestored();
    };
  }, [totalAssets, fetchAccounts]);

  // Re-fetch transactions when there's a transaction error
  useEffect(() => {
    if (transactionsError) {
      console.log("Transaction error detected, will retry fetch in 5 seconds");
      const timer = setTimeout(() => {
        fetchTransactions();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [transactionsError]);

  // Handle opening transaction modal for editing
  const handleEditTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id && !t.isDeleted);
    if (!transaction) return;
    
    setCurrentTransactionType(transaction.type as 'income' | 'expense');
    setCurrentTransactionId(id);
    
    setTransactionAmount(Math.abs(transaction.amount).toString());
    setTransactionTitle(transaction.title || '');
    setTransactionCategory(typeof transaction.category === 'string' ? transaction.category : 
      (typeof transaction.category === 'object' && transaction.category && 'name' in transaction.category) ? 
        transaction.category.name : '');
    setTransactionDescription(transaction.description || '');
    setTransactionDate(transaction.date);
    setTransactionAccount(typeof transaction.account === 'string' ? transaction.account : 
      (typeof transaction.account === 'object' && transaction.account && 'id' in transaction.account) ? 
        String(transaction.account.id) : '');
    
    setFormErrors({});
    setShowEditModal(true);
  };

  // Handle initiating delete transaction process
  const handleDeleteTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };
  
  // Handle soft delete (mark as deleted but don't remove) - Refactored
  const handleSoftDelete = (id: number, isSoftDeleted: boolean) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction || !isSoftDeleted) return; // Only handle soft-deleting here

    // Get transaction details for event and potential rollback
    const amount = Math.abs(transaction.amount);
    const type = transaction.type;

    // Update UI optimistically
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isDeleted: true } : t
    ));

    // Perform the API call for soft delete
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
          EventBus.emit('transaction:softDeleted', {
            transaction,
            type,
            amount
          });
          
          // Toast completely removed to fix duplication issues
          /* 
          toast("Transaction deleted", {
            description: `${transaction.title} has been moved to trash.`,
            position: "bottom-right",
            action: {
              label: "Undo",
              onClick: () => handleRestoreTransaction(id) 
            },
            id: `soft-delete-${id}`,
          });
          */
        }
      })
      .catch(error => {
        console.error("API Error during soft delete:", error);
        // Revert UI state on API error
        setTransactions(prev => prev.map(t => 
          t.id === id ? { ...t, isDeleted: false } : t
        ));
        toast.error("Failed to delete transaction", {
          description: error instanceof Error ? error.message : "An API error occurred",
          position: "bottom-right"
        });
      });
  };
  
  // Handle restoring a transaction - New Function
  const handleRestoreTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Get transaction details for event
    const amount = Math.abs(transaction.amount);
    const type = transaction.type;

    // Update UI optimistically
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isDeleted: false } : t
    ));

    // Make API call to restore the transaction
    apiService.restoreTransaction(transaction._id?.toString() || transaction.id.toString())
      .then(response => {
        if (!response.success) {
          console.error("Failed to restore transaction:", response.message);
          // Revert UI state if API call failed
          setTransactions(prev => prev.map(t => 
            t.id === id ? { ...t, isDeleted: true } : t
          ));
          toast.error("Failed to restore transaction", {
            description: response.message,
            position: "bottom-right"
          });
        } else {
          // Emit event to notify other components
          EventBus.emit('transaction:restored', {
            // Use response data if available, otherwise original transaction
            transaction: response.data || transaction, 
            type,
            amount
          });
          
          // Success toast
          toast.success("Transaction restored", {
            description: `${transaction.title} has been restored successfully.`,
            position: "bottom-right",
            id: `restore-${id}`, // Use unique ID
          });
          
          // If we got an updated transaction object from the server, update it in our state
          if (response.data) {
            setTransactions(prev => prev.map(t => 
              // Ensure the updated data conforms to the Transaction type
              t.id === id ? {...(response.data as Transaction), id} : t
            ));
          }
        }
      })
      .catch(error => {
        console.error("API Error during restore:", error);
        // Revert UI state on API error
        setTransactions(prev => prev.map(t => 
          t.id === id ? { ...t, isDeleted: true } : t
        ));
        toast.error("Failed to restore transaction", {
          description: error instanceof Error ? error.message : "An API error occurred",
          position: "bottom-right"
        });
      });
  };
  
  // Export the function to fix the unused warning
  // Use type assertion to avoid TS errors when adding to window object
  ((window as unknown) as { handleRestoreTransactionFromOverview: (id: number) => void })
    .handleRestoreTransactionFromOverview = handleRestoreTransaction;
  
  // Handle permanent deletion - Refactored
  const handlePermanentDelete = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    if (deletingTransactionIds.includes(id)) return;
    setDeletingTransactionIds(prev => [...prev, id]);
    
    // Get details for event and potential rollback
    const amount = Math.abs(transaction.amount);
    const type = transaction.type;
    const originalTransactions = [...transactions]; // Keep a copy for rollback
    
    // Remove from array optimistically
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // Make the API call to permanently delete
    apiService.permanentDeleteTransaction(transaction._id?.toString() || transaction.id.toString())
      .then(response => {
        if (!response.success) {
          console.error("Failed to permanently delete transaction:", response.message);
          // If API call failed, revert the state
          setTransactions(originalTransactions);
          toast.error("Failed to delete transaction", {
            description: response.message,
            position: "bottom-right"
          });
        } else {
          // Emit event to notify other components
          EventBus.emit('transaction:permanentlyDeleted', {
            transaction,
            type,
            amount
          });
          // Toast is handled by the dialog component
        }
      })
      .catch(error => {
        console.error("API Error during permanent delete:", error);
        // Revert state on API error
        setTransactions(originalTransactions);
        toast.error("Failed to delete transaction", {
          description: error instanceof Error ? error.message : "An API error occurred",
          position: "bottom-right"
        });
      })
      .finally(() => {
        // Always remove from deleting set and close dialog
        setShowDeleteDialog(false);
        setDeletingTransactionIds(prev => prev.filter(item => item !== id));
      });
  };

  // Navigate to transactions page
  const handleViewAllTransactions = () => {
    navigate('/dashboard/transactions');
  };

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
                    value={`$${financialData.balance.toLocaleString()}`}
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
                    value={`$${financialData.income.toLocaleString()}`}
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
                    value={`$${financialData.expenses.toLocaleString()}`}
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
                value={`$${financialData.balance.toLocaleString()}`}
                icon={Wallet}
                color="green"
                period="Total assets value"
                percentage={financialData.balancePercentage}
              />
            </motion.div>

            <motion.div {...slideUp} transition={{ delay: 0.15, duration: 0.3 }}>
              <StatCard
                title="Income"
                value={`$${financialData.income.toLocaleString()}`}
                icon={ArrowUpRight}
                color="blue"
                period="Last 30 days"
                percentage={financialData.incomePercentage}
              />
            </motion.div>

            <motion.div {...slideUp} transition={{ delay: 0.2, duration: 0.3 }}>
              <StatCard
                title="Expenses"
                value={`$${financialData.expenses.toLocaleString()}`}
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
            {transactions.filter(t => !t.isDeleted).length === 0 && !isLoadingTransactions && assetTransfers.length === 0 ? (
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
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isLoading={isLoadingTransactions || isLoadingTransfers}
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
            {transactions.filter(t => !t.isDeleted).length === 0 && !isLoadingTransactions && assetTransfers.length === 0 ? (
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
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isLoading={isLoadingTransactions || isLoadingTransfers}
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
          isLoadingAccounts={isLoadingAccounts}
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
          onClose={() => setShowEditModal(false)}
          onSubmit={() => {
            if (!validateForm()) return;
            
            // Get original transaction for comparison
            const originalTransaction = transactions.find(t => t.id === currentTransactionId);
            if (!originalTransaction) return;
            
            // Get the values for calculation
            const newAmount = parseFloat(transactionAmount);
            const oldAmount = Math.abs(originalTransaction.amount);
            const oldType = originalTransaction.type;
            
            // Determine if there's a type change for balance calculations
            const typeChanged = currentTransactionType !== oldType;
            
            // Update transaction in local state
            setTransactions(prev => prev.map(t => {
              if (t.id === currentTransactionId) {
                const finalAmount = currentTransactionType === "expense" 
                  ? -Math.abs(newAmount) 
                  : Math.abs(newAmount);
                
                return {
                  ...t,
                  title: transactionTitle,
                  amount: finalAmount,
                  type: currentTransactionType,
                  category: transactionCategory,
                  date: transactionDate,
                  description: transactionDescription,
                  account: transactionAccount
                };
              }
              return t;
            }));
            
            // Update financial data immediately
            setFinancialData(prevData => {
              let currentIncome = prevData.income;
              let currentExpenses = prevData.expenses;
              
              // Handle income/expense type changes
              if (typeChanged) {
                // If original was income and now expense, remove from income, add to expense
                if (oldType === 'income' && currentTransactionType === 'expense') {
                  currentIncome -= oldAmount;
                  currentExpenses += newAmount;
                }
                // If original was expense and now income, remove from expense, add to income
                else if (oldType === 'expense' && currentTransactionType === 'income') {
                  currentExpenses -= oldAmount;
                  currentIncome += newAmount;
                }
              } 
              // No type change, just update amount
              else {
                // Update income amount
                if (currentTransactionType === 'income') {
                  currentIncome = prevData.income - oldAmount + newAmount;
                }
                // Update expense amount
                else {
                  currentExpenses = prevData.expenses - oldAmount + newAmount;
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
              description: `${transactionTitle} has been updated successfully.`,
              position: "bottom-right"
            });
            
            // Close modal
            setShowEditModal(false);
          }}
          onAmountChange={handleAmountChange}
          onTitleChange={(value: string) => setTransactionTitle(value)}
          onCategoryChange={(value: string) => setTransactionCategory(value)}
          onDescriptionChange={(value: string) => setTransactionDescription(value)}
          onDateChange={(value: string) => setTransactionDate(value)}
          onAccountChange={(value: string) => setTransactionAccount(value)}
          accounts={accounts}
          isLoadingAccounts={isLoadingAccounts}
        />
        
        {/* Delete Transaction Dialog */}
        {transactionToDelete && (
          <DeleteTransactionDialog
            transaction={transactionToDelete}
            isOpen={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={handlePermanentDelete}
            onSoftDelete={handleSoftDelete}
          />
        )}
      </div>
    </div>
  );
}
