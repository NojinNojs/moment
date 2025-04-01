import { useState, useEffect, useRef } from "react";
import { Trash2, AlertTriangle, Clock, Undo, X, CheckCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Transaction } from "../list/TransactionItem";

// Deletion timeout in milliseconds (5 seconds)
const DELETION_TIMEOUT = 5000;
const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10ms for smooth animation

// Define toast props type for the Sonner API
type ToastProps = { id?: string; visible?: boolean };

interface DeleteTransactionDialogProps {
  transaction: Transaction;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: number) => void;
  onSoftDelete: (id: number, isSoftDeleted: boolean) => void;
}

/**
 * DeleteTransactionDialog - Confirmation dialog for transaction deletion
 * Features:
 * - Shows a confirmation dialog before permanently deleting
 * - Implements soft delete with an undo timer
 * - Visual feedback throughout the deletion process
 */
export function DeleteTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  onConfirm,
  onSoftDelete
}: DeleteTransactionDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [, setProgressValue] = useState(0); // Using underscore to indicate unused state
  const [timeLeft, setTimeLeft] = useState(5); // Seconds left for display
  const [showUndoAlert, setShowUndoAlert] = useState(false);
  
  const deletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const toastIdRef = useRef<string | number | null>(null);
  
  // Clear timers when component unmounts or when dialog closes
  useEffect(() => {
    return () => {
      if (deletionTimerRef.current) {
        clearTimeout(deletionTimerRef.current);
        deletionTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);
  
  // Reset state when dialog state changes
  useEffect(() => {
    if (!isOpen) {
      if (!showUndoAlert) {
        // Only reset if we're not showing the undo alert
        resetState();
      }
    }
  }, [isOpen, showUndoAlert]);
  
  const resetState = () => {
      setDeleting(false);
    setProgressValue(0);
    setTimeLeft(5);
    setShowUndoAlert(false);
    
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  const startDeletion = () => {
    setDeleting(true);
    setShowUndoAlert(true);
    startTimeRef.current = Date.now();
    
    // Close the confirmation dialog
    onOpenChange(false);
    
    // Immediately soft delete the transaction
    onSoftDelete(transaction.id, true);
    
    // Set up a timer to update the progress bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgressValue = Math.min((elapsed / DELETION_TIMEOUT) * 100, 100);
      setProgressValue(newProgressValue);
      
      // Update the displayed time left (showing integer seconds)
      const secondsLeft = Math.ceil((DELETION_TIMEOUT - elapsed) / 1000);
      if (secondsLeft !== timeLeft) {
        setTimeLeft(secondsLeft);
      }
      
      if (newProgressValue >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
    
    // Set up the actual deletion timer
    deletionTimerRef.current = setTimeout(() => {
      completeTransactionDeletion();
    }, DELETION_TIMEOUT);
    
    // Show the toast with undo button
    showUndoToast();
  };

  const completeTransactionDeletion = () => {
    // Permanently delete the transaction
    onConfirm(transaction.id);
    showDeletionCompletedToast();
    resetState();
  };

  const handleUndo = () => {
    // Clear the deletion timer
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    
    // Clear the progress timer
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Restore the transaction (remove soft delete flag)
    onSoftDelete(transaction.id, false);
    
    // Show success undo toast
    toast.success(`Deletion cancelled`, {
      description: `"${transaction.title}" was restored`,
      icon: <Undo className="h-4 w-4" />,
      action: {
        label: "Dismiss",
        onClick: () => {}
      },
      position: "bottom-right",
      className: "mb-safe-area-inset-bottom"
    });
    
    // Reset state
    resetState();
  };
  
  const handleDeleteNow = () => {
    // Clear any existing timers
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Dismiss the current toast
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    // Perform the deletion immediately
    completeTransactionDeletion();
  };
  
  const showUndoToast = () => {
    // @ts-expect-error - Sonner API type doesn't match the expected usage pattern
    const id = toast.custom((t: ToastProps) => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "pointer-events-auto bg-background border w-full max-w-md rounded-lg shadow-lg overflow-hidden mb-safe-area-inset-bottom",
          "transition-all duration-200",
          t.visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="w-full bg-destructive/5 h-1.5">
          <motion.div 
            className="h-full bg-destructive"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: DELETION_TIMEOUT / 1000, ease: "linear" }}
          />
        </div>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-destructive/15 p-2 rounded-full">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3 w-full">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">Deleting Transaction</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This action can be undone
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (t.id) toast.dismiss(t.id);
                    handleUndo();
                  }}
                  className="bg-transparent text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-3 py-1 px-3 bg-muted/20 rounded-md">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-shrink-0 w-1 h-8 rounded-full",
                    transaction.type === "income" ? "bg-primary/20" : "bg-destructive/20"
                  )} />
                  <p className="text-sm font-medium truncate">{transaction.title}</p>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end space-x-2">
                <Button 
                  onClick={() => {
                    if (t.id) toast.dismiss(t.id);
                    handleUndo();
                  }}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Undo className="h-3 w-3 mr-1" /> Undo
                </Button>
                <Button 
                  onClick={() => {
                    if (t.id) toast.dismiss(t.id);
                    handleDeleteNow();
                  }}
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs"
                >
                  Delete Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ), { 
      duration: Infinity,
      position: "bottom-right"
    });
    
    toastIdRef.current = id;
  };
  
  const showDeletionCompletedToast = () => {
    // @ts-expect-error - Sonner API type doesn't match the expected usage pattern
    toast.custom((t: ToastProps) => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "pointer-events-auto bg-background border w-full max-w-md rounded-lg shadow-lg overflow-hidden mb-safe-area-inset-bottom",
          "transition-all duration-200",
          t.visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 w-full">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-foreground">Transaction Deleted</p>
                <button 
                  onClick={() => t.id && toast.dismiss(t.id)}
                  className="bg-transparent text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                "{transaction.title}" has been permanently deleted
              </p>
              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => t.id && toast.dismiss(t.id)}
                  className="h-8 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ), { 
      duration: 5000,
      position: "bottom-right"
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg border-none gap-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-red-500/90 to-red-600/90 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute right-12 bottom-0 w-16 h-16 rounded-full bg-white/10 blur-md" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Delete Transaction</h2>
              <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Undoable for 5 seconds
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <AlertDialogDescription className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              You're about to delete <span className="font-semibold text-foreground">{transaction.title}</span>.
              This will remove the transaction from your history.
            </p>
            
            {/* Warning box */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Before deleting</p>
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-400/80">
                  You'll be able to cancel this action for 5 seconds after deletion.
                  {transaction.amount !== 0 && (
                    <> This transaction has an amount of <span className="font-semibold">${Math.abs(transaction.amount).toLocaleString()}</span>.</>
                  )}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          
          {/* Buttons with hover animations */}
          <div className="flex flex-col space-y-2 mt-6">
            <Button 
              onClick={startDeletion}
              className="relative group overflow-hidden h-10 gap-2"
              variant="destructive"
              disabled={deleting}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Yes, delete this transaction</span>
              </span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="h-10 text-muted-foreground hover:text-foreground transition-colors"
              disabled={deleting}
            >
              Cancel, keep this transaction
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTransactionDialog; 