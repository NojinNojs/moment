import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyInput from "@/components/dashboard/transactions/forms/CurrencyInput";
import { Asset } from "@/types/assets";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface AssetTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  sourceAsset?: Asset | null;
  onTransfer: (transferData: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    description?: string;
    date?: string;
  }) => Promise<void>;
}

interface FormData {
  fromAsset: string;
  toAsset: string;
  amount: string;
  description: string;
}

export function AssetTransferDialog({
  open,
  onOpenChange,
  assets,
  sourceAsset = null,
  onTransfer,
}: AssetTransferDialogProps) {
  // Currency formatting hooks
  const { currencyLocale, currencySymbol, formatCurrency } = useCurrencyFormat();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fromAsset: sourceAsset?.id || sourceAsset?._id || "",
    toAsset: "",
    amount: "0",
    description: "",
  });
  
  // Form errors
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // Selected assets
  const [fromAssetDetails, setFromAssetDetails] = useState<Asset | null>(null);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when sourceAsset changes
  useEffect(() => {
    if (sourceAsset) {
      setFormData(prev => ({
        ...prev,
        fromAsset: sourceAsset.id || sourceAsset._id || "",
      }));
      setFromAssetDetails(sourceAsset);
    }
  }, [sourceAsset]);
  
  // Update asset details when selections change
  useEffect(() => {
    // Update from asset details
    if (formData.fromAsset) {
      const fromAsset = assets.find(
        (a) => a.id === formData.fromAsset || a._id === formData.fromAsset
      );
      setFromAssetDetails(fromAsset || null);
    } else {
      setFromAssetDetails(null);
    }
  }, [formData.fromAsset, assets]);
  
  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset form after dialog closes
      setTimeout(() => {
        setFormData({
          fromAsset: sourceAsset?.id || sourceAsset?._id || "",
          toAsset: "",
          amount: "0",
          description: "",
        });
        setErrors({});
      }, 300);
    }
  };
  
  // Handle select change for source asset
  const handleFromAssetChange = (value: string) => {
    setFormData(prev => ({ ...prev, fromAsset: value }));
    
    // Clear error for this field if any
    if (errors.fromAsset) {
      setErrors(prev => ({ ...prev, fromAsset: undefined }));
    }
    
    // If source and destination are the same, clear destination
    if (value === formData.toAsset) {
      setFormData(prev => ({ ...prev, toAsset: "" }));
    }
  };
  
  // Handle select change for destination asset
  const handleToAssetChange = (value: string) => {
    setFormData(prev => ({ ...prev, toAsset: value }));
    
    // Clear error for this field if any
    if (errors.toAsset) {
      setErrors(prev => ({ ...prev, toAsset: undefined }));
    }
    
    // If source and destination are the same, clear source
    if (value === formData.fromAsset) {
      setFormData(prev => ({ ...prev, fromAsset: "" }));
    }
  };
  
  // Handle amount change
  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
    
    // Clear error for this field if any
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.fromAsset) {
      newErrors.fromAsset = "Source asset is required";
    }
    
    if (!formData.toAsset) {
      newErrors.toAsset = "Destination asset is required";
    }
    
    if (formData.fromAsset === formData.toAsset && formData.fromAsset) {
      newErrors.toAsset = "Source and destination assets must be different";
    }
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Valid amount greater than zero is required";
    } else if (fromAssetDetails && amount > fromAssetDetails.balance) {
      newErrors.amount = `Amount exceeds available balance of ${formatCurrency(fromAssetDetails.balance)}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare transfer data
      const transferData = {
        fromAsset: formData.fromAsset,
        toAsset: formData.toAsset,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        date: new Date().toISOString(),
      };
      
      // Call transfer function
      await onTransfer(transferData);
      
      // Close dialog on success
      handleOpenChange(false);
      
      // Show success toast
      toast.success("Transfer Completed", {
        description: `Successfully transferred ${formatCurrency(parseFloat(formData.amount))} between assets.`,
      });
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : "An error occurred during the transfer";
      toast.error("Transfer Failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter available destination assets (exclude the source asset)
  const getAvailableDestinationAssets = () => {
    return assets.filter(
      (asset) => 
        (asset.id !== formData.fromAsset && asset._id !== formData.fromAsset) &&
        !asset.isDeleted
    );
  };
  
  // Filter available source assets (exclude deleted assets)
  const getAvailableSourceAssets = () => {
    return assets.filter((asset) => !asset.isDeleted);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transfer Between Assets</DialogTitle>
            <DialogDescription>
              Move money between your assets. This will update the balances of both assets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Source Asset (From) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fromAsset" className="text-right">
                From
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.fromAsset}
                  onValueChange={handleFromAssetChange}
                  disabled={!!sourceAsset}
                >
                  <SelectTrigger id="fromAsset" className={errors.fromAsset ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select source asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {getAvailableSourceAssets().map((asset) => (
                        <SelectItem 
                          key={asset.id || asset._id} 
                          value={asset.id || asset._id || ""}
                        >
                          {asset.name} ({formatCurrency(asset.balance)})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.fromAsset && (
                  <p className="text-destructive text-sm mt-1">{errors.fromAsset}</p>
                )}
              </div>
            </div>
            
            {/* Arrow indicator */}
            <div className="flex items-center justify-center py-1">
              <div className="bg-muted/50 h-8 w-8 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* Destination Asset (To) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toAsset" className="text-right">
                To
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.toAsset}
                  onValueChange={handleToAssetChange}
                  disabled={!formData.fromAsset}
                >
                  <SelectTrigger id="toAsset" className={errors.toAsset ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select destination asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {getAvailableDestinationAssets().map((asset) => (
                        <SelectItem 
                          key={asset.id || asset._id} 
                          value={asset.id || asset._id || ""}
                        >
                          {asset.name} ({formatCurrency(asset.balance)})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.toAsset && (
                  <p className="text-destructive text-sm mt-1">{errors.toAsset}</p>
                )}
              </div>
            </div>
            
            {/* Transfer Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3">
                <CurrencyInput
                  id="amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  hasError={!!errors.amount}
                  locale={currencyLocale}
                  currencySymbol={currencySymbol}
                  placeholder="Enter transfer amount"
                />
                {errors.amount && (
                  <p className="text-destructive text-sm mt-1">{errors.amount}</p>
                )}
                {fromAssetDetails && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available balance: {formatCurrency(fromAssetDetails.balance)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Description (optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Add a note (optional)"
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.fromAsset || !formData.toAsset}>
              {isSubmitting ? "Processing..." : "Transfer Funds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssetTransferDialog; 