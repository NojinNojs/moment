import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Tag,
  AlertCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Shield,
  ShoppingBag,
  Home,
  Utensils,
  Car,
  Plane,
  Coffee,
  Gift,
  DollarSign,
  Briefcase,
  BookOpen,
  Activity,
  Zap,
  Droplet,
  Wifi
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { TransactionDetails } from "../core/TransactionDetails";
import apiService from "@/services/api";

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
}

// Function to limit description to maximum 3 words
const limitWords = (text: string, maxWords: number): string => {
  if (!text) return "";
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
};

// Update the helper function for getting category display name to handle MongoDB IDs better
const getCategoryDisplayName = (category: CategoryObject | string | null | undefined): string => {
  if (typeof category === 'object' && category !== null) {
    return category.name || 'Uncategorized';
  } else if (typeof category === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 chars)
    const isMongoId = /^[0-9a-f]{24}$/i.test(category);
    if (isMongoId) {
      // For MongoDB IDs, try to resolve dynamically
      return 'Loading...'; // Initial placeholder
    } else {
      return category;
    }
  } else {
    return 'Uncategorized';
  }
};

// Export the TransactionItem component as a named export
export const TransactionItem = ({
  transaction,
  onEditTransaction,
  onDeleteTransaction,
  className,
  hideDate = false
}: TransactionItemProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Add state for resolved data
  const [resolvedCategory, setResolvedCategory] = useState<CategoryObject | null>(null);
  const [resolvedAccount, setResolvedAccount] = useState<AccountObject | null>(null);
  
  // Effect to resolve MongoDB IDs when transaction changes
  useEffect(() => {
    const resolveReferences = async () => {
      // Resolve category if it's a MongoDB ID
      if (
        transaction.category && 
        typeof transaction.category === 'string' && 
        /^[0-9a-f]{24}$/i.test(transaction.category) &&
        !resolvedCategory
      ) {
        try {
          const response = await apiService.getCategoryById(transaction.category);
          if (response.success && response.data) {
            setResolvedCategory(response.data as CategoryObject);
          }
        } catch (error) {
          console.error("Failed to resolve category:", error);
        }
      }
      
      // Resolve account if it's a MongoDB ID
      if (
        transaction.account && 
        typeof transaction.account === 'string' && 
        /^[0-9a-f]{24}$/i.test(transaction.account) &&
        !resolvedAccount
      ) {
        try {
          const response = await apiService.getAccountById(transaction.account);
          if (response.success && response.data) {
            setResolvedAccount(response.data as AccountObject);
          }
        } catch (error) {
          console.error("Failed to resolve account:", error);
        }
      }
    };
    
    resolveReferences();
  }, [transaction, resolvedCategory, resolvedAccount]);
  
  // Get the actual category - either resolved from state or from props
  const effectiveCategory = useMemo(() => {
    if (resolvedCategory) return resolvedCategory;
    return transaction.category;
  }, [resolvedCategory, transaction.category]);
  
  // Get the actual account - either resolved from state or from props
  const effectiveAccount = useMemo(() => {
    if (resolvedAccount) return resolvedAccount;
    return transaction.account;
  }, [resolvedAccount, transaction.account]);
  
  // Determine if this is income, expense, or transfer
  const isIncome = useMemo(() => 
    transaction.type === 'income',
    [transaction.type]
  );
  
  const isTransfer = useMemo(() => 
    transaction.transferType === 'transfer',
    [transaction.transferType]
  );

  // Get the appropriate icon for the transaction type
  const getTransactionIcon = useCallback(() => {
    if (isTransfer) {
      return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    } 
    
    // For categories, return specific icons
    // Check if category is an object (MongoDB ObjectId)
    let categoryName = '';
    
    if (typeof effectiveCategory === 'object' && effectiveCategory !== null) {
      categoryName = effectiveCategory.name || '';
    } else if (typeof effectiveCategory === 'string') {
      // Check if it looks like a MongoDB ObjectId (24 chars)
      const isMongoId = /^[0-9a-f]{24}$/i.test(effectiveCategory);
      if (isMongoId) {
        // This is just an ID - we don't have the real name
        categoryName = '';
      } else {
        categoryName = effectiveCategory;
      }
    }
    
    const category = categoryName.toLowerCase();
    
    if (isIncome) {
      // Income-specific icons
      if (category.includes('salary') || category.includes('wage')) 
        return <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />;
      if (category.includes('invest') || category.includes('dividend')) 
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      if (category.includes('gift')) 
        return <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />;
      if (category.includes('refund')) 
        return <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />;
      // Default income icon
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    } else {
      // Expense-specific icons
      if (category.includes('food') || category.includes('grocery') || category.includes('restaurant'))
        return <Utensils className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('shop') || category.includes('cloth'))
        return <ShoppingBag className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('home') || category.includes('rent') || category.includes('house'))
        return <Home className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('transport') || category.includes('car') || category.includes('gas'))
        return <Car className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('travel') || category.includes('vacation') || category.includes('holiday'))
        return <Plane className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('coffee') || category.includes('cafe'))
        return <Coffee className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('gift'))
        return <Gift className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('education') || category.includes('book') || category.includes('school'))
        return <BookOpen className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('health') || category.includes('medical') || category.includes('doctor'))
        return <Activity className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('utility') || category.includes('electric'))
        return <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('water'))
        return <Droplet className="h-4 w-4 text-red-600 dark:text-red-400" />;
      if (category.includes('internet') || category.includes('wifi') || category.includes('phone'))
        return <Wifi className="h-4 w-4 text-red-600 dark:text-red-400" />;
      // Default expense icon
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
  }, [isIncome, isTransfer, effectiveCategory]);
  
  // Get the appropriate color for the transaction type
  const getTransactionColor = useCallback(() => {
    if (isTransfer) {
      return "bg-blue-100 dark:bg-blue-900/30";
    } else {
      return isIncome 
        ? "bg-green-100 dark:bg-green-900/30" 
        : "bg-red-100 dark:bg-red-900/30";
    }
  }, [isIncome, isTransfer]);
  
  // Get the appropriate text color for the transaction amount
  const getAmountColor = useCallback(() => {
    if (isTransfer) {
      return "text-blue-600 dark:text-blue-400"; 
    } else {
      return isIncome 
        ? "text-green-600 dark:text-green-400" 
        : "text-red-600 dark:text-red-400";
    }
  }, [isIncome, isTransfer]);
  
  // Get the appropriate badge color for the transaction type
  const getTypeBadgeColor = useCallback(() => {
    if (isTransfer) {
      return "bg-blue-100/60 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    } else {
      return isIncome 
        ? "bg-green-100/60 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
        : "bg-red-100/60 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
  }, [isIncome, isTransfer]);
  
  // Format date in a readable way - memoize
  const formattedDate = useMemo(() => {
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
  }, [transaction.date]);
  
  // Limit description to 3 words max as requested - memoize
  const limitedDescription = useMemo(() => 
    limitWords(transaction.title, 3),
    [transaction.title]
  );
  
  // Safe click handler for transaction details
  const handleTransactionClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setDetailsOpen(true);
    } catch (error) {
      console.error("Error opening transaction details:", error);
    }
  }, []);
  
  // Handler for closing details modal
  const handleCloseDetails = useCallback(() => {
    setDetailsOpen(false);
  }, []);
  
  // Get account icon based on type
  const getAccountIcon = useCallback((account: string | AccountObject | null | undefined) => {
    if (!account) return null;
    
    let accountName = '';
    if (typeof account === 'object') {
      accountName = account.name || '';
    } else {
      accountName = account;
    }
    
    const accountLower = accountName.toLowerCase();
    if (accountLower.includes('cash')) return <Wallet className="h-3 w-3 mr-1 text-emerald-500" />;
    if (accountLower.includes('bank')) return <Building2 className="h-3 w-3 mr-1 text-blue-500" />;
    if (accountLower.includes('pay') || accountLower.includes('wallet')) return <Smartphone className="h-3 w-3 mr-1 text-orange-500" />;
    if (accountLower.includes('emergency')) return <Shield className="h-3 w-3 mr-1 text-red-500" />;
    return <CreditCard className="h-3 w-3 mr-1 text-muted-foreground" />;
  }, []);
  
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
        <Card className="p-4 hover:bg-accent/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full shrink-0 flex items-center justify-center",
                getTransactionColor()
              )}>
                {getTransactionIcon()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm">{limitedDescription}</p>
                  {transaction.title.split(' ').length > 3 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground">...</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{transaction.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    {getCategoryDisplayName(effectiveCategory)}
                  </div>
                  
                  {effectiveAccount && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {getAccountIcon(effectiveAccount)}
                      <span className="truncate max-w-[80px]">
                        {typeof effectiveAccount === 'object' && effectiveAccount !== null
                          ? effectiveAccount.name || 'Unknown Account'
                          : effectiveAccount}
                      </span>
                    </div>
                  )}
                  
                  {!hideDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formattedDate}
                    </div>
                  )}
                  
                  {transaction.status === 'pending' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="h-5 px-1.5 bg-yellow-100/60 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Transaction pending</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {transaction.status === 'failed' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="h-5 px-1.5 bg-red-100/60 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Transaction failed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={cn(
                "font-semibold text-sm tabular-nums",
                getAmountColor()
              )}>
                {isTransfer ? '↔ ' : isIncome ? '+ ' : '- '}{formatCurrency(Math.abs(transaction.amount))}
              </span>
              <span className={cn(
                "text-[10px] mt-1 px-1.5 py-0.5 rounded-sm",
                getTypeBadgeColor()
              )}>
                {isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Transaction Details Modal - Only render when open to prevent unnecessary updates */}
      {detailsOpen && (
        <TransactionDetails
          transaction={transaction}
          isOpen={detailsOpen}
          onClose={handleCloseDetails}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
        />
      )}
    </>
  );
};

export default TransactionItem; 