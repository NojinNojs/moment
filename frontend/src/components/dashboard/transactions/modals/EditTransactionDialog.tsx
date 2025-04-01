import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Pencil, X } from "lucide-react";
import { TransactionForm } from "../forms/TransactionForm";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditTransactionDialogProps {
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
 * EditTransactionDialog - Desktop dialog for editing income or expense transactions
 * Features:
 * - Modal dialog optimized for desktop
 * - Supports editing both income and expense types
 * - Consistent UI with the app design
 * - Enhanced with animations
 */
export function EditTransactionDialog({
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
}: EditTransactionDialogProps) {
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
    onAccountChange
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 overflow-hidden max-h-[90vh] h-[90vh] flex flex-col text-center">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 z-10 border-b px-6 flex flex-col items-center text-center flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <motion.div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${iconBgColor} shadow-lg ${iconShadow}`}
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <Pencil className={`h-8 w-8 ${iconTextColor}`} />
          </motion.div>
          
          <DialogTitle className="text-xl font-semibold text-center">{title}</DialogTitle>
          <p className="opacity-80 mt-1 text-center">{description}</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          <motion.div
            className="pr-4 space-y-5"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <TransactionForm {...formProps} accounts={accounts} />
            
            {/* Extra space at the bottom for comfortable scrolling */}
            <div className="h-4"></div>
          </motion.div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 z-20">
          <Button
            onClick={onSubmit}
            size="lg"
            className={`${buttonBgColor} ${buttonTextColor} font-medium w-full shadow-md hover:shadow-lg transition-all h-11`}
          >
            Update Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditTransactionDialog; 