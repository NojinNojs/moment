import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, X, Loader2 } from "lucide-react";
import { TransactionForm } from "../forms/TransactionForm";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddTransactionDialogProps {
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
  isSubmitting?: boolean;
}

/**
 * AddTransactionDialog - Desktop dialog for adding income or expense transactions
 * Features:
 * - Modal dialog optimized for desktop
 * - Supports both income and expense types
 * - Consistent UI with the app design
 * - Enhanced with animations
 */
export function AddTransactionDialog({
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
  accounts,
  isSubmitting = false
}: AddTransactionDialogProps) {
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
    useAutoCategory: true,
    onAutoCategorizationChange: () => {}
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

  // Determine icon and colors based on transaction type
  const iconBgColor = type === 'income' ? 'bg-primary/90' : 'bg-destructive/90';
  const iconShadow = type === 'income' ? 'shadow-primary/20' : 'shadow-destructive/20';
  const iconTextColor = type === 'income' ? 'text-primary-foreground' : 'text-destructive-foreground';
  const buttonBgColor = type === 'income' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90';
  const buttonTextColor = type === 'income' ? 'text-primary-foreground' : 'text-destructive-foreground';

  // Get title and description based on type
  const title = type === 'income' ? 'Add Income' : 'Add Expense';
  const description = type === 'income' 
    ? 'Record a new source of income' 
    : 'Record a new expense';
  const buttonText = type === 'income' ? 'Save Income' : 'Save Expense';

  // Get icon based on type
  const icon = type === 'income' 
    ? <ArrowUpRight className={`h-9 w-9 ${iconTextColor}`} /> 
    : <ArrowDownRight className={`h-9 w-9 ${iconTextColor}`} />;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] w-[90vw] bg-background border border-border p-0 overflow-hidden max-h-[90vh] h-[90vh] flex flex-col text-center">
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
            {icon}
          </motion.div>
          
          <DialogTitle className="text-xl font-semibold text-center break-words w-full max-w-full">{title}</DialogTitle>
          <p className="opacity-80 mt-1 text-center break-words w-full max-w-full">{description}</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          <motion.div
            className="pr-4 space-y-5 w-full max-w-full"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
            style={{ maxWidth: "100%", width: "100%" }}
          >
            <TransactionForm {...formProps} accounts={accounts} />
            
            {/* Extra space at the bottom for comfortable scrolling */}
            <div className="h-4"></div>
          </motion.div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 z-20">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitting) {
                onSubmit();
              }
            }}
            size="lg"
            className={`${buttonBgColor} ${buttonTextColor} font-medium w-full shadow-md hover:shadow-lg transition-all h-11`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransactionDialog; 