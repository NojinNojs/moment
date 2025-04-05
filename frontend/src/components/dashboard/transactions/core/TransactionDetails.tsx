import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Tag,
  Trash2,
  Edit,
  CreditCard,
  HelpCircle,
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
  Wifi,
  TrendingUp,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogClose,
  DialogHeader
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Transaction } from "../list/TransactionItem";
import apiService from "@/services/api";
import { motion } from "framer-motion";
import { Category } from "@/types/categories";

export interface TransactionDetailsProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (id: number) => void;
}

// Define type for Account
interface AccountType {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  balance?: number;
}

// Define type for Category
interface CategoryType {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  color?: string;
}

// Get transaction icon based on category
const getTransactionIcon = (transaction: Transaction) => {
  // Check if it's a transfer
  if (transaction.transferType === 'transfer') {
    return <CreditCard className="h-8 w-8 text-white" />;
  }
  
  // Check different category formats
  let categoryName = '';
  
  if (typeof transaction.category === 'object' && transaction.category !== null) {
    categoryName = (transaction.category as CategoryType).name || 'Uncategorized';
  } else if (typeof transaction.category === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 chars)
    const isMongoId = /^[0-9a-f]{24}$/i.test(transaction.category);
    if (isMongoId) {
      // This is just an ID - we don't have the real name
      categoryName = 'Uncategorized';
    } else {
      categoryName = transaction.category;
    }
  } else {
    categoryName = 'Uncategorized';
  }
  
  const category = categoryName.toLowerCase();
  
  // For the transaction icon color - ALWAYS RED for expenses regardless of transaction type
  // const iconTextColor = transaction.type === 'income' ? "text-primary-foreground" : "text-destructive-foreground";
  
  if (transaction.type === 'income') {
    // Income-specific icons
    if (category.includes('salary') || category.includes('wage')) 
      return <Briefcase className="h-8 w-8 text-primary-foreground" />;
    if (category.includes('invest') || category.includes('dividend')) 
      return <TrendingUp className="h-8 w-8 text-primary-foreground" />;
    if (category.includes('gift')) 
      return <Gift className="h-8 w-8 text-primary-foreground" />;
    if (category.includes('refund')) 
      return <DollarSign className="h-8 w-8 text-primary-foreground" />;
    // Default income icon
    return <ArrowUpRight className="h-8 w-8 text-primary-foreground" />;
  } else {
    // Expense-specific icons - ALWAYS use text-destructive-foreground
    if (category.includes('food') || category.includes('grocery') || category.includes('restaurant'))
      return <Utensils className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('shop') || category.includes('cloth'))
      return <ShoppingBag className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('home') || category.includes('rent') || category.includes('house'))
      return <Home className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('transport') || category.includes('car') || category.includes('gas'))
      return <Car className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('travel') || category.includes('vacation') || category.includes('holiday'))
      return <Plane className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('coffee') || category.includes('cafe'))
      return <Coffee className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('gift'))
      return <Gift className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('education') || category.includes('book') || category.includes('school'))
      return <BookOpen className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('health') || category.includes('medical') || category.includes('doctor'))
      return <Activity className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('utility') || category.includes('electric'))
      return <Zap className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('water'))
      return <Droplet className="h-8 w-8 text-destructive-foreground" />;
    if (category.includes('internet') || category.includes('wifi') || category.includes('phone'))
      return <Wifi className="h-8 w-8 text-destructive-foreground" />;
    // Default expense icon
    return <ArrowDownRight className="h-8 w-8 text-destructive-foreground" />;
  }
};

// Helper function to get a displayable category name with better MongoDB ObjectID handling
const getCategoryDisplayName = (category: Category | string | null | undefined): string => {
  if (typeof category === 'object' && category !== null) {
    return category.name || 'Uncategorized';
  } else if (typeof category === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 chars)
    const isMongoId = /^[0-9a-f]{24}$/i.test(category);
    if (isMongoId) {
      // This is just an ID, but instead of showing 'Uncategorized', show a loading placeholder
      // This is a visual cue that the data is incomplete and may update later
      return 'Loading category...';
    } else {
      return category;
    }
  } else {
    return 'Uncategorized';
  }
};

// Helper function to get account name and type from account field
const getAccountDisplayInfo = (account: AccountType | string | null | undefined): { name: string, type: string } => {
  if (typeof account === 'object' && account !== null) {
    return { 
      name: account.name || 'Unknown Account', 
      type: account.type || 'account'
    };
  } else if (typeof account === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 chars)
    const isMongoId = /^[0-9a-f]{24}$/i.test(account);
    if (isMongoId) {
      // This is just an ID - we don't have the real name
      return { name: 'Loading account...', type: 'account' };
    } else {
      // Try to extract type from the account name string
      let type = 'account';
      const accountLower = account.toLowerCase();
      if (accountLower.includes('cash')) type = 'cash';
      else if (accountLower.includes('bank')) type = 'bank';
      else if (accountLower.includes('wallet') || accountLower.includes('pay')) type = 'e-wallet';
      else if (accountLower.includes('emergency')) type = 'emergency';
      
      return { name: account, type };
    }
  } else {
    return { name: 'Unknown Account', type: 'account' };
  }
};

