import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";
import {
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowDownRight,
  Calendar,
  CreditCard,
  HelpCircle,
  Building2,
  Wallet,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Utensils,
  Home,
  Briefcase,
  Plane,
  Car,
  Coffee,
  Gift,
  BookOpen,
  Activity,
  Zap,
  Wifi,
  Pencil
} from "lucide-react";

// Define type for Category object if it's not already defined
interface CategoryObject {
  _id?: string;
  id?: string | number;
  name: string;
  type?: string;
  color?: string;
}

// Define type for Account object if it's not already defined
interface AccountObject {
  _id?: string;
  id?: string | number;
  name: string;
  type: string;
  balance?: number;
  isDeleted?: boolean;
}

// Export the Transaction interface
export interface Transaction {
  id: number;
  _id?: string;  // Add MongoDB ObjectId field
  title: string;
  amount: number;
  date: string;
  category: string | CategoryObject;
  description?: string;
  account?: string | AccountObject;
  type?: 'income' | 'expense';
  status?: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  recipientOrSender?: string;
  tags?: string[];
  formattedAmount?: string;
  isDeleted?: boolean;
  createdAt?: string;  // Add createdAt timestamp field
  updatedAt?: string;  // Add updatedAt timestamp field for completeness
  // New properties for AssetTransfer
  transferType?: 'transfer';
  fromAsset?: string;
  toAsset?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  onEditTransaction?: (id: number) => void;
  onDeleteTransaction?: (id: number) => void;
  className?: string;
  hideDate?: boolean;
  linkable?: boolean;
}

// Function to limit words
const limitWordsText = (text: string, limit: number): string => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + '...';
};

