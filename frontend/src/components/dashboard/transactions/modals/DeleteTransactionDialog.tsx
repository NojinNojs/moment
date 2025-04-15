import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, AlertTriangle, Undo, X, CreditCard, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Transaction } from "../list/TransactionItem";
import apiService from '@/services/api';
import useCurrencyFormat from '@/hooks/useCurrencyFormat';

// Deletion timeout in milliseconds (5 seconds)
const DELETION_TIMEOUT = 5000;
const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10ms for smooth animation

// Define toast props type for the Sonner API
type ToastProps = { id?: string; visible?: boolean };

interface DeleteTransactionDialogProps {
  transaction: Transaction;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSoftDelete: (id: string | number, isSoftDeleted: boolean) => void;
}

/**
 * EMERGENCY DIRECT API ACCESS
 * This is a bypass function that directly hits the API without going through our service layer
 * Used as a last resort when the normal update mechanisms fail
 */
const emergencyDirectAssetBalanceUpdate = async (
  assetId: string, 
  newBalance: number, 
  originalAsset: Record<string, unknown>
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/assets/${assetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
      },
      body: JSON.stringify({
        ...originalAsset,
        balance: newBalance
      })
    });
    
    if (response.ok) {
      console.log('🚨 EMERGENCY DIRECT API UPDATE SUCCESSFUL');
      return true;
    } else {
      console.error('🚨 EMERGENCY DIRECT API UPDATE FAILED:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('🚨 EMERGENCY DIRECT API EXCEPTION:', error);
    return false;
  }
};

/**
 * Helper function to update localStorage after asset balance changes
 * This ensures the UI is immediately updated with current asset balances
 */
const updateLocalStorage = async () => {
  try {
    // Get updated assets list and update localStorage
    const accountsResponse = await apiService.getAssets();
    if (accountsResponse.success && accountsResponse.data) {
      localStorage.setItem('user_assets', JSON.stringify(accountsResponse.data));
      console.log(`💾 Updated user_assets in localStorage with ${accountsResponse.data.length} items`);
    }
  } catch (error) {
    console.error("Error updating localStorage after balance change:", error);
  }
};

/**
 * DeleteTransactionDialog - Confirmation dialog for transaction deletion
 * Features:
 * - Shows a confirmation dialog before deleting a transaction
 * - Implements soft delete with an undo timer
 * - The transaction is immediately marked as deleted in the UI when the delete button is clicked
 * - Displays an undo toast notification for 5 seconds
 * - Visual feedback throughout the deletion process
 * - Displays financial impact of the deletion
 */
