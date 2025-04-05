import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Fuse from "fuse.js";
import { cn } from "@/lib/utils";
import apiService from "@/services/api";
import { Asset } from "@/types/assets";
import {
  Input
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Search, X, Check, Calendar as CalendarIcon,
  ChevronsUpDown, Info, CreditCard, 
  Briefcase, DollarSign, Gift, Zap, Home,
  Utensils, ShoppingCart, Car, Heart, GraduationCap,
  Plane, Landmark, Laptop, AlertCircle, Tags
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import useCurrencyFormat from '@/hooks/useCurrencyFormat';
import { CurrencyInput } from "@/components/dashboard/transactions/forms/CurrencyInput";

// Define interfaces for types
interface FuseCategoryOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
  type?: string;
  lowerLabel: string;
  normalizedLabel: string;
}

// Define Category interface
interface Category {
  _id?: string;
  id?: string | number;
  name: string;
  type?: string;
  color?: string;
  icon?: string;
}

interface TransactionFormProps {
  type: "income" | "expense";
  transactionAmount: string;
  transactionTitle?: string;
  transactionCategory: string;
  transactionDescription: string;
  transactionDate: string;
  transactionAccount?: string;
  formErrors: {
    amount?: string;
    title?: string;
    category?: string;
    account?: string;
    date?: string;
    description?: string;
  };
  onAmountChange: (value: string) => void;
  onTitleChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAccountChange?: (value: string) => void;
  accounts?: { id?: string; _id?: string; name: string; type: string; balance?: number; }[];
  isLoadingAccounts?: boolean;
}

// Update the globalStyles to also hide CommandList's scrollbar
const globalStyles = `
  /* Custom scrollbar for webkit browsers */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: var(--accent);
    border-radius: 3px;
  }
  
  /* For Firefox */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--accent) transparent;
  }
  
  /* Hide all other scrollbars */
  div[cmdk-list]::-webkit-scrollbar,
  div[role="dialog"] div[role="listbox"]::-webkit-scrollbar,
  .no-scrollbar::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  div[cmdk-list],
  div[role="dialog"] div[role="listbox"],
  .no-scrollbar {
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }
`;

// Selection feedback CSS
const selectionFeedbackCss = `
  .selection-item {
    position: relative;
    overflow: hidden;
  }
  
  .selection-item::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: currentColor;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  
  .selection-item.clicked::after {
    opacity: 0.1;
    animation: ripple 0.4s ease-out;
  }
  
  @keyframes ripple {
    0% { transform: scale(0); opacity: 0.3; }
    100% { transform: scale(2.5); opacity: 0; }
  }
`;

// Add the selection feedback css to the component
const combinedStyles = `${globalStyles}\n${selectionFeedbackCss}`;

/**
 * TransactionForm - A reusable form component for income and expense transactions
 * Features:
 * - Different categories based on transaction type
 * - Form validation
 * - Currency input handling
 * - Title field with character limit
 * - Account selection for better cashflow tracking
 * - Tooltips for guidance
 * - Enhanced date picker with calendar
 * - Smooth animations and transitions
 * - Professional design with consistent spacing
 * - Mobile-friendly layout with truncation for long text
 */
