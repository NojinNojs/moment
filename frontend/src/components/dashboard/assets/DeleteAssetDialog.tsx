import { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import {
  Trash2,
  AlertTriangle,
  Clock,
  Undo,
  X,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Asset } from "@/types/assets";

// Deletion timeout in milliseconds (5 seconds)
const DELETION_TIMEOUT = 5000;
const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10ms for smooth animation

// Create an interface for the Sonner toast parameter
interface SonnerToastT {
  id: string | number;
  visible?: boolean;
}

// Create a custom type for the toast.custom function
type CustomToastFn = {
  (
    content: (t: SonnerToastT) => ReactElement,
    options?: { duration?: number; position?: string }
  ): string | number;
};

interface DeleteAssetDialogProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onSoftDelete?: (assetId: string, isSoftDeleted: boolean) => void;
}

export function DeleteAssetDialog({
  asset,
  isOpen,
  onOpenChange,
  onConfirm,
  onSoftDelete,
}: DeleteAssetDialogProps) {
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

    // Immediately soft delete the asset
    if (onSoftDelete) {
      // Ensure we have a valid ID to work with - check both MongoDB _id and client-side id
      const assetId = asset._id || asset.id;
      
      if (!assetId) {
        toast.error("Error", {
          description: "Unable to delete asset: Missing ID"
        });
        resetState();
        return;
      }
      
      // Call the soft delete function with the valid ID
      onSoftDelete(assetId, true);
    } else {
      toast.error("Error", {
        description: "Delete function not available"
      });
      resetState();
      return;
    }

    // Set up a timer to update the progress bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgressValue = Math.min(
        (elapsed / DELETION_TIMEOUT) * 100,
        100
      );
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
      completeAssetDeletion();
    }, DELETION_TIMEOUT);

    // Show the toast with undo button
    showUndoToast();
  };

  const completeAssetDeletion = () => {
    try {
      // Permanently delete the asset
      onConfirm();
      showDeletionCompletedToast();
      resetState();
    } catch (error) {
      console.error("Error completing asset deletion:", error);
      
      // Show an error toast
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      // Check if the error is about asset not found
      if (errorMessage.includes("Asset not found")) {
        toast.error("Asset Already Deleted", {
          description: "This asset has already been deleted. The view will be updated."
        });
      } else {
        toast.error("Deletion Error", {
          description: errorMessage
        });
      }
      
      resetState();
    }
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

    // Restore the asset (remove soft delete flag)
    if (onSoftDelete) {
      // Ensure we have a valid ID to work with - check both MongoDB _id and client-side id
      const assetId = asset._id || asset.id;
      
      if (!assetId) {
        toast.error("Error", {
          description: "Unable to restore asset: Missing ID"
        });
        resetState();
        return;
      }
      
      // Call the restore function with the valid ID
      onSoftDelete(assetId, false);
    } else {
      toast.error("Error", {
        description: "Restore function not available"
      });
      resetState();
      return;
    }

    // Remove the success toast to prevent duplication 
    // The parent component will show its own toast

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
    completeAssetDeletion();
  };

  /**
   * Shows a toast notification with undo option for asset deletion
   * @remarks
   * We need to use a type cast here to make TypeScript accept our usage
   * of toast.custom. The Sonner API's actual behavior doesn't match its types.
   */
  const showUndoToast = () => {
    // Cast toast.custom to our custom type to work around type issues
    // Use double casting with unknown as intermediate step
    const customToast = toast.custom as unknown as CustomToastFn;

    const id = customToast(
      (t) => (
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
                    <p className="text-sm font-medium text-foreground">
                      Temporarily Hiding Asset
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Undo within 5 seconds or asset will be permanently deleted
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
                    <div className="flex-shrink-0 w-1 h-8 bg-destructive/20 rounded-full" />
                    <p className="text-sm font-medium truncate">{asset.name}</p>
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
      ),
      {
        duration: Infinity,
        position: "bottom-right",
      }
    );

    toastIdRef.current = id;
  };

  /**
   * Shows a toast notification when asset deletion is completed
   * @remarks
   * We need to use a type cast here to make TypeScript accept our usage
   * of toast.custom. The Sonner API's actual behavior doesn't match its types.
   */
  const showDeletionCompletedToast = () => {
    // Cast toast.custom to our custom type to work around type issues
    // Use double casting with unknown as intermediate step
    const customToast = toast.custom as unknown as CustomToastFn;

    customToast(
      (t) => (
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
                  <p className="text-sm font-medium text-foreground">
                    Asset Permanently Deleted
                  </p>
                  <button
                    onClick={() => t.id && toast.dismiss(t.id)}
                    className="bg-transparent text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  "{asset.name}" has been permanently deleted
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
      ),
      {
        duration: 5000,
        position: "bottom-right",
      }
    );
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
              <h2 className="text-xl font-bold tracking-tight">Permanently Delete Asset</h2>
              <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                5-second window to undo deletion
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AlertDialogDescription className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              You're about to delete{" "}
              <span className="font-semibold text-foreground">
                {asset.name}
              </span>
              . This asset will first be temporarily hidden for 5 seconds, then permanently deleted if not restored.
            </p>

            {/* Warning box */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Two-step deletion process
                </p>
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-400/80">
                  Step 1: The asset will be temporarily hidden (soft delete).
                  <br />
                  Step 2: After 5 seconds, the asset will be permanently deleted from the database.
                  {asset.balance > 0 && (
                    <>
                      {" "}
                      This asset has a balance of{" "}
                      <span className="font-semibold">
                        ${asset.balance.toLocaleString()}
                      </span>
                      .
                    </>
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
                <span>Yes, permanently delete this asset</span>
              </span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="h-10 text-muted-foreground hover:text-foreground transition-colors"
              disabled={deleting}
            >
              Cancel, keep this asset
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