// Export the TransactionItem component as a named export
const TransactionItem = ({
  transaction,
  onEditTransaction,
  onDeleteTransaction,
  className,
  hideDate = false,
  linkable = false
}: TransactionItemProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { formatCurrency } = useCurrencyFormat();
  const [resolvedCategory, setResolvedCategory] = useState<CategoryObject | null>(null);
  const [resolvedAccount, setResolvedAccount] = useState<AccountObject | null>(null);
  
  // Determine if this is income, expense, or transfer
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.transferType === 'transfer';
  
  // Effect to dynamically resolve category if it's a MongoDB ID
  useEffect(() => {
    const resolveCategoryIfNeeded = async () => {
      // Don't do anything if category is already an object or not a MongoDB ID
      if (!transaction.category || 
          (typeof transaction.category === 'object') || 
          (typeof transaction.category === 'string' && !/^[0-9a-f]{24}$/i.test(transaction.category))
      ) {
        return;
      }
      
      console.log(`[TransactionItem] Resolving category ID: ${transaction.category}`);
      
      // Category is a MongoDB ID string
      try {
        const categoryId = transaction.category as string;
        
        // First try direct API lookup
        try {
          const response = await fetch(`/api/categories/${categoryId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log(`[TransactionItem] Found category via API: ${data.data.name}`);
              const categoryData = {
                _id: data.data._id || data.data.id,
                name: data.data.name,
                type: data.data.type || (isIncome ? "income" : "expense")
              };
              localStorage.setItem(`category_${categoryId}`, JSON.stringify(categoryData));
              setResolvedCategory(categoryData);
              return;
            }
          }
        } catch {
          console.log(`[TransactionItem] No API for category, using cache`);
        }
        
        // Try to load from global cache in localStorage
        try {
          const allCategories = JSON.parse(localStorage.getItem('user_categories') || '[]');
          console.log(`[TransactionItem] Found ${allCategories.length} categories in cache`);
          
          const matchedCategory = allCategories.find((cat: CategoryObject) => 
            cat._id === categoryId || cat.id === categoryId
          );
          
          if (matchedCategory) {
            console.log(`[TransactionItem] Found matching category in cache: ${matchedCategory.name}`);
            const categoryData = {
              _id: matchedCategory._id || matchedCategory.id,
              name: matchedCategory.name,
              type: matchedCategory.type || (isIncome ? "income" : "expense")
            };
            
            // Cache in localStorage for future use
            localStorage.setItem(`category_${categoryId}`, JSON.stringify(categoryData));
            setResolvedCategory(categoryData);
            return;
          }
        } catch (error) {
          console.error(`[TransactionItem] Error accessing category cache:`, error);
        }

        // Try to fetch from item-specific cache next
        try {
          const cachedCategory = localStorage.getItem(`category_${categoryId}`);
          if (cachedCategory) {
            console.log(`[TransactionItem] Found category in item cache`);
            setResolvedCategory(JSON.parse(cachedCategory));
            return;
          }
        } catch (error) {
          console.error(`[TransactionItem] Error accessing item category cache:`, error);
        }
        
        // Emergency resolution - try API call if available or use fallback mapping
        
        // Define fallback category mappings with exact ID matches
        const knownCategories: Record<string, string> = {
          "67e9c4c9fa1cb4f1fd63677c": "Salary",
          "67f0cec46759984a6abf6ad3": "Food & Dining",
          "67f0cec46759984a6abf6ad4": "Shopping",
          "67f0cec46759984a6abf6ad5": "Transportation",
          "67f0cec46759984a6abf6ad6": "Housing",
          "67f0cec46759984a6abf6ad7": "Utilities",
          "67f0cec46759984a6abf6ad8": "Entertainment",
          "67f0cec46759984a6abf6ad9": "Health & Medical",
          "67f0cec46759984a6abf6ada": "Personal Care",
          "67f0cec46759984a6abf6adb": "Education",
          "67f0cec46759984a6abf6adc": "Travel",
          "67f0cec46759984a6abf6add": "Salary & Income",
          "67f0cec46759984a6abf6ade": "Investments",
          "67f0cec46759984a6abf6adf": "Gifts & Donations",
          "67f0ced36759984a6abf6ad7": "Salary" // Added specific mapping from user request
        };
        
        // Check if we have a known mapping for this ID
        const categoryName = knownCategories[categoryId] || "Miscellaneous";
        console.log(`[TransactionItem] Using hardcoded category mapping: ${categoryId} -> ${categoryName}`);
        
        const categoryData = {
          _id: categoryId,
          name: categoryName,
          type: isIncome ? "income" : "expense"
        };
        
        // Cache the result in localStorage
        localStorage.setItem(`category_${categoryId}`, JSON.stringify(categoryData));
        
        // Update state
        setResolvedCategory(categoryData);
      } catch (error) {
        console.error("Error resolving category:", error);
      }
    };
    
    resolveCategoryIfNeeded();
  }, [transaction.category, isIncome]);
      
  // Add a similar effect for resolving account IDs
  useEffect(() => {
    const resolveAccountIfNeeded = async () => {
      // Don't do anything if account is already an object or not a MongoDB ID
      if (!transaction.account || 
          (typeof transaction.account === 'object') || 
          (typeof transaction.account === 'string' && !/^[0-9a-f]{24}$/i.test(transaction.account))
      ) {
        return;
      }
      
      console.log(`[TransactionItem] Resolving account ID: ${transaction.account}`);
      
      // Account is a MongoDB ID string
      try {
        const accountId = transaction.account as string;
        
        // First try direct API lookup 
        try {
          const response = await fetch(`/api/assets/${accountId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log(`[TransactionItem] Found account via API: ${data.data.name}`);
              const accountData = {
                _id: data.data._id || data.data.id,
                id: data.data._id || data.data.id,
                name: data.data.name,
                type: data.data.type || "bank",
                balance: data.data.balance || 0,
                isDeleted: data.data.isDeleted || false
              };
              localStorage.setItem(`account_${accountId}`, JSON.stringify(accountData));
              setResolvedAccount(accountData);
              return;
            }
          }
        } catch {
          console.log(`[TransactionItem] No API for account, using cache`);
        }
        
        // Try to load from global cache in localStorage
        try {
          const allAssets = JSON.parse(localStorage.getItem('user_assets') || '[]');
          console.log(`[TransactionItem] Found ${allAssets.length} assets in cache`);
          console.log(`[TransactionItem] Assets:`, allAssets);
          
          const matchedAsset = allAssets.find((asset: AccountObject) => 
            (asset._id === accountId || asset.id === accountId)
          );
          
          if (matchedAsset) {
            console.log(`[TransactionItem] Found matching account in cache: ${matchedAsset.name}`);
            const accountData = {
              _id: matchedAsset._id || matchedAsset.id,
              id: matchedAsset._id || matchedAsset.id,
              name: matchedAsset.name,
              type: matchedAsset.type || "bank",
              balance: matchedAsset.balance || 0,
              isDeleted: matchedAsset.isDeleted || false
            };
            
            // Cache in localStorage for future use
            localStorage.setItem(`account_${accountId}`, JSON.stringify(accountData));
            setResolvedAccount(accountData);
            return;
          }
        } catch (error) {
          console.error(`[TransactionItem] Error accessing account cache:`, error);
        }

        // Try to fetch from item-specific cache next
        try {
          const cachedAccount = localStorage.getItem(`account_${accountId}`);
          if (cachedAccount) {
            console.log(`[TransactionItem] Found account in item cache`);
            setResolvedAccount(JSON.parse(cachedAccount));
            return;
          }
        } catch (error) {
          console.error(`[TransactionItem] Error accessing item account cache:`, error);
        }
        
        // Emergency resolution - try API call if available or use fallback mapping
        
        // Define fallback account mappings with exact ID matches
        const knownAccounts: Record<string, {name: string, type: string}> = {
          "67f0ced36759984a6abf6ad7": { name: "Tabungan", type: "bank" },
          "67f0cec46759984a6abf6ad3": { name: "Checking Account", type: "bank" },
          "67f0cec46759984a6abf6ad4": { name: "Savings Account", type: "bank" },
          "67f0cec46759984a6abf6ad5": { name: "Cash Wallet", type: "cash" },
          "67f0cec46759984a6abf6ad6": { name: "Credit Card", type: "credit" }
        };
        
        // Default account properties
        let accountName = "Unknown Account";
        let accountType = "bank";
        
        // Check if we have a known mapping for this ID
        const knownAccount = knownAccounts[accountId];
        if (knownAccount) {
          accountName = knownAccount.name;
          accountType = knownAccount.type;
          console.log(`[TransactionItem] Using hardcoded account mapping: ${accountId} -> ${accountName} (${accountType})`);
        }
        
        const accountData = {
          _id: accountId,
          id: accountId,
          name: accountName,
          type: accountType,
          balance: 0,
          isDeleted: false
        };
        
        // Cache the result in localStorage
        localStorage.setItem(`account_${accountId}`, JSON.stringify(accountData));
        
        // Update state
        setResolvedAccount(accountData);
      } catch (error) {
        console.error("Error resolving account:", error);
      }
    };
    
    resolveAccountIfNeeded();
  }, [transaction.account]);
  
  // Get category display name
  const getCategoryDisplayName = (): string => {
    // If we resolved a category from an ID, use that
    if (resolvedCategory) {
      return resolvedCategory.name;
    }
    
    // Otherwise handle it normally
    if (typeof transaction.category === 'object' && transaction.category !== null) {
      return transaction.category.name || 'Uncategorized';
    } else if (typeof transaction.category === 'string') {
      // Check if it looks like a MongoDB ObjectId (24 chars)
      const isMongoId = /^[0-9a-f]{24}$/i.test(transaction.category);
      if (isMongoId) {
        // We're still loading
        return 'Loading...';
      } else {
    return transaction.category;
      }
    } else {
      return 'Uncategorized';
    }
  };
  
  // Update getAccountDisplay to handle deleted accounts
  const getAccountDisplay = (account: AccountObject | string | null | undefined): React.ReactNode => {
    if (!account) {
      return <span className="text-muted-foreground">No account</span>;
    }
    
    // First check if we have a resolved account for a MongoDB ID
    if (typeof account === 'string' && /^[0-9a-f]{24}$/i.test(account) && resolvedAccount) {
      if (resolvedAccount._id === account || resolvedAccount.id === account) {
        if (resolvedAccount.isDeleted) {
          return (
            <span className="flex items-center">
              <span className="text-muted-foreground/70 line-through mr-1">{resolvedAccount.name}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1 py-0 bg-destructive/10 text-destructive border-destructive/20">Deleted</Badge>
            </span>
          );
        }
        return resolvedAccount.name;
      }
    }
    
    // If no resolved account, handle normally
    if (typeof account === 'object') {
      if (account.isDeleted) {
        return (
          <span className="flex items-center">
            <span className="text-muted-foreground/70 line-through mr-1">{account.name}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1 py-0 bg-destructive/10 text-destructive border-destructive/20">Deleted</Badge>
          </span>
        );
      }
      return account.name;
    }
    
    // If it's a string and looks like a MongoDB ID but we haven't resolved it yet
    if (typeof account === 'string' && /^[0-9a-f]{24}$/i.test(account)) {
      return "Loading...";
    }
    
    return account;
  };
  
  // Format amount
  const formattedAmount = formatCurrency(Math.abs(transaction.amount));
  
  // Format date in a readable way
  const formattedDate = (() => {
    try {
      const date = new Date(transaction.date);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return transaction.date;
    }
  })();
  
  // Format full date in a readable way
  const formattedFullDate = (() => {
    try {
      const date = new Date(transaction.date);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error("Error formatting full date:", error);
      return transaction.date;
    }
  })();
  
  // Limit description to 3 words max
  const limitedDescription = limitWordsText(transaction.title, 3);
  
  // Get category-based icon
  const getCategoryIcon = () => {
    if (isTransfer) {
      return <CreditCard className="h-6 w-6 text-white" />;
    }
    
    // Get the category name (either from resolved object or directly)
    let categoryName = '';
    if (resolvedCategory) {
      categoryName = resolvedCategory.name;
    } else if (typeof transaction.category === 'object' && transaction.category !== null) {
      categoryName = transaction.category.name || '';
    } else if (typeof transaction.category === 'string' && !/^[0-9a-f]{24}$/i.test(transaction.category)) {
      categoryName = transaction.category;
    }
    
    const categoryLower = categoryName.toLowerCase();
    
    // Income categories
    if (isIncome) {
      if (categoryLower.includes('salary') || categoryLower.includes('wage')) {
        return <Briefcase className="h-6 w-6 text-white" />;
      } else if (categoryLower.includes('invest') || categoryLower.includes('dividend')) {
        return <TrendingUp className="h-6 w-6 text-white" />;
      } else if (categoryLower.includes('gift')) {
        return <Gift className="h-6 w-6 text-white" />;
      } else if (categoryLower.includes('refund')) {
        return <DollarSign className="h-6 w-6 text-white" />;
      }
      return <TrendingUp className="h-6 w-6 text-white" />;
    } 
    
    // Expense categories
    if (categoryLower.includes('food') || categoryLower.includes('dining') || categoryLower.includes('restaurant') || categoryLower.includes('grocery')) {
      return <Utensils className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('shop') || categoryLower.includes('cloth')) {
      return <ShoppingBag className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('home') || categoryLower.includes('rent') || categoryLower.includes('house')) {
      return <Home className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('trans') || categoryLower.includes('car') || categoryLower.includes('gas')) {
      return <Car className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('travel') || categoryLower.includes('vacation') || categoryLower.includes('holiday')) {
      return <Plane className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('coffee') || categoryLower.includes('cafe')) {
      return <Coffee className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('gift')) {
      return <Gift className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('edu') || categoryLower.includes('book') || categoryLower.includes('school')) {
      return <BookOpen className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('doctor')) {
      return <Activity className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('util') || categoryLower.includes('electric')) {
      return <Zap className="h-6 w-6 text-white" />;
    } else if (categoryLower.includes('wifi') || categoryLower.includes('internet') || categoryLower.includes('phone')) {
      return <Wifi className="h-6 w-6 text-white" />;
    }
    
    // Default to trending down for other expenses
    return <TrendingDown className="h-6 w-6 text-white" />;
  };
  
  // Get card icon based on category
  const getCardIcon = () => {
    if (isTransfer) {
      return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    } 
    
    // Get the category name (either from resolved object or directly)
    let categoryName = '';
    if (resolvedCategory) {
      categoryName = resolvedCategory.name;
    } else if (typeof transaction.category === 'object' && transaction.category !== null) {
      categoryName = transaction.category.name || '';
    } else if (typeof transaction.category === 'string' && !/^[0-9a-f]{24}$/i.test(transaction.category)) {
      categoryName = transaction.category;
    }
    
    const categoryLower = categoryName.toLowerCase();
    
    // Income categories
    if (isIncome) {
      if (categoryLower.includes('salary') || categoryLower.includes('wage')) {
        return <Briefcase className={`h-4 w-4 text-green-600 dark:text-green-400`} />;
      } else if (categoryLower.includes('invest') || categoryLower.includes('dividend')) {
        return <TrendingUp className={`h-4 w-4 text-green-600 dark:text-green-400`} />;
      } else if (categoryLower.includes('gift')) {
        return <Gift className={`h-4 w-4 text-green-600 dark:text-green-400`} />;
      } else if (categoryLower.includes('refund')) {
        return <DollarSign className={`h-4 w-4 text-green-600 dark:text-green-400`} />;
      }
      return <TrendingUp className={`h-4 w-4 text-green-600 dark:text-green-400`} />;
    } 
    
    // Expense categories
    if (categoryLower.includes('food') || categoryLower.includes('dining') || categoryLower.includes('restaurant') || categoryLower.includes('grocery')) {
      return <Utensils className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('shop') || categoryLower.includes('cloth')) {
      return <ShoppingBag className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('home') || categoryLower.includes('rent') || categoryLower.includes('house')) {
      return <Home className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('trans') || categoryLower.includes('car') || categoryLower.includes('gas')) {
      return <Car className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('travel') || categoryLower.includes('vacation') || categoryLower.includes('holiday')) {
      return <Plane className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('coffee') || categoryLower.includes('cafe')) {
      return <Coffee className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('gift')) {
      return <Gift className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('edu') || categoryLower.includes('book') || categoryLower.includes('school')) {
      return <BookOpen className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('doctor')) {
      return <Activity className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('util') || categoryLower.includes('electric')) {
      return <Zap className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    } else if (categoryLower.includes('wifi') || categoryLower.includes('internet') || categoryLower.includes('phone')) {
      return <Wifi className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
    }
    
    // Default to trending down for other expenses
    return <TrendingDown className={`h-4 w-4 text-red-600 dark:text-red-400`} />;
  };
  
  // Get account icon based on account name or type
  const getAccountIcon = (account: AccountObject | string | null | undefined) => {
    if (!account) {
      return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    }
    
    let accountType = '';
    let accountName = '';
    
    if (typeof account === 'object') {
      accountType = account.type || '';
      accountName = account.name || '';
    } else {
      accountName = account;
    }
    
    const lowerName = accountName.toLowerCase();
    
    if (lowerName.includes('cash') || accountType.toLowerCase().includes('cash')) {
      return <Wallet className="h-5 w-5 text-green-500" />;
    } else if (lowerName.includes('bank') || accountType.toLowerCase().includes('bank')) {
      return <Building2 className="h-5 w-5 text-blue-500" />;
    }
    
    return <CreditCard className="h-5 w-5 text-muted-foreground" />;
  };
  
  // Safe click handler for transaction details
  const handleTransactionClick = (e: React.MouseEvent) => {
    // If the component is linkable, let the Link handle navigation
    if (linkable) return;
    
    e.stopPropagation();
    
    // If the transaction is deleted, we shouldn't show details
    if (transaction.isDeleted) return;
    
    // Always open details when clicked anywhere on the transaction item
    setDetailsOpen(true);
  };
  
  // Get appropriate color class for transaction type
  const getTransactionColor = () => {
    if (isTransfer) {
      return "bg-blue-100 dark:bg-blue-900/30";
    } else {
      return isIncome 
        ? "bg-green-100 dark:bg-green-900/30" 
        : "bg-red-100 dark:bg-red-900/30";
    }
  };
  
  // Get appropriate text color for amount
  const getAmountColor = () => {
    if (isTransfer) {
      return "text-blue-600 dark:text-blue-400"; 
    } else {
      return isIncome 
        ? "text-green-600 dark:text-green-400" 
        : "text-red-600 dark:text-red-400";
    }
  };
  
  // Get appropriate badge color
  const getTypeBadgeColor = () => {
    if (isTransfer) {
      return "bg-blue-100/60 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    } else {
      return isIncome 
        ? "bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
        : "bg-red-100/60 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
  };
  
  // Get header color for details dialog
  const getHeaderColor = () => {
    if (isTransfer) {
      return "bg-blue-600"; 
    } else {
      return isIncome 
        ? "bg-green-600"
        : "bg-red-600";
    }
  };
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { 
      scale: 1.01,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      backgroundColor: "rgba(200, 200, 200, 0.15)"
    }
  };
  
  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }
  };
  
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (linkable && !transaction.isDeleted) {
      // Use mongoDB _id as the primary ID, with client id as fallback
      const transactionId = transaction._id || transaction.id;
      
      return (
        <Link 
          to={`/dashboard/transactions?id=${transactionId}`}
          className="w-full"
        >
          <Card className="p-4 hover:bg-accent/5 transition-colors">
            {children}
          </Card>
        </Link>
      );
    }
    
    return (
      <Card className="p-4 hover:bg-accent/5 transition-colors">
        {children}
      </Card>
    );
  };
  
  return (
    <>
      <motion.div
        className={cn("w-full", className)}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onClick={handleTransactionClick}
        layout
      >
        <CardWrapper>
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full shrink-0 flex items-center justify-center",
                getTransactionColor()
              )}>
                {getCardIcon()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">{limitedDescription}</p>
                  {transaction.title.split(' ').length > 3 && (
                    <span className="text-xs text-muted-foreground">...</span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="mr-1">•</span>
                    {getCategoryDisplayName()}
                  </div>
                  
                  {transaction.account && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="mr-1">•</span>
                      <span className="truncate max-w-[80px]">
                        {getAccountDisplay(transaction.account)}
                      </span>
                    </div>
                  )}
                  
                  {!hideDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="mr-1">•</span>
                      {formattedDate}
                    </div>
                  )}
                  
                  {transaction.status === 'pending' && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-yellow-100/60 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50">
                      Pending
                    </Badge>
                  )}
                  
                  {transaction.status === 'failed' && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-red-100/60 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50">
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={cn(
                "font-semibold text-sm tabular-nums",
                getAmountColor()
              )}>
                {isTransfer ? '↔ ' : isIncome ? '+ ' : '- '}{formattedAmount}
              </span>
              <span className={cn(
                "text-[10px] mt-1 px-1.5 py-0.5 rounded-sm",
                getTypeBadgeColor()
              )}>
                {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
              </span>
            </div>
          </div>
        </CardWrapper>
      </motion.div>
      
      {!linkable && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-md w-[90vw] p-0 border-border bg-background flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header section */}
            <div className="sticky top-0 z-20 bg-background pt-6 pb-5 px-6 border-b flex flex-col items-center text-center">
              <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
              
              <div className="w-full flex items-center justify-start mb-5">
                <Badge variant="outline" className={cn(
                  "rounded-full px-2 py-1 text-xs uppercase font-medium border",
                  isIncome 
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30" 
                    : isTransfer 
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
                )}>
                  {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
                </Badge>
              </div>
              
              <div className="flex w-full items-start">
                <motion.div 
                  className={cn(
                    "w-14 h-14 rounded-xl shrink-0 flex items-center justify-center mr-4",
                    getHeaderColor(),
                    "shadow-lg"
                  )}
                  initial="initial"
                  animate="animate"
                  variants={iconAnimation}
                >
                  {getCategoryIcon()}
                </motion.div>
                
                <div className="flex flex-col items-start text-left w-full max-w-full overflow-hidden">
                  {/* Transaction title with improved text wrapping */}
                  <h2 className="text-xl font-bold mb-1 break-words w-full" style={{ wordBreak: "break-word", hyphens: "auto" }}>{transaction.title}</h2>
                  
                  {/* Category & Account row */}
                  <div className="flex items-center text-sm text-muted-foreground w-full max-w-full overflow-hidden">
                    <span className="font-medium break-words">{getCategoryDisplayName()}</span>
                    <span className="mx-1.5 flex-shrink-0">•</span>
                    <span className="break-words overflow-hidden" style={{ wordBreak: "break-word" }}>{getAccountDisplay(transaction.account)}</span>
                  </div>
                </div>
              </div>
              
              {/* Amount - larger and more prominent */}
              <div className="w-full flex justify-between items-center mt-6 pt-4 border-t border-border/40">
                <span className="text-sm font-medium text-muted-foreground">Amount</span>
                <p className={cn(
                  "text-2xl font-bold flex items-center",
                  getAmountColor()
                )}>
                  {isTransfer ? '↔ ' : isIncome ? '+ ' : '- '}{formattedAmount}
                </p>
              </div>
            </div>
            
            {/* Main scrollable content */}
            <ScrollArea className="flex-grow">
              <div className="px-6 py-5">
                <motion.div
                  className="pr-4 space-y-5"
                  initial="initial"
                  animate="animate"
                  variants={contentAnimation}
                >
                  {/* Date with card styling */}
                  <div className="bg-muted/30 rounded-lg border border-border/60 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Date</span>
                      </div>
                      <span className="text-foreground">{formattedFullDate}</span>
                    </div>
                  </div>
                  
                  {/* Different display for transfers vs regular transactions */}
                  {isTransfer ? (
                    <div className="bg-muted/30 rounded-lg border border-border/60 p-4 space-y-5">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Transfer Details</h3>
                      
                      {/* Transfer Visual Flow */}
                      <div className="py-2">
                        <div className="flex flex-col items-center justify-between gap-5">
                          {/* From Asset */}
                          <div className="w-full flex items-center p-3 bg-background rounded-md border border-border">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                              <Wallet className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium break-words">{transaction.fromAsset}</div>
                              <div className="text-xs text-muted-foreground">Source Account</div>
                            </div>
                          </div>
                          
                          {/* Arrow Connector */}
                          <div className="flex flex-col items-center justify-center -my-3">
                            <div className="w-0.5 h-4 bg-border"></div>
                            <ArrowDownRight className="h-5 w-5 text-blue-500 rotate-90 my-1" />
                            <div className="w-0.5 h-4 bg-border"></div>
                          </div>
                          
                          {/* To Asset */}
                          <div className="w-full flex items-center p-3 bg-background rounded-md border border-border">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium break-words">{transaction.toAsset}</div>
                              <div className="text-xs text-muted-foreground">Destination Account</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Transfer Type */}
                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Transfer Type</span>
                        </div>
                        <div className="flex items-center">
                          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
                            Internal Transfer
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Account details */}
                      <div className="bg-muted/30 rounded-lg border border-border/60 p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account Details</h3>
                        
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full shrink-0 bg-muted flex items-center justify-center mr-3">
                            {getAccountIcon(transaction.account)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium break-words">{getAccountDisplay(transaction.account)}</div>
                            <div className="text-xs text-muted-foreground">
                              {(typeof transaction.account === 'object' && transaction.account?.type) 
                                ? transaction.account.type
                                : (resolvedAccount?.type || '')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Category details */}
                      <div className="bg-muted/30 rounded-lg border border-border/60 p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Category</h3>
                        
                        <div className="flex items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full shrink-0 flex items-center justify-center mr-3",
                            getTransactionColor()
                          )}>
                            {getCardIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium break-words">{getCategoryDisplayName()}</div>
                            <div className="text-xs text-muted-foreground">
                              {isIncome ? 'Income' : 'Expense'} Category
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Method (if available) */}
                      {transaction.paymentMethod && (
                        <div className="bg-muted/30 rounded-lg border border-border/60 p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Payment Method</span>
                            </div>
                            <span className="text-foreground break-words">{transaction.paymentMethod}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Status (if not completed) */}
                      {transaction.status && transaction.status !== 'completed' && (
                        <div className="bg-muted/30 rounded-lg border border-border/60 p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">Status</span>
                            </div>
                            <Badge variant={transaction.status === 'pending' 
                              ? 'outline' 
                              : 'destructive'
                            } className="capitalize">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Description (if available) */}
                  {transaction.description && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-muted/30 rounded-lg border border-border/60 p-4 w-full max-w-full overflow-hidden"
                    >
                      <div className="space-y-2 w-full max-w-full overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">Description</span>
                        </div>
                        <div className="p-3 rounded-md bg-background border border-border/60 text-foreground/90 text-sm w-full max-w-full overflow-hidden">
                          <p className="whitespace-pre-wrap break-words max-w-full overflow-hidden" 
                             style={{ 
                               overflowWrap: "break-word", 
                               wordWrap: "break-word", 
                               wordBreak: "break-word",
                               hyphens: "auto" 
                             }}>
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Created timestamp if available */}
                  {transaction.createdAt && (
                    <div className="text-xs text-muted-foreground pt-4 flex items-center justify-end">
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      <span>Created: {new Date(transaction.createdAt).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Extra space at the bottom for comfortable scrolling past the fixed footer */}
                  <div className="h-16"></div>
                </motion.div>
              </div>
            </ScrollArea>
            
            {/* Sticky footer with actions */}
            <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm py-4 px-6 shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
              <div className="flex justify-end gap-2">
                {onDeleteTransaction && (
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="gap-1 h-9"
                    onClick={() => {
                      onDeleteTransaction(transaction.id);
                      setDetailsOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Delete
                  </Button>
                )}
                
                {onEditTransaction && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="gap-1 h-9"
                    onClick={() => {
                      onEditTransaction(transaction.id);
                      setDetailsOpen(false);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Only export TransactionItem once 
export { TransactionItem }; 