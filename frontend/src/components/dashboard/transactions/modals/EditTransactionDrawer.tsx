import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ChevronLeft, PencilLine, Loader2 } from "lucide-react";
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
  isSubmitting?: boolean;
}

/**
 * EditTransactionDrawer - Mobile drawer for editing transactions
 */
export function EditTransactionDrawer({
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
}: EditTransactionDrawerProps) {
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
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh] max-h-[85vh] bg-background border-t border-border pb-safe flex flex-col">
        <DrawerHeader className="flex-shrink-0 border-b pb-3 pt-4 px-5 relative">
          <button 
            onClick={onClose} 
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-1 mt-1">
            <motion.div
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              initial="initial"
              animate="animate"
              variants={iconAnimation}
            >
              <PencilLine className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <DrawerTitle>Edit Transaction</DrawerTitle>
          </div>
          <DrawerDescription className="text-xs">Update transaction details</DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 py-4 overflow-auto">
          <motion.div
            className="pr-2 space-y-5"
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
        
        <DrawerFooter className="flex-shrink-0 border-t bg-muted/30 pt-4 pb-6 px-4 mt-auto mb-safe z-10">
          <Button
            onClick={() => {
              if (!isSubmitting) {
                onSubmit();
              }
            }}
            size="lg"
            className={`${buttonClass} font-medium w-full shadow-md hover:shadow-lg transition-all h-12`}
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
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default EditTransactionDrawer; 