export const TransactionForm = ({
  type,
  transactionAmount,
  transactionTitle = "",
  transactionCategory,
  transactionDescription,
  transactionDate,
  transactionAccount = "",
  formErrors,
  onAmountChange,
  onTitleChange = () => {},
  onCategoryChange,
  onDescriptionChange,
  onDateChange,
  onAccountChange = () => {},
  accounts = [],
  isLoadingAccounts = false,
}: TransactionFormProps) => {
  const { formatCurrency, currencyLocale, currencySymbol } = useCurrencyFormat();
  
  // State for clicked item selection
  const [clickedItemId, setClickedItemId] = useState<string | null>(null);
  
  // State for fetched data
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Get today's date at the start of the day (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // State for adding categories and search
  const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [fuse, setFuseInstance] = useState<Fuse<FuseCategoryOption> | null>(null);
  
  // Helper function to check if a string is a MongoDB ObjectID
  const isMongoId = useCallback((str: string): boolean => {
    if (!str) return false;
    // MongoDB ObjectID: 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(str);
  }, []);

  // Add debug log for the transactionCategory value
  console.log("TransactionForm received transactionCategory:", transactionCategory, 
    "Is MongoDB ID:", transactionCategory ? isMongoId(transactionCategory) : false);
  console.log("TransactionForm received transactionAccount:", transactionAccount,
    "Is MongoDB ID:", transactionAccount ? isMongoId(transactionAccount) : false);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await apiService.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
          console.log("Categories fetched successfully:", response.data);
        } else {
          setCategoriesError(response.message || "Failed to fetch categories");
          console.error("Failed to fetch categories:", response.message);
        }
      } catch (error) {
        setCategoriesError("An error occurred while fetching categories");
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update onCategoryChange to handle MongoDB IDs
  const handleCategoryChange = useCallback((categoryId: string) => {
    console.log("Handling category change to:", categoryId);
    
    // If the ID is a MongoDB ObjectID, check if we have it in our categories list
    if (isMongoId(categoryId)) {
      const foundCategory = categories.find(cat => 
        (cat._id && cat._id === categoryId) || (cat.id && cat.id === categoryId));
      
      if (foundCategory) {
        console.log("Found matching category object:", foundCategory);
        // Pass the full category object to parent
        onCategoryChange(categoryId);
      } else {
        console.log("Category not found in list, passing raw ID");
        onCategoryChange(categoryId);
      }
    } else {
      // Just pass the value as is
      onCategoryChange(categoryId);
    }
  }, [categories, onCategoryChange, isMongoId]);

  // Similar handler for account changes
  const handleAccountChange = useCallback((accountId: string) => {
    console.log("Handling account change to:", accountId);
    
    // If the ID is a MongoDB ObjectID, check if we have it in our accounts list
    if (isMongoId(accountId)) {
      const foundAccount = accounts.find(acc => 
        (acc._id && acc._id === accountId) || (acc.id && acc.id === accountId));
      
      if (foundAccount) {
        console.log("Found matching account object:", foundAccount);
        // Pass the account ID to parent
        onAccountChange(accountId);
      } else {
        console.log("Account not found in list, passing raw ID");
        onAccountChange(accountId);
      }
    } else {
      // Just pass the value as is
      onAccountChange(accountId);
    }
  }, [accounts, onAccountChange, isMongoId]);

  // Process categories once we have them
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    
    console.log("Processing categories:", categories.length);
    
    // Filter categories based on transaction type (income/expense)
    // IMPORTANT FIX: Only show categories matching the current transaction type
    const typeMatchingCategories = categories.filter(category => {
      // Only show categories that match the current transaction type
      return category.type === type;
    });
    
    console.log("CATEGORIES AFTER FILTERING:", typeMatchingCategories, "for type:", type);

    const processedOptions: FuseCategoryOption[] = typeMatchingCategories.map(category => ({
      value: category._id || category.id || '',
      label: category.name,
      icon: category.icon || '',
      color: category.color || '',
      type: category.type || type, // Ensure we have the type
      // Add lowercase version for faster searching
      lowerLabel: category.name.toLowerCase(),
      // Also add a normalized version without spaces
      normalizedLabel: category.name.toLowerCase().replace(/\s+/g, '')
    }));
    
    setCategoryOptions(processedOptions);
    
    // Create Fuse.js instance with better fuzzy searching settings
    const fuseOptions = {
      includeScore: true,
      threshold: 0.6, // Much more lenient threshold to catch more matches
      ignoreLocation: true, // Don't penalize for position in string
      keys: [
        { name: 'label', weight: 2 }, // Give more weight to the full label
        { name: 'lowerLabel', weight: 1.5 },
        { name: 'normalizedLabel', weight: 1 }
      ]
    };
    
    setFuseInstance(new Fuse(processedOptions, fuseOptions));
    
    // Log the available categories for debugging
    console.log("PROCESSED CATEGORY OPTIONS:", processedOptions.map(c => `${c.label} (${c.type})`));
    
    // If transactionCategory is a MongoDB ID, find the corresponding category
    if (transactionCategory && isMongoId(transactionCategory)) {
      console.log("Handling MongoDB Object ID for category:", transactionCategory);
      
      // Find the category in the filtered list
      const matchingCategory = typeMatchingCategories.find(cat => 
        (cat._id && cat._id === transactionCategory) || (cat.id && cat.id === transactionCategory));
      
      if (matchingCategory) {
        console.log("Found matching category:", matchingCategory.name);
      } else {
        console.log("No matching category found for ID:", transactionCategory);
      }
    }
  }, [categories, type, transactionCategory, isMongoId]);

  // State for processed category options
  const [categoryOptions, setCategoryOptions] = useState<FuseCategoryOption[]>([]);

  // State for calendar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    transactionDate ? new Date(transactionDate) : undefined
  );

  // Staggered animation for form fields
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween" } },
  };

  // Get account label based on transaction type
  const accountLabel = type === "income" ? "Income To" : "Expense From";
  const accountTooltip =
    type === "income"
      ? "Select the account where this income will be received"
      : "Select the account this expense will be paid from";

  // Define a type for accounts with balance
  type AccountWithBalance = {
    id?: string;
    _id?: string;
    name: string;
    type: string;
    balance?: number;
  };

  // No default accounts - users need to create accounts first
  const accountOptions = accounts || [];

  // Add debug logs to check accounts data
  console.log("Accounts received:", accounts);

  // Better check if user has any accounts that includes both array length and item type check
  const hasAccounts = accountOptions.length > 0 && accountOptions.some(account => 
    account && (typeof account === 'object')
  );

  console.log("hasAccounts:", hasAccounts, "accountOptions length:", accountOptions.length);

  // Function to get the appropriate icon based on account type
  const getAccountIcon = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case "cash":
        return (
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
        );
      case "bank":
        return (
          <Laptop className="h-4 w-4 text-blue-600 dark:text-blue-500" />
        );
      case "e-wallet":
        return (
          <Laptop className="h-4 w-4 text-orange-600 dark:text-orange-500" />
        );
      case "emergency":
        return <Laptop className="h-4 w-4 text-red-600 dark:text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Get color scheme based on account type
  const getAccountColor = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case "cash":
        return "bg-emerald-100 dark:bg-emerald-950/50";
      case "bank":
        return "bg-blue-100 dark:bg-blue-950/50";
      case "credit":
        return "bg-purple-100 dark:bg-purple-950/50";
      case "e-wallet":
        return "bg-orange-100 dark:bg-orange-950/50";
      case "savings":
        return "bg-pink-100 dark:bg-pink-950/50";
      case "investment":
        return "bg-yellow-100 dark:bg-yellow-950/50";
      case "emergency":
        return "bg-red-100 dark:bg-red-950/50";
      case "education":
        return "bg-indigo-100 dark:bg-indigo-950/50";
      case "health":
        return "bg-green-100 dark:bg-green-950/50";
      default:
        return "bg-gray-100 dark:bg-gray-800/50";
    }
  };

  // Helper function to get account ID reliably (MongoDB uses _id, frontend might use id)
  const getAccountId = useCallback((account: Asset | AccountWithBalance): string => {
    if (!account) return "";
    // First try _id (MongoDB ID)
    if (account._id) return account._id;
    // Then try id (Frontend ID)
    if (account.id) return account.id;
    // If for some reason neither exists, log it for debugging
    console.log("Warning: Account missing both _id and id:", account);
    return "";
  }, []);

  // Get the selected account (if any)
  const selectedAccount = accountOptions.find(
    (acc) => getAccountId(acc) === transactionAccount
  ) as AccountWithBalance | undefined;

  // Format account type with first letter capital
  const formatAccountType = (accountType: string) => {
    return accountType.charAt(0).toUpperCase() + accountType.slice(1);
  };

  // Add state for search query
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Add ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const categoryScrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle scroll position on combobox open
  useEffect(() => {
    if (comboboxOpen) {
      // Reset search query when opening
      setAccountSearchQuery("");

      // Scroll to the selected item if it exists
      setTimeout(() => {
        if (selectedAccount && scrollAreaRef.current) {
          const selectedItem = scrollAreaRef.current.querySelector(
            `[data-value="${getAccountId(selectedAccount)}"]`
          );
          if (selectedItem) {
            selectedItem.scrollIntoView({ behavior: "auto", block: "center" });
          }
        }
      }, 50);
    }
  }, [comboboxOpen, selectedAccount, getAccountId]);

  // Add a separate effect to handle touch events for mobile
  useEffect(() => {
    // This ensures scrolling works correctly on touch devices
    const handleTouchStart = () => {
      // Allow touch scrolling
    };

    const scrollArea = scrollAreaRef.current;
    if (scrollArea && comboboxOpen) {
      scrollArea.addEventListener("touchstart", handleTouchStart);

      return () => {
        scrollArea.removeEventListener("touchstart", handleTouchStart);
      };
    }
  }, [comboboxOpen]);

  // Add a function to determine category color scheme
  const getCategoryColor = () => {
    // For income categories
    if (type === "income") {
      return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400";
    } 
    // For expense categories
    return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400";
  };

  // Add a new useEffect for category combobox
  useEffect(() => {
    if (categoryComboboxOpen) {
      // Reset search query when opening
      setCategorySearchQuery("");
      
      // Scroll to the selected item if it exists
      setTimeout(() => {
        if (transactionCategory && categoryScrollAreaRef.current) {
          const selectedItem = categoryScrollAreaRef.current.querySelector(
            `[data-value="${transactionCategory}"]`
          );
          if (selectedItem) {
            selectedItem.scrollIntoView({ behavior: "auto", block: "center" });
          }
        }
      }, 50);
    }
  }, [categoryComboboxOpen, transactionCategory]);

  // Fix the touch event handling for mobile
  useEffect(() => {
    // Ensures scrolling works correctly on touch devices for the category dropdown
    const handleTouchStart = () => {
      // Don't stop propagation
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // Allow scrolling without blocking
      e.stopPropagation();
    };

    const scrollArea = categoryScrollAreaRef.current;
    if (scrollArea && categoryComboboxOpen) {
      scrollArea.addEventListener("touchstart", handleTouchStart, { passive: true });
      scrollArea.addEventListener("touchmove", handleTouchMove, { passive: true });

      return () => {
        scrollArea.removeEventListener("touchstart", handleTouchStart);
        scrollArea.removeEventListener("touchmove", handleTouchMove);
      };
    }
  }, [categoryComboboxOpen]);

  // Modify getCategoryIcon to more reliably detect salary/income-related categories
  const getCategoryIcon = (categoryName: string, isSelected = false) => {
    const name = categoryName.toLowerCase();
    const iconClass = isSelected ? "h-5 w-5" : "h-4 w-4";
    const iconColor = type === "income" 
      ? "text-emerald-600 dark:text-emerald-500" 
      : "text-red-600 dark:text-red-500";
      
    if (type === "income") {
      if (name.includes("salary") || name.includes("wage") || name.includes("payroll") || name.includes("gaji") || name.includes("income")) {
        return <Briefcase className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("investment") || name.includes("dividend") || name.includes("stock") || name.includes("interest")) {
        return <DollarSign className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("gift") || name.includes("present") || name.includes("bonus")) {
        return <Gift className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("refund") || name.includes("return") || name.includes("cashback")) {
        return <CreditCard className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("bonus") || name.includes("incentive") || name.includes("commission")) {
        return <Zap className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("rental") || name.includes("rent") || name.includes("property") || name.includes("lease")) {
        return <Home className={`${iconClass} ${iconColor}`} />;
      } else {
        return <CreditCard className={`${iconClass} ${iconColor}`} />;
      }
    } else {
      // Expense icons
      if (name.includes("food") || name.includes("restaurant") || name.includes("dining") || name.includes("groceries") || name.includes("meal")) {
        return <Utensils className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("shopping") || name.includes("retail") || name.includes("purchase") || name.includes("buy")) {
        return <ShoppingCart className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("transport") || name.includes("car") || name.includes("gas") || name.includes("fuel") || name.includes("commute")) {
        return <Car className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("home") || name.includes("rent") || name.includes("house") || name.includes("mortgage") || name.includes("utility")) {
        return <Home className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("health") || name.includes("medical") || name.includes("doctor") || name.includes("hospital") || name.includes("medicine")) {
        return <Heart className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("education") || name.includes("school") || name.includes("course") || name.includes("tuition") || name.includes("books")) {
        return <GraduationCap className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("travel") || name.includes("vacation") || name.includes("trip") || name.includes("hotel") || name.includes("flight")) {
        return <Plane className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("gift") || name.includes("present") || name.includes("donation")) {
        return <Gift className={`${iconClass} ${iconColor}`} />;
      } else if (name.includes("bill") || name.includes("utility") || name.includes("electricity") || name.includes("water") || name.includes("internet")) {
        return <Landmark className={`${iconClass} ${iconColor}`} />;
      } else {
        return <CreditCard className={`${iconClass} ${iconColor}`} />;
      }
    }
  };

  // Function to highlight matched text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    try {
      const regex = new RegExp(`(${query.trim()})`, 'gi');
      const parts = text.split(regex);
      
      return (
        <>
          {parts.map((part, i) => 
            regex.test(part) ? 
              <span key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-foreground rounded-sm px-0.5">{part}</span> : 
              <span key={i}>{part}</span>
          )}
        </>
      );
    } catch {
      // Fallback if regex fails (e.g. with special characters)
      return text;
    }
  };

  // Improved category search function to more reliably find all matches
  const categoryMatchesSearch = (category: FuseCategoryOption, query: string) => {
    // Always return true for empty queries
    if (!query || !query.trim()) return true;
    
    const q = query.trim().toLowerCase();
    const name = category.lowerLabel || category.label.toLowerCase();
    
    // Debug logging for gift searches
    if (q.includes('gift') && name.includes('gift')) {
      console.log(`Gift search: "${q}" vs "${name}"`);
    }
    
    // First do a simple substring check which is very reliable
    if (name.includes(q)) {
      return true;
    }
    
    // If simple matching failed but Fuse.js is available, try fuzzy search
    if (fuse && q.length > 0) {
      try {
        // Search using Fuse and return true if score is below threshold
        const results = fuse.search(q);
        
        // Find if this category is in the results
        const foundResult = results.find((result) => result.item.value === category.value);
        
        // Return true if found in fuzzy search results
        return !!foundResult;
      } catch (error) {
        console.error("Fuse.js search error:", error);
        // Don't return here - fall through to additional matching techniques
      }
    }
    
    // Direct word matching for cases Fuse might miss
    const queryWords = q.split(/\s+/);
    const nameWords = name.split(/\s+/);
    
    // Match if any word in the query is contained in any word in the name
    for (const queryWord of queryWords) {
      if (queryWord.length < 2) continue; // Skip very short words
      
      for (const nameWord of nameWords) {
        if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
          return true;
        }
      }
    }
    
    // Final fallback for normalized text
    return category.normalizedLabel.includes(q.replace(/\s+/g, ''));
  };

  // Function to compare categories by matching score - higher score = better match
  const getCategoryMatchScore = (category: { label: string; value: string | number }, query: string) => {
    if (!query || !query.trim()) return 0;
    
    const label = category.label.toLowerCase();
    query = query.toLowerCase();
    
    // Exact match has highest priority
    if (label === query) return 100;
    
    // Starting with query is second highest priority
    if (label.startsWith(query)) return 90 - label.length;
    
    // Contains query is third highest priority
    if (label.includes(query)) return 70 - label.length;
    
    // Otherwise, use Levenshtein distance (simple implementation)
    const distance = (a: string, b: string) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      
      const matrix = [];
      
      // Initialize
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      // Fill matrix
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            );
          }
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    // Calculate Levenshtein distance and return inverse score (lower distance = higher score)
    const dist = distance(label, query);
    // Max score of 50 for fuzzy matches
    return Math.max(0, 50 - dist * 10);
  };

  useEffect(() => {
    // Log whenever categorySearchQuery changes to debug immediate search issues
    console.log("Search query changed:", categorySearchQuery);
  }, [categorySearchQuery]);

  // Add state to track the selected account's balance
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);
  
  // Update selected account balance when account changes
  useEffect(() => {
    if (accounts && transactionAccount) {
      const account = accounts.find(a => 
        a._id === transactionAccount || 
        a.id === transactionAccount
      );
      
      if (account) {
        setSelectedAccountBalance(account.balance || 0);
      }
    }
  }, [accounts, transactionAccount]);
  
  // Parse the amount for validation
  const currentAmount = parseFloat(transactionAmount || '0');

  // Add a balance warning component
  const BalanceWarning = ({ currentBalance, proposedAmount, type }: { 
    currentBalance: number; 
    proposedAmount: number; 
    type: 'income' | 'expense';
  }) => {
    // Only show warning for expenses
    if (type !== 'expense') return null;
    
    // Check if expense is greater than balance
    if (proposedAmount > currentBalance) {
      return (
        <div className="text-destructive text-sm mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          Warning: This expense exceeds your current balance of {formatCurrency(currentBalance)}
        </div>
      );
    }
    
    // If it's a large expense (>75% of balance), show a caution
    if (proposedAmount > currentBalance * 0.75) {
      return (
        <div className="text-orange-500 dark:text-orange-400 text-sm mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          Caution: This expense uses {Math.round((proposedAmount / currentBalance) * 100)}% of your available balance
        </div>
      );
    }
    
    return null;
  };

  // Update the filteredCategoryOptions sorting comparison
  const filteredCategoryOptions = categoryOptions.filter(category => 
    !categorySearchQuery.trim() || categoryMatchesSearch(category, categorySearchQuery)
  );

  // Update the onCategoryClick handler
  const onCategoryClick = useCallback((category: FuseCategoryOption) => {
    try {
      // Reset the combobox state
      setCategoryComboboxOpen(false);
      setCategorySearchQuery('');
      
      // Set clicked state for animation
      setClickedItemId(category.value.toString());
      
      // Actually change the category
      handleCategoryChange(category.value.toString());
      
      // Clear clicked state after animation plays
      setTimeout(() => {
        setClickedItemId(null);
      }, 300);
    } catch (error) {
      console.error("Error clicking category:", error);
    }
  }, [handleCategoryChange]);

  // Function to format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Select date";
      }
      
      // Format: Jan 1, 2023
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Select date";
    }
  };
  
  // Handle calendar open state
  const handleCalendarOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
  };

  // Effect to update formatted date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        onDateChange(formattedDate);
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
  }, [selectedDate, onDateChange]);

  return (
    <motion.div
      className="space-y-5"
      variants={containerAnimation}
      initial="hidden"
      animate="show"
    >
      <style>{combinedStyles}</style>
      {/* Transaction Title Field */}
      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="title" className="text-[15px]">
            Transaction Title <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>Enter a clear title (3-30 characters)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative">
          <Input
            id="title"
            placeholder={
              type === "income" ? "Monthly Salary" : "Grocery Shopping"
            }
            value={transactionTitle}
            onChange={(e) => {
              // Limit to 30 characters
              if (e.target.value.length <= 30) {
                onTitleChange(e.target.value);
              }
            }}
            className={cn(
              "text-[16px] h-10",
              formErrors.title
                ? "border-red-500 focus-visible:ring-red-500"
                : ""
            )}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
            {transactionTitle.length}/30
          </div>
        </div>
        {formErrors.title && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.title}
          </p>
        )}
      </motion.div>

      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="amount" className="text-[15px]">
            {type === "income" ? "Income" : "Expense"} Amount <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>
                  Enter the {type === "income" ? "income" : "expense"} amount
                  (numbers only)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CurrencyInput
          id="amount"
          value={transactionAmount}
          onChange={onAmountChange}
          className={cn(
            "bg-background",
            formErrors.amount ? "border-destructive ring-destructive/30" : ""
          )}
          hasError={!!formErrors.amount}
          locale={currencyLocale}
          currencySymbol={currencySymbol}
        />
        {formErrors.amount && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.amount}
          </p>
        )}
      </motion.div>

      {/* Enhanced Account Selection Field with Command */}
      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="account" className="text-[15px] font-medium">
            {accountLabel} <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>{accountTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isLoadingAccounts ? (
          <div className="p-4 border rounded-lg flex items-center justify-center bg-muted/20">
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          </div>
        ) : hasAccounts ? (
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="account"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  aria-label="Select account"
                  className={cn(
                    "w-full justify-between h-11 px-3 text-left font-normal",
                  formErrors.account ? "border-red-500 focus-visible:ring-red-500" : "",
                    "transition-all duration-200",
                    "hover:bg-accent/40 focus:bg-accent/40"
                  )}
                >
                  {selectedAccount ? (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full w-8 h-8 flex-shrink-0",
                          getAccountColor(selectedAccount.type)
                        )}
                      >
                        {getAccountIcon(selectedAccount.type)}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[15px] truncate font-medium">
                          {selectedAccount.name} <span className="text-xs text-muted-foreground">({formatAccountType(selectedAccount.type)})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize truncate">
                            {formatAccountType(selectedAccount.type)}
                          </span>
                          {selectedAccount?.balance !== undefined && (
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                selectedAccount.balance > 0
                                  ? "text-emerald-600 dark:text-emerald-500"
                                  : "text-destructive"
                              )}
                            >
                              {formatCurrency(selectedAccount.balance || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                    {`Select ${type === "income" ? "destination" : "source"} account`}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[350px] p-0"
                align="start"
                side="bottom"
                sideOffset={5}
                avoidCollisions={true}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input with clear button */}
              <div className="flex items-center border-b p-2">
                <div className="flex-1 flex items-center bg-muted rounded-md px-3">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input
                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search accounts..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                  />
                </div>
                {accountSearchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-8 w-8 p-0"
                    onClick={() => setAccountSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Account list with direct rendering */}
              <div 
                className="max-h-[250px] overflow-y-auto p-1 scrollbar-thin"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "var(--accent) transparent",
                        WebkitOverflowScrolling: "touch",
                        msOverflowStyle: "auto",
                  touchAction: "pan-y",
                      }}
                      ref={scrollAreaRef}
                      onWheel={(e) => {
                        // Prevent the wheel event from being blocked
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        // Allow touch scrolling
                        e.stopPropagation();
                      }}
                onTouchMove={(e) => {
                        // Allow touch scrolling
                        e.stopPropagation();
                      }}
                    >
                {/* Group header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Available Accounts
                </div>

                {/* Filtered accounts */}
                {(() => {
                  // Show filtered items or empty state
                  if (accountOptions.length === 0) {
                            return (
                      <div className="py-6 text-center flex flex-col items-center gap-2">
                        <CreditCard className="h-10 w-10 text-muted-foreground/50" />
                        <div className="text-sm text-muted-foreground">
                          {accountSearchQuery ? "No matching accounts found" : "No accounts available"}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          {accountSearchQuery ? "Try a different search term" : "Add an account to get started"}
                        </div>
                      </div>
                    );
                  }

                  // Return the account items
                  return accountOptions.map((account) => (
                    <div
                      key={getAccountId(account)}
                                className={cn(
                        "flex items-center gap-3 p-2 cursor-pointer rounded-md selection-item",
                        transactionAccount === getAccountId(account) ? "bg-accent" : "",
                        clickedItemId === getAccountId(account) ? "clicked" : "",
                        "hover:bg-accent/80"
                      )}
                      onClick={() => {
                        setClickedItemId(getAccountId(account));
                        console.log("Account selected:", getAccountId(account), account.name);
                        handleAccountChange(getAccountId(account));
                        setTimeout(() => {
                          setComboboxOpen(false);
                          setClickedItemId(null);
                        }, 150);
                      }}
                      data-value={getAccountId(account)}
                    >
                      <div className={cn(
                                      "flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0",
                                      getAccountColor(account.type)
                      )}>
                                    {getAccountIcon(account.type)}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {accountSearchQuery.trim() 
                            ? highlightMatch(account.name, accountSearchQuery)
                            : account.name}
                          <span className="ml-1 text-xs text-muted-foreground">({formatAccountType(account.type)})</span>
                                      </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize truncate">
                                        {formatAccountType(account.type)}
                          </span>
                          {account?.balance !== undefined && (
                                        <span
                                          className={cn(
                                "text-xs font-semibold",
                                account.balance > 0
                                              ? "text-emerald-600 dark:text-emerald-500"
                                              : "text-destructive"
                                          )}
                                        >
                              {formatCurrency(account.balance || 0)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                      {transactionAccount === getAccountId(account) && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                                </div>
                  ));
                })()}
                    </div>
              </PopoverContent>
            </Popover>
        ) : (
          <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-muted/30 text-center space-y-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-1">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium">No Accounts Found</h3>
            <p className="text-xs text-muted-foreground max-w-[300px]">
              You need to add at least one account before you can track transactions.
            </p>
          </div>
        )}

        {formErrors.account && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.account}
          </p>
        )}
      </motion.div>

            {selectedAccount && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                className={cn(
                  "mt-3 p-4 border rounded-lg transition-all",
                  "bg-card hover:shadow-md border-border",
                  "relative overflow-hidden",
            getAccountColor(selectedAccount.type)
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full w-12 h-12 flex-shrink-0 mt-1",
                      getAccountColor(selectedAccount.type)
                    )}
                  >
                    {getAccountIcon(selectedAccount.type)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold truncate">
                        {selectedAccount.name}
                      </span>

                      {/* Only show balance if it exists */}
                      {selectedAccount?.balance !== undefined && (
                        <span
                          className={cn(
                            "text-base font-semibold",
                            selectedAccount.balance > 0
                              ? "text-emerald-600 dark:text-emerald-500"
                              : "text-destructive"
                          )}
                        >
                          {formatCurrency(selectedAccount.balance || 0)}
                        </span>
                      )}
                    </div>

              <div
                      className={cn(
                  "text-xs capitalize px-2 py-0.5 w-fit mt-1.5 rounded bg-muted border",
                  getAccountColor(selectedAccount.type)
                      )}
                    >
                      {formatAccountType(selectedAccount.type)}
              </div>

                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {type === "income" ? "Destination" : "Source"} Account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br from-foreground/20 to-transparent pointer-events-none"></div>
              </motion.div>
      )}

      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="category" className="text-[15px]">
            Category <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>Select the appropriate category for this {type}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {categoriesLoading ? (
          <div className="p-4 border rounded-lg flex items-center justify-center bg-muted/20">
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          </div>
        ) : categoriesError ? (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
            <p className="text-sm text-destructive">{categoriesError}</p>
          </div>
        ) : categoryOptions.length > 0 ? (
          <Popover open={categoryComboboxOpen} onOpenChange={setCategoryComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                id="category"
                variant="outline"
                role="combobox"
                aria-expanded={categoryComboboxOpen}
                aria-label="Select category"
              className={cn(
                  "w-full justify-between h-11 px-3 text-left font-normal",
                formErrors.category
                  ? "border-red-500 focus-visible:ring-red-500"
                    : "",
                  "transition-all duration-200",
                  "hover:bg-accent/40 focus:bg-accent/40"
                )}
              >
                {transactionCategory ? (
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {(() => {
                      const selected = categoryOptions.find(
                        (cat) => cat.value === transactionCategory
                      );
                      if (!selected) return <span className="text-muted-foreground">Select a category</span>;
                      
                      return (
                        <>
                          <div className={cn(
                            "flex items-center justify-center rounded-full w-8 h-8 flex-shrink-0",
                            getCategoryColor()
                          )}>
                            {getCategoryIcon(selected.label, true)}
                          </div>
                          <span className="truncate">{selected.label}</span>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Select a category
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[350px] p-0" 
              align="start" 
              side="bottom"
              sideOffset={5}
              avoidCollisions={true}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input with clear button */}
              <div className="flex items-center border-b p-2">
                <div className="flex-1 flex items-center bg-muted rounded-md px-3">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input
                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => {
                      console.log("Direct search input changed to:", e.target.value);
                      setCategorySearchQuery(e.target.value);
                    }}
                  />
                </div>
                {categorySearchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-8 w-8 p-0"
                    onClick={() => {
                      console.log("Clearing search");
                      setCategorySearchQuery("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Category list with direct rendering */}
              <div 
                className="max-h-[250px] overflow-y-auto p-1 scrollbar-thin"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--accent) transparent",
                  WebkitOverflowScrolling: "touch",
                  msOverflowStyle: "auto",
                  touchAction: "pan-y",
                }}
                ref={categoryScrollAreaRef}
                onWheel={(e) => {
                  // Prevent the wheel event from being blocked
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  // Allow touch scrolling
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  // Allow touch scrolling
                  e.stopPropagation();
                }}
              >
                {/* Group header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {type === "income" ? "Income Categories" : "Expense Categories"}
                </div>

                {/* Filtered categories */}
                {(() => {
                  // Pre-filter categories
                  const filteredCategories = filteredCategoryOptions;

                  // Show filtered items or empty state
                  if (filteredCategories.length === 0) {
                    return (
                      <div className="py-6 text-center flex flex-col items-center gap-2">
                        <Tags className="h-10 w-10 text-muted-foreground/50" />
                        <div className="text-sm text-muted-foreground">
                          {categorySearchQuery ? "No matching categories found" : "No categories available"}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          {categorySearchQuery ? "Try a different search term" : ""}
                        </div>
                      </div>
                    );
                  }

                  // Return the category items
                  return filteredCategories
                    .sort((a, b) => {
                      return getCategoryMatchScore(b, categorySearchQuery) - getCategoryMatchScore(a, categorySearchQuery);
                    })
                    .map((category) => (
                      <div
                  key={category.value}
                        className={cn(
                          "flex items-center gap-3 p-2 cursor-pointer rounded-md selection-item",
                          transactionCategory === category.value ? "bg-accent" : "",
                          clickedItemId === category.value ? "clicked" : "",
                          "hover:bg-accent/80"
                        )}
                        onClick={() => {
                          onCategoryClick(category);
                        }}
                        data-value={category.value}
                      >
                        <div className={cn(
                          "flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0",
                          getCategoryColor()
                        )}>
                          {getCategoryIcon(category.label)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {categorySearchQuery.trim() 
                              ? highlightMatch(category.label, categorySearchQuery)
                              : category.label
                            }
                          </span>
                        </div>
                    {transactionCategory === category.value && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                    ));
                })()}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-muted/30 text-center space-y-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-1">
              <Tags className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium">No Categories Found</h3>
            <p className="text-xs text-muted-foreground max-w-[300px]">
              Categories are managed by administrators. Please contact support if you need additional categories.
            </p>
          </div>
        )}

        {formErrors.category && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.category}
          </p>
        )}
      </motion.div>

      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="description" className="text-[15px]">
            Description <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>Add details about this transaction</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="description"
          placeholder="Transaction details"
          value={transactionDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className={cn(
            "resize-none text-[16px] min-h-[80px] h-24",
            formErrors.description
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          )}
        />
        {formErrors.description && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.description}
          </p>
        )}
      </motion.div>

      <motion.div className="space-y-2" variants={itemAnimation}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="date" className="text-[15px]">
            Transaction Date <span className="text-red-500">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>When did this transaction occur?</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !transactionDate && "text-muted-foreground",
                formErrors.date && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {transactionDate ? formatDate(transactionDate) : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date: Date) =>
                date > new Date() || // Can't select future dates
                date < new Date("1900-01-01") // Can't select dates before 1900
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {formErrors.date && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0">
              <span className="block h-1 w-1 rounded-full bg-red-500" />
            </span>
            {formErrors.date}
          </p>
        )}
      </motion.div>

      {/* Show balance warning if needed */}
      {transactionAccount && !isNaN(currentAmount) && (
        <BalanceWarning 
          currentBalance={selectedAccountBalance} 
          proposedAmount={currentAmount} 
          type={type}
        />
      )}
    </motion.div>
  );
};

export default TransactionForm;
