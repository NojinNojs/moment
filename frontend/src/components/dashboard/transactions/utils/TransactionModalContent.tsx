import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ArrowUpRight, ArrowDownRight, ChevronLeft, Loader2 } from "lucide-react";
import { TransactionForm } from "../forms/TransactionForm";
import { motion } from "framer-motion";

interface TransactionUIComponentsProps {
  type: 'income' | 'expense';
  isMobile: boolean;
  isOpen: boolean;
  transactionAmount: string;
  transactionCategory: string;
  transactionDescription: string;
  transactionDate: string;
  formErrors: {
    amount?: string;
    category?: string;
  };
  onClose: () => void;
  onSubmit: () => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  isSubmitting: boolean;
}

/**
 * TransactionUIComponents - Handles both mobile drawers and desktop modals for transactions
 * Features:
 * - Responsive - uses Drawer on mobile, Dialog on desktop
 * - Supports both income and expense transactions
 * - Consistent UI between both variants
 * - Modern UI with the app's color palette
 * - Safe area padding for mobile devices with bottom bars
 * - Completely separate income/expense modals to prevent transition issues
 * - Enhanced with animations and professional design
 */
export const TransactionUIComponents = ({
  type,
  isMobile,
  isOpen,
  transactionAmount,
  transactionCategory,
  transactionDescription,
  transactionDate,
  formErrors,
  onClose,
  onSubmit,
  onAmountChange,
  onCategoryChange,
  onDescriptionChange,
  onDateChange,
  isSubmitting
}: TransactionUIComponentsProps) => {
  // Common form properties
  const formProps = {
    type,
    transactionAmount,
    transactionCategory,
    transactionDescription,
    transactionDate,
    formErrors,
    onAmountChange,
    onCategoryChange,
    onDescriptionChange,
    onDateChange
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

  // Mobile drawer implementation
  if (isMobile) {
    return (
      <>
        {/* Income Drawer */}
        <Drawer open={isOpen && type === 'income'} onOpenChange={onClose}>
          <DrawerContent className="bg-background border-t border-border pb-safe h-[85vh] max-h-[85vh] flex flex-col">
            <div className="relative pt-4 pb-2 px-5 flex flex-col items-center text-center flex-shrink-0">
              <motion.div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-primary/90 shadow-lg shadow-primary/20"
                initial="initial"
                animate="animate"
                variants={iconAnimation}
              >
                <ArrowUpRight className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <DrawerHeader className="text-center p-0 w-full">
                <DrawerTitle className="text-lg text-center">Add Income</DrawerTitle>
                <DrawerDescription className="opacity-80 text-xs text-center">Record a new source of income</DrawerDescription>
              </DrawerHeader>
              <button 
                onClick={onClose} 
                className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <motion.div
              className="px-4 py-2 overflow-y-auto flex-grow"
              initial="initial"
              animate="animate"
              variants={contentAnimation}
            >
              <TransactionForm {...formProps} />
            </motion.div>
            <DrawerFooter className="pt-3 px-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 mb-safe">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit();
                }} 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Income'
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Expense Drawer */}
        <Drawer open={isOpen && type === 'expense'} onOpenChange={onClose}>
          <DrawerContent className="bg-background border-t border-border pb-safe h-[85vh] max-h-[85vh] flex flex-col">
            <div className="relative pt-4 pb-2 px-5 flex flex-col items-center text-center flex-shrink-0">
              <motion.div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-destructive/90 shadow-lg shadow-destructive/20"
                initial="initial"
                animate="animate"
                variants={iconAnimation}
              >
                <ArrowDownRight className="h-7 w-7 text-destructive-foreground" />
              </motion.div>
              <DrawerHeader className="text-center p-0 w-full">
                <DrawerTitle className="text-lg text-center">Add Expense</DrawerTitle>
                <DrawerDescription className="opacity-80 text-xs text-center">Record a new expense</DrawerDescription>
              </DrawerHeader>
              <button 
                onClick={onClose} 
                className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <motion.div
              className="px-4 py-2 overflow-y-auto flex-grow"
              initial="initial"
              animate="animate"
              variants={contentAnimation}
            >
              <TransactionForm {...formProps} />
            </motion.div>
            <DrawerFooter className="pt-3 px-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 mb-safe">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit();
                }} 
                size="lg" 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Expense'
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop dialog implementation
  return (
    <>
      {/* Income Dialog */}
      <Dialog open={isOpen && type === 'income'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 overflow-hidden max-h-[95vh] flex flex-col text-center">
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center text-center flex-shrink-0">
            <motion.div
              className="w-18 h-18 rounded-full flex items-center justify-center mb-5 bg-primary/90 shadow-lg shadow-primary/20"
              initial="initial"
              animate="animate"
              variants={iconAnimation}
            >
              <ArrowUpRight className="h-9 w-9 text-primary-foreground" />
            </motion.div>
            <DialogHeader className="text-center p-0 w-full">
              <DialogTitle className="text-2xl font-semibold text-center">Add Income</DialogTitle>
              <DialogDescription className="opacity-80 mt-1 text-center">Record a new source of income</DialogDescription>
            </DialogHeader>
          </div>
          <motion.div
            className="px-8 py-4 overflow-y-auto flex-grow"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <TransactionForm {...formProps} />
          </motion.div>
          <DialogFooter className="px-8 py-5 bg-muted/30 border-t border-border mt-auto flex-shrink-0">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
              }}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Income'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isOpen && type === 'expense'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 overflow-hidden max-h-[95vh] flex flex-col text-center">
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center text-center flex-shrink-0">
            <motion.div
              className="w-18 h-18 rounded-full flex items-center justify-center mb-5 bg-destructive/90 shadow-lg shadow-destructive/20"
              initial="initial"
              animate="animate"
              variants={iconAnimation}
            >
              <ArrowDownRight className="h-9 w-9 text-destructive-foreground" />
            </motion.div>
            <DialogHeader className="text-center p-0 w-full">
              <DialogTitle className="text-2xl font-semibold text-center">Add Expense</DialogTitle>
              <DialogDescription className="opacity-80 mt-1 text-center">Record a new expense</DialogDescription>
            </DialogHeader>
          </div>
          <motion.div
            className="px-8 py-4 overflow-y-auto flex-grow"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <TransactionForm {...formProps} />
          </motion.div>
          <DialogFooter className="px-8 py-5 bg-muted/30 border-t border-border mt-auto flex-shrink-0">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
              }}
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Keep TransactionModals as an alias for backward compatibility
export const TransactionModals = TransactionUIComponents;

export default TransactionUIComponents; 