import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Asset } from "@/types/assets";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

interface DeleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteAssetDialog({
  open,
  onOpenChange,
  asset,
  onConfirm,
  isDeleting = false,
}: DeleteAssetDialogProps) {
  const { formatCurrency } = useCurrencyFormat();

  if (!asset) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Asset
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this asset? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 mb-4">
            <h4 className="font-medium mb-2">{asset.name}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Type:</div>
              <div>{asset.type}</div>
              
              <div className="text-muted-foreground">Balance:</div>
              <div>{formatCurrency(asset.balance)}</div>
              
              {asset.institution && (
                <>
                  <div className="text-muted-foreground">Institution:</div>
                  <div>{asset.institution}</div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Please note:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>This will permanently delete the asset and its data.</li>
              <li>Transactions linked to this asset will be affected.</li>
              <li>Historical data related to this asset will be lost.</li>
              <li>This action cannot be reversed.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
            <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
            </Button>
            <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Asset"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteAssetDialog;
