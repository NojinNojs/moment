import { useState, useRef, useCallback } from "react";
import { AlertTriangle, Trash2, Undo, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Asset } from "@/types/assets";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";
import { cn } from "@/lib/utils";

// Deletion timeout in milliseconds (5 seconds for undo)
const DELETION_TIMEOUT = 5000;

interface DeleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  onSoftDelete?: (asset: Asset, isDeleted: boolean) => void;
}

// Define toast props type for the Sonner API
type ToastProps = { id?: string; visible?: boolean };

export function DeleteAssetDialog({
  open,
  onOpenChange,
  asset,
  onConfirm,
  isDeleting = false,
  onSoftDelete,
}: DeleteAssetDialogProps) {
  const { formatCurrency } = useCurrencyFormat();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const toastIdRef = useRef<string | number | null>(null);
  const deletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset all timers and state
  const resetState = useCallback(() => {
    setLoading(false);
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
  }, []);

  if (!asset) {
    return null;
  }

  // Start the deletion process with undo timer
  const startDeletion = async () => {
    setLoading(true);
    onOpenChange(false); // Close the modal immediately

    // Immediately mark the asset as soft deleted
    if (onSoftDelete) {
      onSoftDelete(asset, true);
    }

    // Setup countdown timer
    let secondsLeft = DELETION_TIMEOUT / 1000;
    setTimeLeft(secondsLeft);
    
    progressIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setTimeLeft(Math.ceil(secondsLeft));
      
      if (secondsLeft <= 0 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 1000);

    // Show the undo toast
    showUndoToast();
    
    // Schedule the final deletion
    deletionTimerRef.current = setTimeout(async () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      
      try {
        await onConfirm();
        showDeletionCompletedToast();
      } catch (error) {
        console.error("Error during asset deletion:", error);
        toast.error("Failed to delete asset", {
          description: "An error occurred while deleting the asset."
        });
      } finally {
        resetState();
      }
    }, DELETION_TIMEOUT);
  };

  // Handle the undo action
  const handleUndo = () => {
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Restore the asset (cancel soft deletion)
    if (onSoftDelete) {
      onSoftDelete(asset, false);
    }
    
    toast.success("Deletion canceled", {
      description: `"${asset.name}" was restored`,
      duration: 3000
    });
    
    resetState();
  };

  // Handle immediate deletion (no undo)
  const handleDeleteNow = async () => {
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = null;
    }
    
    try {
      setLoading(true);
      await onConfirm();
      showDeletionCompletedToast();
    } catch (error) {
      console.error("Error during asset deletion:", error);
      toast.error("Failed to delete asset", {
        description: "An error occurred while deleting the asset."
      });
    } finally {
      resetState();
    }
  };

  // Show the undo toast with timer
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
                  <p className="text-sm font-medium text-foreground">Deleting Asset</p>
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
                  <div className="flex-shrink-0 w-1 h-8 rounded-full bg-primary/20" />
                  <div>
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(asset.balance)}</p>
                  </div>
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

  // Show a confirmation toast after successful deletion
  const showDeletionCompletedToast = () => {
    toast.success('Asset Permanently Deleted', {
      description: `"${asset.name}" has been permanently deleted`,
      duration: 3000,
      position: 'bottom-right'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <div className="bg-destructive/10 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <span>Delete Asset</span>
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Are you sure you want to delete this asset? You'll have a chance to undo this action.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {/* Asset Card */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-4">
            <div className="bg-primary/10 px-4 py-3 border-b border-border">
              <h3 className="font-medium">{asset.name}</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium">{asset.type}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="text-sm font-medium">{formatCurrency(asset.balance)}</span>
              </div>
              
              {asset.institution && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Institution</span>
                  <span className="text-sm font-medium">{asset.institution}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-destructive">Important</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>All transactions linked to this asset will be affected</li>
                  <li>Historical data for this asset will no longer be accessible</li>
                  <li>This action can be undone for a short time after confirmation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || loading}
            className="sm:order-1 order-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={startDeletion}
            disabled={isDeleting || loading}
            className="sm:order-2 order-1"
          >
            {isDeleting || loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                Deleting...
              </>
            ) : (
              "Delete Asset"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteAssetDialog;