// Get account icon based on type
const getAccountIcon = (account: AccountType | string | null | undefined) => {
  const accountInfo = getAccountDisplayInfo(account);
  const type = accountInfo.type.toLowerCase();
  
  if (type.includes('cash')) return <Wallet className="h-4 w-4 text-emerald-500 mr-2" />;
  if (type.includes('bank')) return <Building2 className="h-4 w-4 text-blue-500 mr-2" />;
  if (type.includes('wallet') || type.includes('e-wallet') || type.includes('pay')) 
    return <Smartphone className="h-4 w-4 text-orange-500 mr-2" />;
  if (type.includes('emergency')) return <Shield className="h-4 w-4 text-red-500 mr-2" />;
  
  return <CreditCard className="h-4 w-4 text-gray-500 mr-2" />;
};

export const TransactionDetails = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailsProps) => {
  // Add state for local resolved data
  const [resolvedCategory, setResolvedCategory] = useState<CategoryType | null>(null);
  const [resolvedAccount, setResolvedAccount] = useState<AccountType | null>(null);
  
  // Preload account and category data when component mounts or transaction changes
  useEffect(() => {
    if (isOpen) {
      const loadReferences = async () => {
        await apiService.preloadEntityData();
        
        // If account is a MongoDB ID, fetch the actual account
        if (transaction.account && 
            typeof transaction.account === 'string' && 
            /^[0-9a-f]{24}$/i.test(transaction.account)) {
          const accountResponse = await apiService.getAccountById(transaction.account);
          if (accountResponse.success && accountResponse.data) {
            console.log("Found account:", accountResponse.data.name);
            setResolvedAccount(accountResponse.data as AccountType);
          }
        }
        
        // If category is a MongoDB ID, fetch the actual category
        if (transaction.category && 
            typeof transaction.category === 'string' && 
            /^[0-9a-f]{24}$/i.test(transaction.category)) {
          const categoryResponse = await apiService.getCategoryById(transaction.category);
          if (categoryResponse.success && categoryResponse.data) {
            console.log("Found category:", categoryResponse.data.name);
            setResolvedCategory(categoryResponse.data as CategoryType);
          }
        }
      };
      
      loadReferences().catch(error => {
        console.error("Error loading references:", error);
      });
    }
  }, [isOpen, transaction.account, transaction.category]);
  
  // Get the effective account - either resolved from state or from props
  const effectiveAccount = useMemo(() => {
    if (resolvedAccount) return resolvedAccount;
    return transaction.account;
  }, [resolvedAccount, transaction.account]);
  
  // Get the effective category - either resolved from state or from props
  const effectiveCategory = useMemo(() => {
    if (resolvedCategory) return resolvedCategory;
    return transaction.category;
  }, [resolvedCategory, transaction.category]);
  
  // Update the account and category info using the effective values
  // Get account display info
  const accountInfo = useMemo(() => 
    getAccountDisplayInfo(effectiveAccount as (AccountType | string | null | undefined)),
    [effectiveAccount]
  );
  
  // Get category display name
  const categoryName = useMemo(() => 
    getCategoryDisplayName(effectiveCategory as (Category | string | null | undefined)),
    [effectiveCategory]
  );
  
  // Format date to a more readable format - memoize
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(transaction.date);
      return new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        weekday: 'long'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return transaction.date; // Return original string if formatting fails
    }
  }, [transaction.date]);
  
  // Format currency to match the rest of the application - memoize
  const formattedCurrency = useMemo(() => {
    try {
      // Use absolute value for formatting
      const absAmount = Math.abs(transaction.amount);
      
      // Format with appropriate separators
      const formattedAmount = absAmount.toLocaleString('en-US');
      
      // For transfers, don't add + or - symbols
      if (transaction.transferType === 'transfer') {
        return `$${formattedAmount}`;
      }
      
      // Add symbol and sign for income/expense
      // For expenses, always show minus sign regardless of amount value
      if (transaction.type === 'expense') {
        return `- $${formattedAmount}`;
      }
      
      // For income, always show plus sign
      return `+ $${formattedAmount}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      
      if (transaction.transferType === 'transfer') {
        return `$${Math.abs(transaction.amount)}`;
      }
      
      // Handle error case with same logic
      if (transaction.type === 'expense') {
        return `- $${Math.abs(transaction.amount)}`;
      }
      
      return `+ $${Math.abs(transaction.amount)}`;
    }
  }, [transaction.amount, transaction.transferType, transaction.type]);
  
  // Safe close handler - memoize
  const handleClose = useCallback(() => {
    try {
      if (onClose) onClose();
    } catch (error) {
      console.error("Error closing transaction details:", error);
    }
  }, [onClose]);
  
  // Safe edit handler - memoize
  const handleEdit = useCallback(() => {
    try {
      if (onEdit) {
        onEdit(transaction.id);
        handleClose();
      }
    } catch (error) {
      console.error("Error editing transaction:", error);
    }
  }, [onEdit, transaction.id, handleClose]);
  
  // Safe delete handler - memoize
  const handleDelete = useCallback(() => {
    try {
      if (onDelete) {
        onDelete(transaction.id);
        handleClose();  // Close the dialog immediately after triggering delete
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }, [onDelete, transaction.id, handleClose]);

  // Return null if not open to prevent rendering issues
  if (!isOpen) return null;
  
  // Determine the color based on transaction type
  const getHeaderColor = () => {
    if (transaction.transferType === 'transfer') {
      return "bg-blue-600/90"; // Deeper blue color for transfers
    } else if (transaction.type === 'income') {
      return "bg-primary/90"; // Green for income
    } else {
      return "bg-destructive/90"; // Consistently red for expenses
    }
  };

  // Determine the text color based on transaction type
  const getTextColor = () => {
    if (transaction.transferType === 'transfer') {
      return "text-blue-600"; // Deeper blue text for transfers
    } else if (transaction.type === 'income') {
      return "text-primary"; // Green for income
    } else {
      return "text-destructive"; // Consistently red for expenses
    }
  };

  // Animation variants
  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-background flex flex-col max-h-[90vh]">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 z-10 border-b px-6 flex flex-col items-center text-center flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <DialogTitle className="text-xl font-semibold mb-6">Transaction Details</DialogTitle>
          
          {/* Circular icon - now using category-based icon */}
          <motion.div 
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-3",
              getHeaderColor(),
              transaction.type === 'income' ? "shadow-primary/20" : "shadow-destructive/20",
              "shadow-lg"
            )}
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            {getTransactionIcon(transaction)}
          </motion.div>
          
          {/* Transaction title */}
          <h2 className="text-2xl font-bold mb-2">{transaction.title}</h2>
          
          {/* Amount */}
          <p className={cn(
            "text-3xl font-bold",
            getTextColor()
          )}>
            {formattedCurrency}
          </p>
        </DialogHeader>
        
        {/* Details section - now using ScrollArea component properly */}
        <ScrollArea className="flex-1 px-6 py-4">
          <motion.div
            className="pr-4 space-y-5"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            {/* Date */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Date</span>
              </div>
              <span className="text-foreground">{formattedDate}</span>
            </div>
            
            <Separator className="bg-border" />
            
            {/* Show different details for transfer transactions */}
            {transaction.transferType === 'transfer' ? (
              <>
                {/* Transfer Visual Flow */}
                <div className="py-3">
                  <div className="flex flex-col items-center justify-between gap-5">
                    {/* From Account Box */}
                    <div className="w-full flex items-center p-3 bg-muted/30 rounded-md border border-border">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{transaction.fromAsset}</div>
                        <div className="text-xs text-muted-foreground">Source Account</div>
                      </div>
                    </div>
                    
                    {/* Arrow Connector */}
                    <div className="flex flex-col items-center justify-center -my-1">
                      <ArrowDownRight className="h-6 w-6 text-blue-500 rotate-45" />
                    </div>
                    
                    {/* To Account Box */}
                    <div className="w-full flex items-center p-3 bg-muted/30 rounded-md border border-border">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{transaction.toAsset}</div>
                        <div className="text-xs text-muted-foreground">Destination Account</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-border" />
                
                {/* Transfer Type */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Transfer Type</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border-blue-200">
                      Internal Transfer
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Account - reorganized with label on left and value on right */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getAccountIcon(effectiveAccount as AccountType | string | null | undefined)}
                    <span className="font-medium">Account</span>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground">{accountInfo.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {accountInfo.type}
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-border" />
                
                {/* Category - reorganized with label on left and value on right */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Category</span>
                  </div>
                  <span className="text-foreground">{categoryName}</span>
                </div>
                
                {/* Only show payment method if it exists and category is not Transfer */}
                {transaction.paymentMethod && transaction.category !== "Transfer" && (
                  <>
                    <Separator className="bg-border" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Payment Method</span>
                      </div>
                      <span className="text-foreground">{transaction.paymentMethod}</span>
                    </div>
                  </>
                )}
              </>
            )}
            
            {transaction.description && (
              <>
                <Separator className="bg-border" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Description</span>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30 border border-border/60 text-foreground/90 text-sm">
                    {transaction.description}
                  </div>
                </div>
              </>
            )}

            {/* Extra space at the bottom for comfortable scrolling */}
            <div className="h-4"></div>
          </motion.div>
        </ScrollArea>
        
        {/* Footer with actions - now sticky */}
        <DialogFooter className="px-6 py-4 bg-background border-t border-border mt-auto sticky bottom-0 flex-shrink-0 z-30 flex-row justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-9"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-9"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetails; 