import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyInput from "@/components/dashboard/transactions/forms/CurrencyInput";
import { Asset, AssetType } from "@/types/assets";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";
import { toast } from "sonner";

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onUpdateAsset: (assetId: string, assetData: Partial<Asset>) => Promise<void>;
}

interface FormData {
  name: string;
  type: AssetType;
  balance: string;
  institution: string;
  description: string;
}

export function EditAssetDialog({ open, onOpenChange, asset, onUpdateAsset }: EditAssetDialogProps) {
  // Currency formatting hooks
  const { currencyLocale, currencySymbol } = useCurrencyFormat();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "bank",
    balance: "0",
    institution: "",
    description: ""
  });
  
  // Previous balance for comparison
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  
  // Form errors
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form data when asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || "",
        type: asset.type || "bank",
        balance: asset.balance?.toString() || "0",
        institution: asset.institution || "",
        description: asset.description || ""
      });
      setPreviousBalance(asset.balance || 0);
    }
  }, [asset]);
  
  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset errors when dialog closes
      setTimeout(() => {
        setErrors({});
      }, 300);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field if any
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Handle select change
  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value as AssetType }));
    // Clear error for this field if any
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: undefined }));
    }
  };
  
  // Handle balance change
  const handleBalanceChange = (value: string) => {
    setFormData(prev => ({ ...prev, balance: value }));
    // Clear error for this field if any
    if (errors.balance) {
      setErrors(prev => ({ ...prev, balance: undefined }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    
    if (!formData.balance || isNaN(parseFloat(formData.balance))) {
      newErrors.balance = "Valid balance is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !asset) {
      return;
    }
    
    const assetId = asset.id || asset._id;
    if (!assetId) {
      toast.error("Error", {
        description: "Invalid asset ID. Please try again.",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Track what fields have changed
      const changes: Partial<Asset> = {};
      
      if (formData.name !== asset.name) {
        changes.name = formData.name;
      }
      
      if (formData.type !== asset.type) {
        changes.type = formData.type;
      }
      
      const newBalance = parseFloat(formData.balance);
      if (newBalance !== asset.balance) {
        changes.balance = newBalance;
      }
      
      if (formData.institution !== asset.institution) {
        changes.institution = formData.institution;
      }
      
      if (formData.description !== asset.description) {
        changes.description = formData.description;
      }
      
      // Only update if there are changes
      if (Object.keys(changes).length === 0) {
        toast.info("No Changes Made", {
          description: "You haven't made any changes to the asset.",
        });
        handleOpenChange(false);
        return;
      }
      
      // Call update function
      await onUpdateAsset(assetId, changes);
      
      // Close dialog on success
      handleOpenChange(false);
      
      // Show success toast
      toast.success("Asset Updated", {
        description: `${formData.name} has been updated successfully.`,
      });
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : "An error occurred while updating the asset";
      toast.error("Failed to Update Asset", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Asset type options
  const assetTypes = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Account" },
    { value: "e-wallet", label: "E-Wallet" },
    { value: "emergency", label: "Emergency Fund" },
  ];
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the details of your asset. Make your changes below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Asset Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Savings Account"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">{errors.name}</p>
                )}
              </div>
            </div>
            
            {/* Asset Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger id="type" className={errors.type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-destructive text-sm mt-1">{errors.type}</p>
                )}
              </div>
            </div>
            
            {/* Asset Balance */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <div className="col-span-3">
                <CurrencyInput
                  id="balance"
                  value={formData.balance}
                  onChange={handleBalanceChange}
                  hasError={!!errors.balance}
                  locale={currencyLocale}
                  currencySymbol={currencySymbol}
                  placeholder="Enter balance"
                />
                {errors.balance && (
                  <p className="text-destructive text-sm mt-1">{errors.balance}</p>
                )}
                {formData.balance !== previousBalance.toString() && (
                  <p className="text-yellow-500 text-sm mt-1">
                    Warning: Directly changing the balance may not track the reason for the change.
                  </p>
                )}
              </div>
            </div>
            
            {/* Institution (optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="institution" className="text-right">
                Institution
              </Label>
              <Input
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="e.g. XYZ Bank (optional)"
                className="col-span-3"
              />
            </div>
            
            {/* Description (optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes or details (optional)"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditAssetDialog; 