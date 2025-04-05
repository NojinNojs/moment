import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";
import { Button } from "@/components/ui/button";

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

// Update getAccountDisplay to handle deleted accounts
const getAccountDisplay = (account: AccountObject | string | null | undefined): React.ReactNode => {
  if (!account) {
    return <span className="text-muted-foreground">No account</span>;
  }
  
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
  
  return account;
};

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
  hideDate = false
}: TransactionItemProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { formatCurrency } = useCurrencyFormat();
  
  // Determine if this is income, expense, or transfer
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.transferType === 'transfer';
  
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
  
  // Limit description to 3 words max
  const limitedDescription = limitWordsText(transaction.title, 3);
  
  // Safe click handler for transaction details
  const handleTransactionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setDetailsOpen(true);
    } catch (error) {
      console.error("Error opening transaction details:", error);
    }
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
                {/* Simplified icon - just a div with text */}
                <div className={`text-xs font-bold ${isIncome ? 'text-green-600' : isTransfer ? 'text-blue-600' : 'text-red-600'}`}>
                  {isIncome ? '↑' : isTransfer ? '↔' : '↓'}
                </div>
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
                    {getCategoryDisplayName(transaction.category)}
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
        </Card>
      </motion.div>
      
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
             onClick={() => setDetailsOpen(false)}>
          <div className="bg-background rounded-lg shadow-lg p-4 max-w-md w-full mx-4"
               onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{transaction.title}</h3>
            <p className="mb-4">{transaction.description || 'No description'}</p>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="text-muted-foreground">Amount:</div>
              <div className={getAmountColor()}>{formattedAmount}</div>
              
              <div className="text-muted-foreground">Type:</div>
              <div>{isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense'}</div>
              
              <div className="text-muted-foreground">Date:</div>
              <div>{formattedDate}</div>
              
              <div className="text-muted-foreground">Category:</div>
              <div>{getCategoryDisplayName(transaction.category)}</div>
              
              {transaction.account && (
                <>
                  <div className="text-muted-foreground">Account:</div>
                  <div>{getAccountDisplay(transaction.account)}</div>
                </>
              )}
              
              {transaction.status && (
                <>
                  <div className="text-muted-foreground">Status:</div>
                  <div>{transaction.status}</div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              {onEditTransaction && (
                <Button variant="outline" 
                        onClick={() => {
                          onEditTransaction(transaction.id);
                          setDetailsOpen(false);
                        }}>
                  Edit
                </Button>
              )}
              {onDeleteTransaction && (
                <Button variant="destructive"
                        onClick={() => {
                          onDeleteTransaction(transaction.id);
                          setDetailsOpen(false);
                        }}>
                  Delete
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Only export TransactionItem once 
export { TransactionItem }; 