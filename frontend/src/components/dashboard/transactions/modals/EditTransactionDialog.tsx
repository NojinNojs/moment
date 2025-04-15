import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { PencilLine, X, Loader2 } from "lucide-react";
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
  isSubmitting?: boolean;
}

/**
 * EditTransactionDialog - Desktop dialog for editing transactions
 * Features:
 * - Modal dialog optimized for desktop
 * - Supports both income and expense types
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
  accounts,
  isSubmitting = false
}: EditTransactionDialogProps) {
  // Animation variants
  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }
  };
  
  // Get button text based on transaction type
  const buttonText = type === 'income' ? 'Save Income' : 'Save Expense';
  
  // Determine button color based on type
  const buttonClass = type === 'income' 
    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
    : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 overflow-hidden max-h-[90vh] h-[90vh] flex flex-col">
        <DialogHeader className="bg-background pt-6 pb-4 border-b px-6 sticky top-0 z-10 flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
              initial="initial"
              animate="animate"
              variants={iconAnimation}
            >
              <PencilLine className="h-5 w-5 text-muted-foreground" />
            </motion.div>
            <DialogTitle className="text-xl">Edit Transaction</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">Update transaction details</p>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          <motion.div
            className="space-y-5 pr-4"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <TransactionForm
              type={type}
              transactionAmount={transactionAmount}
              transactionTitle={transactionTitle}
              transactionCategory={transactionCategory}
              transactionDescription={transactionDescription}
              transactionDate={transactionDate}
              transactionAccount={transactionAccount}
              formErrors={formErrors}
              onAmountChange={onAmountChange}
              onTitleChange={onTitleChange}
              onCategoryChange={onCategoryChange}
              onDescriptionChange={onDescriptionChange}
              onDateChange={onDateChange}
              onAccountChange={onAccountChange}
              accounts={accounts}
            />
            
            {/* Extra space at bottom */}
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
            className={`${buttonClass} font-medium w-full shadow-md hover:shadow-lg transition-all h-11`}
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

export default EditTransactionDialog; 