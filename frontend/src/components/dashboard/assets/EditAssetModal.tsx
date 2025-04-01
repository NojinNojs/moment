import { useState, useEffect } from "react";
import { Asset, AssetType } from "@/types/assets";
import { motion } from "framer-motion";
import { 
  Edit, 
  X,
  PiggyBank,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Define props
interface EditAssetModalProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAsset: (asset: Asset, setIsLoading?: (loading: boolean) => void) => void;
}

export function EditAssetModal({
  asset,
  isOpen,
  onOpenChange,
  onUpdateAsset,
}: EditAssetModalProps) {
  const [formData, setFormData] = useState<Asset>(asset);
  const [loading, setLoading] = useState(false);

  // Update form data when selected asset changes or when modal opens
  useEffect(() => {
    if (asset && asset.id && isOpen) {
      setFormData(asset);
    }
  }, [asset, isOpen]);

  // If we don't have valid asset data, don't render the form content
  const hasValidAsset = formData && formData.id;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === "balance" ? parseFloat(value) || 0 : value,
      };
    });
  };

  const handleTypeChange = (type: AssetType) => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onUpdateAsset(formData, setLoading);
      onOpenChange(false);
    } catch {
      setLoading(false);
      toast.error("Failed to update asset", {
        description: "An error occurred. Please try again later."
      });
    }
  };

  // Reset loading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  // Animation variants
  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-background border border-border p-0 overflow-hidden max-h-[90vh] h-[90vh] flex flex-col">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 z-10 border-b px-6 flex flex-col items-center text-center flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-primary shadow-lg shadow-primary/20"
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <Edit className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          
          <DialogTitle className="text-xl font-semibold text-center">Edit Asset</DialogTitle>
          <DialogDescription className="opacity-80 mt-1 text-center">
            {hasValidAsset ? `Update your ${formData?.type} asset details` : 'Loading asset details...'}
          </DialogDescription>
        </DialogHeader>
        
        {hasValidAsset ? (
          <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
            <motion.form 
              onSubmit={handleSubmit}
              className="pr-4 space-y-5"
              initial="initial"
              animate="animate"
              variants={contentAnimation}
            >
              {/* Asset Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Asset Type
                </Label>
                <Select
                  value={formData?.type}
                  onValueChange={(value) => handleTypeChange(value as AssetType)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span>Cash</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        <span>Bank Account</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="e-wallet">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        <span>E-Wallet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        <span>Emergency Fund</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Asset Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Asset Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="h-10"
                  placeholder="Enter asset name"
                  value={formData?.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {/* Asset Balance */}
              <div className="space-y-2">
                <Label htmlFor="balance" className="text-sm font-medium">
                  Current Balance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="balance"
                    name="balance"
                    className="h-10 pl-7"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData?.balance || 0}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {/* Institution - Show conditionally based on type */}
              {(formData?.type === 'bank' || formData?.type === 'e-wallet') && (
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-sm font-medium">
                    Institution
                  </Label>
                  <Input
                    id="institution"
                    name="institution"
                    className="h-10"
                    placeholder="E.g., Bank name, wallet provider"
                    value={formData?.institution || ""}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  className="min-h-[80px] resize-none"
                  placeholder="Add notes about this asset"
                  value={formData?.description || ""}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Extra space at the bottom for comfortable scrolling */}
              <div className="h-4"></div>
            </motion.form>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading asset details...</p>
            </div>
          </div>
        )}
        
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t mt-auto flex-shrink-0 z-20">
          {hasValidAsset && (
            <Button
              type="button" 
              onClick={(e) => {
                handleSubmit(e);
              }}
              disabled={loading || !formData}
              className="flex items-center justify-center gap-2 h-10 min-w-36"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Update Asset
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}