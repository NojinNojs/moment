import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Pencil, ChevronLeft } from "lucide-react";
import { TransactionForm } from "../forms/TransactionForm";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditTransactionDrawerProps {
  type: 'income' | 'expense';
  isOpen: boolean;
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
  };
  onClose: () => void;
  onSubmit: () => void;
  onAmountChange: (value: string) => void;
  onTitleChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAccountChange?: (value: string) => void;
  accounts?: { id?: string; _id?: string; name: string; type: string; balance?: number }[];
}

/**
 * EditTransactionDrawer - Mobile drawer for editing income or expense transactions
 * Features:
 * - Mobile-optimized drawer
 * - Supports editing both income and expense types
 * - Consistent UI with the app design
 * - Enhanced with animations
 * - Better mobile UX with safe area
 */
export default function EditTransactionDrawer({
  type,
  isOpen,
  transactionAmount,
  transactionTitle,
  transactionCategory,
  transactionDescription,
  transactionDate,
  transactionAccount,
  formErrors,
  onClose,
  onSubmit,
  onAmountChange,
  onTitleChange,
  onCategoryChange,
  onDescriptionChange,
  onDateChange,
  onAccountChange,
  accounts
}: EditTransactionDrawerProps) {
  // Common form properties
  const formProps = {
    type,
    transactionAmount,
    transactionTitle,
    transactionCategory,
    transactionDescription,
    transactionDate,
    transactionAccount,
    formErrors,
    onAmountChange,
    onTitleChange,
    onCategoryChange,
    onDescriptionChange,
    onDateChange,
    onAccountChange,
    accounts
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

  // Determine colors based on transaction type
  const iconBgColor = type === 'income' ? 'bg-primary/90' : 'bg-destructive/90';
  const iconShadow = type === 'income' ? 'shadow-primary/20' : 'shadow-destructive/20';
  const iconTextColor = type === 'income' ? 'text-primary-foreground' : 'text-destructive-foreground';
  const buttonBgColor = type === 'income' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90';
  const buttonTextColor = type === 'income' ? 'text-primary-foreground' : 'text-destructive-foreground';

  // Get title and description based on type
  const title = type === 'income' ? 'Edit Income' : 'Edit Expense';
  const description = type === 'income' 
    ? 'Update your income transaction' 
    : 'Update your expense transaction';

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh] max-h-[85vh] bg-background border-t border-border pb-safe flex flex-col">
        <DrawerHeader className="flex-shrink-0 text-center flex flex-col items-center border-b pb-3 pt-4 px-5 relative">
          <button 
            onClick={onClose} 
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <motion.div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${iconBgColor} shadow-lg ${iconShadow}`}
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <Pencil className={`h-7 w-7 ${iconTextColor}`} />
          </motion.div>
          
          <DrawerTitle className="text-lg text-center">{title}</DrawerTitle>
          <DrawerDescription className="opacity-80 text-xs text-center">{description}</DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 py-4 overflow-auto">
          <motion.div
            className="pr-2 space-y-5"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <TransactionForm {...formProps} />
            
            {/* Extra space at the bottom for comfortable scrolling */}
            <div className="h-4"></div>
          </motion.div>
        </ScrollArea>
        
        <DrawerFooter className="flex-shrink-0 border-t bg-muted/30 pt-4 pb-6 px-4 mt-auto mb-safe z-10">
          <Button
            onClick={onSubmit} 
            size="lg"
            className={`${buttonBgColor} ${buttonTextColor} font-medium w-full shadow-md hover:shadow-lg transition-all h-12`}
          >
            Update Transaction
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 