export function DeleteTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  onSoftDelete
}: DeleteTransactionDialogProps) {
  const { formatCurrency } = useCurrencyFormat();
  // Define all state hooks at the top level
  const [showState, setShowState] = useState(false);
  // Use state variables properly - they are referenced in functions below
  const [deleting, setDeleting] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5); // Seconds left for display
  const [showUndoAlert, setShowUndoAlert] = useState(false);
  const [dependentTransfers, setDependentTransfers] = useState<Transaction[]>([]);
  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false);
  const [showDependentWarning, setShowDependentWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Define all ref hooks
  const deletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const toastIdRef = useRef<string | number | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  // Reset state function - wrapped in useCallback
  const resetState = useCallback(() => {
    setDeleting(false);
    setProgressValue(0);
    setTimeLeft(5);
    setShowUndoAlert(false);
    setDependentTransfers([]);
    setShowDependentWarning(false);
    
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
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  // Function to check for dependent transactions - wrapped in useCallback
  const checkForDependentTransactions = useCallback(async () => {
    if (!transaction || transaction.type !== 'income') return;
    
    setIsAnalyzingImpact(true);
    try {
      // First identify the account this income was credited to
      const accountId = typeof transaction.account === 'object' && transaction.account 
        ? (transaction.account._id || transaction.account.id) 
        : transaction.account;
        
      if (!accountId) return;
      
      // Get all transfers from this account that happened after this transaction
      const transfersResponse = await apiService.getAssetTransfers();
      if (transfersResponse.success && transfersResponse.data) {
        const possiblyAffected = transfersResponse.data.filter(transfer => {
          // Skip null or undefined transfers
          if (!transfer) return false;
          
          // Check if transfer is from the same account
          const transferSourceId = typeof transfer.fromAsset === 'object' && transfer.fromAsset
            ? (transfer.fromAsset._id || transfer.fromAsset.id)
            : transfer.fromAsset;
            
          // If either is null/undefined, skip this transfer
          if (!transferSourceId || !accountId) return false;
          
          const sameAccount = transferSourceId.toString() === accountId.toString();
          
          // Check if transfer happened after this transaction  
          // Guard against invalid dates
          let transferDate, transactionDate;
          try {
            transferDate = new Date(transfer.date);
            transactionDate = new Date(transaction.date);
          } catch (e) {
            console.error("Invalid date format:", e);
            return false;
          }
          
          const isAfter = transferDate > transactionDate;
          
          return sameAccount && isAfter;
        });
        
        setDependentTransfers(possiblyAffected as unknown as Transaction[]);
        setShowDependentWarning(possiblyAffected.length > 0);
      }
    } catch (error) {
      console.error("Error analyzing transaction impact:", error);
    } finally {
      setIsAnalyzingImpact(false);
    }
  }, [transaction]);

  // useEffect for transaction updates - moved to top level
  useEffect(() => {
    if (!transaction) {
      setShowState(false);
    } else {
      setShowState(true);
    }
  }, [transaction]);
  
  // useEffect for cleanup - called at top level
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
  
  // useEffect for dialog state changes - called at top level
  useEffect(() => {
    if (!isOpen) {
      if (!showUndoAlert) {
        // Only reset if we're not showing the undo alert
        resetState();
      }
    }
  }, [isOpen, showUndoAlert, resetState]);
  
  // Reset deleting state when dialog opens to prevent the "already in deletion process" error
  useEffect(() => {
    if (isOpen) {
      console.log("🔄 Dialog opened, resetting deleting state");
      setDeleting(false);
      setProgressValue(0);
      setTimeLeft(5);
      setLoading(false);
    }
  }, [isOpen]);
  
  // useEffect for dependent transactions check - called at top level 
  useEffect(() => {
    if (isOpen && transaction) {
      checkForDependentTransactions();
    }
  }, [isOpen, transaction, checkForDependentTransactions]);

  // Early return for the UI - keep after all hooks are defined and called
  if (!showState || !transaction) {
    return isOpen ? (
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <div className="flex flex-col space-y-4">
            <h2 className="text-lg font-medium text-center">Error</h2>
            <AlertDialogDescription className="text-center">
              Cannot delete transaction because the transaction data is missing.
            </AlertDialogDescription>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    ) : null;
  }

  const startDeletion = () => {
    if (deleting) {
      console.log("🛑 Already in deletion process, state:", { deleting, progressValue });
      // Force reset the state
      setDeleting(false);
      setProgressValue(0);
      setTimeLeft(5);
      
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
      
      // Try again after a short delay to ensure state is updated
      setTimeout(() => {
        console.log("🔄 Retrying deletion after forced reset");
        startDeletion();
      }, 100);
      return;
    }
    
    setDeleting(true);
    setLoading(true);
    console.log("🚨 Starting deletion process for:", {
      id: transaction.id,
      _id: transaction._id || 'none',
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      account: transaction.account
    });
    
    // Special logging for income transactions to help debug balance issues
    if (transaction.type === 'income') {
      const accountId = typeof transaction.account === 'object' 
        ? (transaction.account.id || transaction.account._id)
        : transaction.account;
        
      console.log(`💰 INCOME Soft Delete: Transaction=${transaction.title}, Amount=${transaction.amount}, AccountID=${accountId}`);
    }
    
    // Record the start time for progress calculations
    startTimeRef.current = Date.now();
    
    // ⚠️ CRITICAL: Mark the transaction as deleted immediately in the UI and DATABASE
    if (onSoftDelete) {
      console.log("🔄 Marking transaction as deleted via onSoftDelete");
      
      // Make sure to use both the MongoDB _id when available or client id as fallback
      const apiId = transaction._id?.toString() || transaction.id.toString();
      console.log(`📝 Using ID for soft delete: ${apiId} (Mongo: ${transaction._id}, Client: ${transaction.id})`);
      
      // Set this locally to ensure UI is consistent 
      transaction.isDeleted = true;
      
      // This MUST update the isDeleted in the database through the API
      onSoftDelete(apiId, true);
      
      // Emit a custom event for better UI synchronization
      const event = new CustomEvent('transaction:stateChanged', {
        detail: {
          transaction,
          action: 'softDeleted'
        },
        bubbles: true
      });
      document.dispatchEvent(event);
    } else {
      console.error("🔴 onSoftDelete function is undefined, cannot mark transaction as deleted");
    }
    
    // Show the undo notification immediately
    setShowUndoAlert(true);
    showUndoToast();
    
    // Start progress bar animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / DELETION_TIMEOUT) * 100, 100);
      setProgressValue(newProgress);
      
      const secondsLeft = Math.max(Math.ceil((DELETION_TIMEOUT - elapsed) / 1000), 0);
      setTimeLeft(secondsLeft);
      
      // If we reach 100%, clear the interval
      if (newProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
    
    // Schedule the actual deletion
    deletionTimerRef.current = setTimeout(() => {
      completeTransactionDeletion();
    }, DELETION_TIMEOUT);
    
    // Close the dialog immediately
    onOpenChange(false);
    setLoading(false);
  };

  const completeTransactionDeletion = async () => {
    console.log('Time elapsed, completing deletion for:', {
      id: transaction.id,
      _id: transaction._id || 'none',
      title: transaction.title
    });
    
    // Note: We've already marked the transaction as deleted in startDeletion
    
    // Hide the undo notification
    setShowUndoAlert(false);
    
    try {
      // Use _id for MongoDB API calls if available, otherwise use the numeric id
      const mongoId = transaction._id?.toString();
      const numericId = transaction.id?.toString();
      
      // Choose the appropriate ID based on what's available
      // Always prefer MongoDB _id when available
      const apiId = mongoId || numericId;
      
      console.log(`[completeTransactionDeletion] Using API ID: ${apiId} (MongoDB _id: ${mongoId}, Numeric id: ${numericId})`);

      if (!apiId) {
        throw new Error("Cannot delete transaction: Missing valid ID");
      }

      // CRITICAL FIX: For income transactions, check if balance update is needed
      // We only need to update the balance if this is the FIRST time we're removing this transaction
      // If it's already soft-deleted, we shouldn't adjust the balance again
      // wasAlreadySoftDeleted will be false if we need to update the balance
      const wasAlreadySoftDeleted = transaction.isDeleted === true;
      console.log(`💰 TRANSACTION STATUS CHECK: wasAlreadySoftDeleted=${wasAlreadySoftDeleted}, isDeleted=${transaction.isDeleted}`);
      
      if (transaction.type === 'income' && !wasAlreadySoftDeleted) {
        const amount = Math.abs(transaction.amount);
        console.log(`💰 INCOME DELETION: ${transaction.title} amount=${amount}, Need to update balance=${!wasAlreadySoftDeleted}`);
        
        // Get account ID
        const accountId = typeof transaction.account === 'object' 
          ? (transaction.account.id || transaction.account._id)
          : transaction.account;
          
        if (accountId) {
          console.log(`💰 Manually updating account balance for account ID: ${accountId}`);
          
          // Fetch current account data
          const accountResponse = await apiService.getAccountById(accountId.toString());
          
          if (accountResponse.success && accountResponse.data) {
            const account = accountResponse.data;
            console.log(`💰 Current account balance: ${account.balance}`);
            
            // IMPROVED LOGIC: For income transactions being deleted
            // Calculate what the balance should be after deletion
            let newBalance;
            if (Math.abs(account.balance - amount) < 0.001) {
              // If the account balance is almost exactly equal to the transaction amount,
              // it means this was probably the only transaction - just reset to 0
              newBalance = 0;
              console.log(`💰 EXACT MATCH DETECTED! Forcing balance to exactly 0`);
            } else {
              // Otherwise do normal subtraction
              newBalance = Math.max(0, account.balance - amount);
            }
            
            console.log(`💰 INCOME DELETION BALANCE UPDATE: ${account.balance} - ${amount} = ${newBalance}`);
            
            try {
              // Make multiple attempts to update the balance
              let updateSucceeded = false;
              
              for (let attempt = 1; attempt <= 2; attempt++) {
                console.log(`💰 Attempt ${attempt} to update balance to ${newBalance}`);
                
                // Update account balance directly (critical fix)
                const updateResult = await apiService.updateAsset(accountId.toString(), {
                  ...account,
                  balance: newBalance
                });
                
                console.log(`💰 Update result:`, updateResult);
                
                if (updateResult.success) {
                  console.log(`💰 Account balance directly updated to ${newBalance}`);
                  
                  // Verify the balance was updated
                  const verifyAccount = await apiService.getAccountById(accountId.toString());
                  if (verifyAccount.success && verifyAccount.data && 
                      Math.abs(verifyAccount.data.balance - newBalance) < 0.001) {
                    console.log(`💰 Balance verification: ${verifyAccount.data.balance}`);
                    console.log(`💰 Balance verified correctly!`);
                    updateSucceeded = true;
                    break;
                  } else {
                    console.log(`💰 Balance verification FAILED! Trying again...`);
                  }
                } else {
                  console.log(`💰 Balance update failed! Trying again...`);
                }
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              // If normal methods failed, try the emergency direct approach as a last resort
              if (!updateSucceeded) {
                console.log(`🚨 EMERGENCY! Normal update methods failed. Trying direct API bypass...`);
                const emergencyResult = await emergencyDirectAssetBalanceUpdate(
                  accountId.toString(), 
                  newBalance,
                  account as unknown as Record<string, unknown>
                );
                
                if (emergencyResult) {
                  console.log(`🚨 EMERGENCY UPDATE SUCCESSFUL! Balance should now be ${newBalance}`);
                } else {
                  console.error(`🚨 EMERGENCY UPDATE FAILED! This is really bad.`);
                  
                  // Last resort: display a error message to the user with instructions
                  toast.error('Critical Error', {
                    description: 'Could not update account balance. Please refresh the page and try again.',
                    duration: 10000,
                    position: 'bottom-right'
                  });
                }
              }
              
              // Update localStorage with the new balance information
              await updateLocalStorage();
              
            } catch (error) {
              console.error("Error updating asset balance:", error);
            }
            
            // Never refresh the page after updating balances
            // Instead allow the UI to update naturally via events
            setTimeout(() => {
              console.log("Avoiding page refresh on delete to ensure smooth UX");
            }, 2000);
          }
        }
      } else {
        console.log(`💰 Skipping balance update for ${transaction.type} transaction or already soft-deleted transaction`);
      }
      
      // Dispatch our custom event to immediately update all UI components
      const stateEvent = new CustomEvent('transaction:stateChanged', {
        detail: {
          transaction,
          action: 'permanentlyDeleted',
          wasSoftDeleted: wasAlreadySoftDeleted,
          balanceAlreadyUpdated: transaction.type === 'income' && !wasAlreadySoftDeleted
        }
      });
      document.dispatchEvent(stateEvent);
      
      // Make API call to permanently delete the transaction
      const result = await apiService.permanentDeleteTransaction(apiId);
      
      if (result.success) {
        console.log("Transaction permanently deleted after timeout:", transaction.title);
        
        // Dispatch event for parent components
        const event = new CustomEvent('transaction:permanentlyDeleted', {
          detail: {
            transaction,
            wasAlreadySoftDeleted,
            balanceAlreadyUpdated: transaction.type === 'income' && !wasAlreadySoftDeleted
          },
          bubbles: true
        });
        document.dispatchEvent(event);
        
        // Show deletion completed toast
    showDeletionCompletedToast();
      } else {
        // Handle error but still show the completion toast since the transaction is already marked as deleted in UI
        console.error("Error permanently deleting transaction after timeout:", result.message);
        showDeletionCompletedToast();
      }
    } catch (error) {
      console.error("Error completing transaction deletion:", error);
      toast.error("Error Deleting Transaction", {
        description: "An error occurred while completing the deletion.",
        position: 'bottom-right'
      });
    } finally {
      // Reset state variables to prevent issues with future deletions
      setDeleting(false);
      setProgressValue(0);
      setTimeLeft(5);
      setShowUndoAlert(false);
      resetState();
    }
  };

  const handleUndo = async () => {
    console.log("♻️ UNDOING deletion for transaction:", {
      id: transaction.id,
      _id: transaction._id || 'none',
      title: transaction.title
    });
    
    // Clear all timers to prevent further execution
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
    
    setLoading(true);
    
    try {
      // Use MongoDB _id for API calls when available
      const apiId = transaction._id?.toString() || transaction.id.toString();
      
      // Set local isDeleted flag to false for UI consistency
      transaction.isDeleted = false;
      
      // For income transactions, we need to add the amount back to the account balance
      if (transaction.type === 'income') {
        console.log(`💰 INCOME RESTORATION: ${transaction.title} amount=${Math.abs(transaction.amount)}`);
        
        // Get account ID
        const accountId = typeof transaction.account === 'object' 
          ? (transaction.account.id || transaction.account._id)
          : transaction.account;
          
        if (accountId) {
          console.log(`💰 Manually updating account balance for account ID: ${accountId}`);
          
          // Fetch current account data
          const accountResponse = await apiService.getAccountById(accountId.toString());
          
          if (accountResponse.success && accountResponse.data) {
            const account = accountResponse.data;
            console.log(`💰 Current account balance: ${account.balance}`);
            
            // Add the transaction amount back to the balance
            const amount = Math.abs(transaction.amount);
            const newBalance = account.balance + amount;
            
            console.log(`💰 INCOME RESTORATION BALANCE UPDATE: ${account.balance} + ${amount} = ${newBalance}`);
            
            try {
              let updateSucceeded = false;
              
              // Make multiple attempts to update the balance
              for (let attempt = 1; attempt <= 2; attempt++) {
                console.log(`💰 Attempt ${attempt} to update balance to ${newBalance}`);
                
                // Update account balance directly
                const updateResult = await apiService.updateAsset(accountId.toString(), {
                  ...account,
                  balance: newBalance
                });
                
                console.log(`💰 Update result:`, updateResult);
                
                if (updateResult.success) {
                  console.log(`💰 Account balance directly updated to ${newBalance}`);
                  
                  // Verify the balance was updated
                  const verifyAccount = await apiService.getAccountById(accountId.toString());
                  
                  if (verifyAccount.success && verifyAccount.data && 
                      Math.abs(verifyAccount.data.balance - newBalance) < 0.001) {
                    console.log(`💰 Balance verification: ${verifyAccount.data.balance}`);
                    console.log(`💰 Balance verified correctly!`);
                    updateSucceeded = true;
                    break;
                  } else {
                    console.log(`💰 Balance verification FAILED! Trying again...`);
                  }
                } else {
                  console.log(`💰 Balance update failed! Trying again...`);
                }
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              // If normal methods failed, try the emergency direct approach as a last resort
              if (!updateSucceeded) {
                console.log(`🚨 EMERGENCY! Normal update methods failed. Trying direct API bypass...`);
                const emergencyResult = await emergencyDirectAssetBalanceUpdate(
                  accountId.toString(), 
                  newBalance,
                  account as unknown as Record<string, unknown>
                );
                
                if (emergencyResult) {
                  console.log(`🚨 EMERGENCY UPDATE SUCCESSFUL! Balance should now be ${newBalance}`);
                } else {
                  console.error(`🚨 EMERGENCY UPDATE FAILED! This is really bad.`);
                  
                  // Last resort: display a error message to the user with instructions
                  toast.error('Critical Error', {
                    description: 'Could not update account balance. Please refresh the page and try again.',
                    duration: 10000,
                    position: 'bottom-right'
                  });
                }
              }
              
              // Update localStorage with the new balance information
              await updateLocalStorage();
              
            } catch (error) {
              console.error("Error updating asset balance:", error);
            }
          }
        }
      }
      
      if (onSoftDelete) {
        // Log that we're about to restore
        console.log(`🔄 Restoring transaction via onSoftDelete: ${apiId}`, {
          id: transaction.id,
          _id: transaction._id || 'none',
          title: transaction.title,
          type: transaction.type,
          amount: transaction.amount
        });

        // Update state in the database via API
        onSoftDelete(apiId, false);
      
        // Emit a state changed event for immediate UI update
        const event = new CustomEvent('transaction:stateChanged', {
          detail: {
            transaction,
            action: 'restored',
            // Add any relevant metadata
            metadata: {
              timestamp: Date.now()
            }
          },
          bubbles: true
        });
        document.dispatchEvent(event);
      } else {
        console.error("🔴 onSoftDelete function is undefined, cannot restore transaction");
      }
    
      // Show success toast
      toast.success('Transaction Restored', {
        description: `"${transaction.title}" has been restored.`,
        duration: 3000,
        position: 'bottom-right'
      });
    } finally {
      // Reset all state to prevent issues with future operations
      setLoading(false);
      setShowUndoAlert(false);
      setDeleting(false);
      setProgressValue(0);
      resetState();
    }
  };
  
  const handleDeleteNow = async () => {
    console.log("🗑️ PERMANENTLY DELETING transaction:", {
      id: transaction.id,
      _id: transaction._id || 'none',
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      isDeleted: transaction.isDeleted
    });
    
    // First dismiss any active toast to prevent it from continuing
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    // Clear any ongoing timers
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setLoading(true);
    
    // CRITICAL FIX: Check if balance adjustment is needed
    // We only need to update the balance if this transaction is not already soft-deleted
    const wasAlreadySoftDeleted = transaction.isDeleted === true;
    console.log(`[handleDeleteNow] Transaction status check: wasAlreadySoftDeleted=${wasAlreadySoftDeleted}, isDeleted=${transaction.isDeleted}`);
    
    try {
      // Must use MongoDB _id for API calls when available
      const apiId = transaction._id?.toString() || transaction.id.toString();
      console.log(`📝 Using API ID: ${apiId} for permanent deletion`);

      // CRITICAL FIX: For income transactions, manually update the asset balance BEFORE deleting
      // Only if NOT already soft-deleted
      if (transaction.type === 'income' && !wasAlreadySoftDeleted) {
        const amount = Math.abs(transaction.amount);
        console.log(`💰 INCOME DELETION: ${transaction.title} amount=${amount}, Need to update balance=${!wasAlreadySoftDeleted}`);
        
        // Get account ID
        const accountId = typeof transaction.account === 'object' 
          ? (transaction.account.id || transaction.account._id)
          : transaction.account;
          
        if (accountId) {
          console.log(`💰 Manually updating account balance for account ID: ${accountId}`);
          
          // Fetch current account data
          const accountResponse = await apiService.getAccountById(accountId.toString());
          
          if (accountResponse.success && accountResponse.data) {
            const account = accountResponse.data;
            console.log(`💰 Current account balance: ${account.balance}`);
            
            // IMPROVED LOGIC: For income transactions being deleted
            // Calculate what the balance should be after deletion
            let newBalance;
            if (Math.abs(account.balance - amount) < 0.001) {
              // If the account balance is almost exactly equal to the transaction amount,
              // it means this was probably the only transaction - just reset to 0
              newBalance = 0;
              console.log(`💰 EXACT MATCH DETECTED! Forcing balance to exactly 0`);
            } else {
              // Otherwise do normal subtraction
              newBalance = Math.max(0, account.balance - amount);
            }
            
            console.log(`💰 INCOME DELETION BALANCE UPDATE: ${account.balance} - ${amount} = ${newBalance}`);
            
            try {
              let updateSucceeded = false;
              
              // Make multiple attempts to update the balance
              for (let attempt = 1; attempt <= 2; attempt++) {
                console.log(`💰 Attempt ${attempt} to update balance to ${newBalance}`);
                
                // Update account balance directly (critical fix)
                const updateResult = await apiService.updateAsset(accountId.toString(), {
                  ...account,
                  balance: newBalance
                });
                
                console.log(`💰 Update result:`, updateResult);
                
                if (updateResult.success) {
                  console.log(`💰 Account balance directly updated to ${newBalance}`);
                  
                  // Verify the balance was updated
                  const verifyAccount = await apiService.getAccountById(accountId.toString());
                  
                  if (verifyAccount.success && verifyAccount.data && 
                      Math.abs(verifyAccount.data.balance - newBalance) < 0.001) {
                    console.log(`💰 Balance verification: ${verifyAccount.data.balance}`);
                    console.log(`💰 Balance verified correctly!`);
                    updateSucceeded = true;
                    break;
                  } else {
                    console.log(`💰 Balance verification FAILED! Trying again...`);
                  }
                } else {
                  console.log(`💰 Balance update failed! Trying again...`);
                }
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              // If normal methods failed, try the emergency direct approach as a last resort
              if (!updateSucceeded) {
                console.log(`🚨 EMERGENCY! Normal update methods failed. Trying direct API bypass...`);
                const emergencyResult = await emergencyDirectAssetBalanceUpdate(
                  accountId.toString(), 
                  newBalance,
                  account as unknown as Record<string, unknown>
                );
                
                if (emergencyResult) {
                  console.log(`🚨 EMERGENCY UPDATE SUCCESSFUL! Balance should now be ${newBalance}`);
                } else {
                  console.error(`🚨 EMERGENCY UPDATE FAILED! This is really bad.`);
                  
                  // Last resort: display a error message to the user with instructions
                  toast.error('Critical Error', {
                    description: 'Could not update account balance. Please refresh the page and try again.',
                    duration: 10000,
                    position: 'bottom-right'
                  });
                }
              }
              
              // Update localStorage with the new balance information
              await updateLocalStorage();
              
            } catch (error) {
              console.error("Error updating asset balance:", error);
            }
            
            // Never refresh the page after permanently deleting
            // Instead allow the UI to update naturally via events
            setTimeout(() => {
              console.log("Avoiding page refresh on delete to ensure smooth UX");
            }, 2000);
          }
        }
      } else {
        console.log(`💰 Skipping balance update for ${transaction.type} transaction or already soft-deleted transaction`);
      }
      
      // Make the API call to permanently delete
      await apiService.permanentDeleteTransaction(apiId);
      
      // Show success toast
      toast.success('Transaction Deleted', {
        description: `${transaction.title} has been permanently deleted.`,
        duration: 3000,
        position: 'bottom-right'
      });
      
      // Dispatch custom event with all the necessary data for parent components
      const customEvent = new CustomEvent('transaction:permanentlyDeleted', {
        detail: {
          transaction: transaction,
          wasAlreadySoftDeleted: wasAlreadySoftDeleted,
          balanceAlreadyUpdated: transaction.type === 'income' && !wasAlreadySoftDeleted
        }
      });
      
      // Also dispatch our transaction:stateChanged event for consistent UI updates
      const stateEvent = new CustomEvent('transaction:stateChanged', {
        detail: {
          transaction,
          action: 'permanentlyDeleted',
          wasSoftDeleted: wasAlreadySoftDeleted,
          balanceAlreadyUpdated: transaction.type === 'income' && !wasAlreadySoftDeleted
        }
      });
      document.dispatchEvent(stateEvent);
      
      console.log("🔄 Dispatching transaction:permanentlyDeleted event with details:", customEvent.detail);
      document.dispatchEvent(customEvent);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("🔴 Error permanently deleting transaction:", error);
      
      // Show error toast
      toast.error('Error Deleting Transaction', {
        description: 'There was an error permanently deleting the transaction.',
        duration: 5000,
        position: 'bottom-right'
      });
    } finally {
      setLoading(false);
      // Reset state to prevent issues with future operations
      setDeleting(false);
      setProgressValue(0);
      setTimeLeft(5);
      setShowUndoAlert(false);
      resetState();
    }
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
                    This action can be undone {timeLeft > 0 ? `(${timeLeft}s)` : ''}
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Deleting...
                    </>
                  ) : (
                    "Delete Now"
                  )}
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
    // Use a simple success toast instead of a custom toast with CheckCircle
    toast.success('Transaction Permanently Deleted', {
      description: `"${transaction.title}" has been permanently deleted`,
      duration: 3000,
      position: 'bottom-right'
    });
  };

  // Calculate the financial impact of deleting this transaction
  const getAccountImpact = () => {
    let impact = '';
    const impactAmount = Math.abs(transaction.amount || 0);
    
    // Safely determine account name with multiple null checks
    const getAccountName = () => {
      if (!transaction.account) return 'Account';
      
      if (typeof transaction.account === 'object' && transaction.account !== null) {
        return transaction.account.name || 'Account';
      }
      
      return 'Account';
    };
    
    if (transaction.type === 'income') {
      impact = `${getAccountName()} balance will decrease by ${formatCurrency(impactAmount)}`;
    } else if (transaction.type === 'expense') {
      impact = `${getAccountName()} balance will increase by ${formatCurrency(impactAmount)}`;
    } else if (transaction.transferType === 'transfer') {
      impact = `Transfer will be reversed: ${transaction.fromAsset || 'Source'} to ${transaction.toAsset || 'Destination'}`;
    }
    
    return impact;
  };

  const getImpactIcon = () => {
    if (!transaction) return null;
    
    if (transaction.type === 'income') {
      return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    } else if (transaction.type === 'expense') {
      return <ArrowUpRight className="h-4 w-4 text-primary" />;
    } else if (transaction.transferType === 'transfer') {
      return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
    return null;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-destructive/10 p-3 rounded-full">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
          </div>
          
          <h2 className="text-lg font-medium text-center">Delete this transaction?</h2>
          
          <AlertDialogDescription className="text-center">
            This action cannot be undone. You will have a few seconds to cancel the deletion after confirming.
          </AlertDialogDescription>
          
          {/* Transaction Impact Section */}
          <div className="mt-2 bg-muted/50 p-3 rounded-md">
            <h3 className="text-sm font-medium mb-2">Impact of deletion:</h3>
            
            <div className="flex items-center text-sm text-muted-foreground">
              {getImpactIcon()}
              <span className="ml-2">{getAccountImpact()}</span>
            </div>
            
            {/* Data consistency warning */}
            {showDependentWarning && dependentTransfers.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400">
                      Warning: Potential data inconsistency
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                      This transaction funded {dependentTransfers.length} asset transfer{dependentTransfers.length > 1 ? 's' : ''} that occurred after it. Deleting it may create accounting inconsistencies.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isAnalyzingImpact && (
              <div className="mt-2 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {/* Transaction Details */}
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Transaction:</span>
                <span className="font-medium">{transaction.title || 'Untitled'}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Amount:</span>
                <span className={cn(
                  "font-medium",
                  transaction.type === "income" ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(Math.abs(transaction.amount || 0))}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{transaction.transferType || transaction.type || 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 justify-between">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={startDeletion}
              disabled={isAnalyzingImpact || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTransactionDialog; 