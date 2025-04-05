import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowLeftRight, Info, PiggyBank, Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getAssetIcon, getAssetIconBg } from "@/lib/asset-utils";
import { Asset } from "@/types/assets";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/dashboard/transactions/forms/CurrencyInput";
import { FormControl } from "@/components/ui/form";

interface AssetTransferDrawerProps {
  assets: Asset[];
  sourceAsset?: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransfer: (fromAsset: Asset, toAsset: Asset, amount: number, description: string) => void;
  onAddAsset?: () => void;
}

export function AssetTransferDrawer({
  open,
  onOpenChange,
  assets,
  sourceAsset,
  onTransfer,
  onAddAsset
}: AssetTransferDrawerProps) {
  // Define locale
  const locale = 'en-US' as const;

  // State for tracking selected assets, amount and description
  const [fromAsset, setFromAsset] = useState<Asset | undefined>(sourceAsset);
  const [toAsset, setToAsset] = useState<Asset | undefined>(undefined);
  const [amount, setAmount] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState<string>("0");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  // Refs for uncontrolled inputs
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Derived state
  const validAssets = useMemo(() => {
    try {
      return Array.isArray(assets) ? assets.filter(asset => asset && !asset.isDeleted) : [];
    } catch (error) {
      console.error("Error calculating valid assets:", error);
      return [];
    }
  }, [assets]);
  
  const hasEnoughAssets = validAssets.length >= 2;
  const hasExactlyTwoAssets = validAssets.length === 2;
  
  // Get the destination assets (excluding the selected source asset)
  const destinationAssets = useMemo(() => {
    try {
      // Ensure assets is always a valid array before filtering
      if (!assets || !Array.isArray(assets)) return [];
      
      // Filter out the selected source asset using its ID
      return assets.filter(asset => {
        if (!asset) return false;
        const assetId = asset.id || asset._id || '';
        return assetId !== fromAsset?.id && assetId !== fromAsset?._id;
      });
    } catch (error) {
      console.error("Error filtering destination assets:", error);
      return [];
    }
  }, [assets, fromAsset]);
  
  // Fetch asset transfers when drawer opens
  useEffect(() => {
    if (!open) {
      // Reset initialization flag when drawer closes
      setFromAsset(sourceAsset);
      setToAsset(undefined);
      setAmount(0);
      setDescription("");
      setError("");
      setFromOpen(false);
      setToOpen(false);
      return;
    }
    
    // Reset form fields
    setAmount(0);
    setDescription("");
    setError("");
    
    // Handle initialization depending on the assets available
    if (hasExactlyTwoAssets && validAssets.length === 2) {
      // For exactly two assets case
      
      // Start with sourceAsset if provided
      let fromId = "";
      let toId = "";
      
      if (sourceAsset) {
        fromId = sourceAsset.id || sourceAsset._id || "";
        
        // Find the other asset for destination
        const otherAsset = validAssets.find(asset => 
          asset.id !== fromId && asset._id !== fromId
        );
        
        if (otherAsset) {
          toId = otherAsset.id || otherAsset._id || "";
        }
      } else if (!fromAsset) {
        // No source asset provided, use the first two assets
        fromId = validAssets[0]?.id || validAssets[0]?._id || "";
        toId = validAssets[1]?.id || validAssets[1]?._id || "";
      }
      
      // Only update state if we have valid IDs to prevent unnecessary rerenders
      if (fromId) setFromAsset(validAssets.find(asset => asset.id === fromId || asset._id === fromId));
      if (toId) setToAsset(validAssets.find(asset => asset.id === toId || asset._id === toId));
    } else if (sourceAsset) {
      // For multiple assets case, just set the source asset if provided
      setFromAsset(sourceAsset);
      setToAsset(undefined);
    } else {
      // Reset both if no source asset
      setFromAsset(undefined);
      setToAsset(undefined);
    }
  }, [open, sourceAsset, hasExactlyTwoAssets, validAssets, fromAsset]);
  
  // Get the selected assets immediately when IDs change
  const fromAssetId = fromAsset?.id || fromAsset?._id || '';
  const toAssetId = toAsset?.id || toAsset?._id || '';
  
  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } }
  };
  
  const cardAnimation = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", damping: 20 } },
    exit: { y: -10, opacity: 0, transition: { duration: 0.2 } }
  };
  
  // Simplified swap function with animation
  const handleSwapAssets = () => {
    if (fromAsset && toAsset) {
      // Animation-friendly swap with small delay
      setFromAsset(undefined);
      setToAsset(undefined);
      
      setTimeout(() => {
      setFromAsset(toAsset);
      setToAsset(fromAsset);
        
      // Clear error if it's related to asset selection
      if (error && (error.includes("source") || error.includes("destination") || error.includes("same"))) {
        setError("");
      }
      }, 50);
    }
  };
  
  // Handle amount changes with proper typing
  const handleAmountChange = (value: string) => {
    setFormattedAmount(value);
    
    // If empty, set to 0
    if (!value) {
      setAmount(0);
      return;
    }
    
    // Parse the value with locale-specific formatting
    const valueForParsing = locale === ('id-ID' as 'en-US' | 'id-ID')
      ? value.replace(/\./g, '').replace(/,/g, '.')
      : value.replace(/,/g, '');
    
    setAmount(parseFloat(valueForParsing) || 0);
  };
  
  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit description to 200 characters
    if (value.length <= 200) {
      setDescription(value);
    }
    // Clear error if user is fixing a description length issue
    if (error && error.includes("Description cannot exceed")) {
      setError("");
    }
  };
  
  // Quick amount buttons
  const setQuickAmount = (percentage: number) => {
    if (fromAsset) {
      const quickAmount = (fromAsset.balance * percentage).toFixed(2);
      setFormattedAmount(quickAmount);
    }
  };
  
  // Handle transfer submission
  const handleTransfer = () => {
    // Use state values directly
    const currentAmount = amount;
    const currentDescription = description;
    
    // For the two assets case, make sure we have valid assets
    if (hasExactlyTwoAssets && validAssets.length === 2) {
      // If we have valid assets but fromAsset/toAsset aren't set, use the validAssets directly
      const sourceAsset = fromAsset || validAssets[0];
      const destinationAsset = toAsset || validAssets[1];
      
      // Make sure we're not trying to transfer to the same asset - compare only IDs
      const sourceId = String(sourceAsset.id || sourceAsset._id || '');
      const destId = String(destinationAsset.id || destinationAsset._id || '');
      
      if (sourceId === destId) {
        setError("Source and destination assets cannot be the same");
        return;
      }
      
      if (!currentAmount || currentAmount <= 0) {
        setError("Please enter a valid amount greater than zero");
        return;
      }
      
      // Check description length
      if (currentDescription.length > 200) {
        setError("Description cannot exceed 200 characters");
        return;
      }
      
      const transferAmount = currentAmount;
      
      // Check if source asset has enough funds
      if (sourceAsset.balance < transferAmount) {
        setError(`Insufficient funds. ${sourceAsset.name} has a balance of ${formatCurrency(sourceAsset.balance)}`);
        return;
      }
      
      try {
        // Execute transfer
        onTransfer(sourceAsset, destinationAsset, transferAmount, currentDescription);
        
        // Reset form
        setFormattedAmount("");
        setDescription("");
        
        // Close drawer
        onOpenChange(false);
      } catch (error) {
        console.error("Transfer failed:", error);
        setError("Failed to complete transfer. Please try again.");
      }
    } else {
      // Normal case with more than two assets
    if (!fromAsset) {
      setError("Please select a source asset");
      return;
    }
    
    if (!toAsset) {
      setError("Please select a destination asset");
      return;
    }
    
      if (!currentAmount || currentAmount <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }
    
      // Check description length
      if (currentDescription.length > 200) {
        setError("Description cannot exceed 200 characters");
      return;
    }
    
      // Check if from and to assets are the same - compare only IDs
      const fromId = String(fromAsset.id || fromAsset._id || '');
      const toId = String(toAsset.id || toAsset._id || '');
      
      if (fromId === toId) {
      setError("Source and destination assets cannot be the same");
      return;
    }
    
      const transferAmount = currentAmount;
    
    // Check if source asset has enough funds
    if (fromAsset.balance < transferAmount) {
      setError(`Insufficient funds. ${fromAsset.name} has a balance of ${formatCurrency(fromAsset.balance)}`);
      return;
    }
    
    try {
      // Execute transfer
        onTransfer(fromAsset, toAsset, transferAmount, currentDescription);
        
        // Reset input fields
        setFormattedAmount("");
        setDescription("");
      
      // Close drawer
      onOpenChange(false);
    } catch (error) {
      console.error("Transfer failed:", error);
      setError("Failed to complete transfer. Please try again.");
      }
    }
  };
  
  // Function to render asset selection comboboxes
  const renderAssetCombobox = (
    value: string,
    onSelect: (value: string) => void,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    assets: Asset[],
    placeholder: string,
    disabled = false
  ) => {
    // Ensure assets is always a valid array
    const safeAssets = assets && Array.isArray(assets) ? assets : [];
    
    // Find selected asset safely
    const selectedAsset = safeAssets.find(asset => 
      asset && ((asset.id && asset.id === value) || (asset._id && asset._id === value))
    );
    
    return (
      <div className="w-full">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className={cn(
                "w-full justify-between h-10 bg-background font-normal",
                !value && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              {selectedAsset ? (
                <div className="flex items-center gap-2 w-full">
                  <span className={cn("flex items-center justify-center rounded-full w-6 h-6", getAssetIconBg(selectedAsset.type))}>
                    {(() => {
                      const AssetIcon = getAssetIcon(selectedAsset.type);
                      return <AssetIcon className="h-3.5 w-3.5" />;
                    })()}
                  </span>
                  <span>{selectedAsset.name}</span>
                  <span className="ml-auto font-medium">
                    {formatCurrency(selectedAsset.balance)}
                  </span>
                </div>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full min-w-[300px]" align="start">
            {safeAssets.length > 0 ? (
              <ScrollArea className="max-h-[300px]">
                <div className="p-1">
                  {safeAssets.map((asset) => {
                    if (!asset) return null;
                    
                    const assetId = asset.id || asset._id || '';
                    const AssetIcon = getAssetIcon(asset.type);
                    const iconBg = getAssetIconBg(asset.type);
                    
                    return (
                      <div
                        key={assetId}
                        className={cn(
                          "flex items-center gap-2 w-full p-2 rounded-md cursor-pointer hover:bg-muted",
                          assetId === value && "bg-muted"
                        )}
                        onClick={() => {
                          if (assetId) {
                            onSelect(assetId);
                            setIsOpen(false);
                          }
                        }}
                      >
                        <span className={cn(
                          "flex items-center justify-center rounded-full w-7 h-7", 
                          iconBg
                        )}>
                          <AssetIcon className="h-4 w-4" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{asset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {asset.institution || asset.type}
                          </span>
                        </div>
                        <span className="ml-auto font-medium">
                          {formatCurrency(asset.balance)}
                        </span>
                        {assetId === value && (
                          <Check className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No assets available
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  };
  
  // Asset details card for selected asset
  const renderAssetCard = (asset: Asset, label: string) => {
    if (!asset) return null;
    
    const AssetIcon = getAssetIcon(asset.type);
    const iconBg = getAssetIconBg(asset.type);
    
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={cardAnimation}
        className="p-4 bg-muted/30 border border-border rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconBg)}>
            <AssetIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-base">{asset.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {label}
              {asset.institution && <span>• {asset.institution}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatCurrency(asset.balance)}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
      </div>
      </motion.div>
    );
  };
  
  // Not enough assets view
  const renderNotEnoughAssetsView = () => (
    <div className="p-6 text-center space-y-4">
      <motion.div
        className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <Info className="h-10 w-10 text-amber-600 dark:text-amber-500" />
      </motion.div>
      
      <h3 className="text-xl font-medium">Transfers Require Multiple Assets</h3>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        You need at least two assets to make a transfer. Add another asset to get started with transfers.
      </p>
      
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <Button 
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            onOpenChange(false);
            if (onAddAsset) {
              onAddAsset();
            }
          }}
        >
          <PiggyBank className="h-5 w-5 mr-2" />
          Create New Asset
        </Button>
      </div>
    </div>
  );
  
  // Main transfer form component
  const renderTransferForm = () => (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Asset Selection & Swap Section */}
      <motion.div variants={itemAnimation} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="from-asset" className="text-[15px] font-medium">From</Label>
          {renderAssetCombobox(
            fromAssetId,
            (value) => {
              setFromAsset(validAssets.find(asset => asset.id === value || asset._id === value));
              // Reset to asset if it's the same
              if (value === toAssetId) {
                setToAsset(undefined);
              }
              // Clear error when user fixes selection
              if (error && (error.includes("source") || error.includes("same"))) {
                setError("");
              }
            },
            fromOpen,
            setFromOpen,
            validAssets,
            "Select source asset"
          )}
        </div>
        
        {/* Swap button (animated) */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-border/60"></div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative rounded-full h-10 w-10 border-dashed border-primary/40 bg-muted hover:bg-primary/5 hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={handleSwapAssets}
            disabled={!fromAsset || !toAsset}
          >
            <ArrowDown className="h-4 w-4 text-primary" />
            <span className="sr-only">Swap assets</span>
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to-asset" className="text-[15px] font-medium">To</Label>
          {renderAssetCombobox(
            toAssetId,
            (value) => {
              setToAsset(validAssets.find(asset => asset.id === value || asset._id === value));
              // Clear error when user fixes selection
              if (error && (error.includes("destination") || error.includes("same"))) {
                setError("");
              }
            },
            toOpen,
            setToOpen,
            destinationAssets.length > 0 ? destinationAssets : validAssets,
            "Select destination asset",
            !fromAssetId
          )}
        </div>
      </motion.div>
      
      {/* Selected Assets Display - new design */}
      <AnimatePresence>
        {fromAsset && toAsset && (
          <motion.div 
            variants={itemAnimation}
            className="flex flex-col gap-2.5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {renderAssetCard(fromAsset, "Source Account")}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted border border-border">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            {renderAssetCard(toAsset, "Destination Account")}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Transfer Amount */}
      <div className="space-y-2">
        <Label className="text-[15px] font-medium">Transfer Amount</Label>
        <div className="space-y-2.5">
          <FormControl>
            <CurrencyInput
              value={formattedAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              hasError={!!error}
              className="w-full"
              locale={locale}
            />
          </FormControl>
          
          {/* Quick percentage buttons - improved layout and styling */}
          {fromAsset && (
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: "25%", value: 0.25 },
                { label: "50%", value: 0.5 },
                { label: "75%", value: 0.75 },
                { label: "Max", value: 1 }
              ].map((item) => (
                <Button 
                  key={item.label}
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setQuickAmount(item.value)}
                  className={cn(
                    "h-9 font-medium rounded-lg px-2.5 transition-all",
                    "bg-muted/30 hover:bg-primary/10 border-muted-foreground/20",
                    "hover:border-primary/30 hover:text-primary hover:scale-105",
                    "flex items-center justify-center",
                    "active:scale-95 active:bg-primary/15"
                  )}
                >
                  <span className="text-sm">{item.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Available balance indicator */}
        {fromAsset && (
          <div className="text-sm text-muted-foreground flex items-center justify-end">
            <span className="mr-1">Available:</span>
            <span className="font-medium text-foreground">{formatCurrency(fromAsset.balance)}</span>
          </div>
        )}
      </div>
      
      {/* Description */}
      <motion.div variants={itemAnimation} className="space-y-2">
        <Label htmlFor="description" className="text-[15px] font-medium flex justify-between">
          <span>
            Description <span className="text-muted-foreground font-normal">(Optional)</span>
          </span>
          <span className={`text-xs ${description.length > 180 ? "text-amber-500" : "text-muted-foreground"} ${description.length >= 200 ? "text-destructive font-medium" : ""}`}>
            {description.length}/200
          </span>
        </Label>
        <textarea
          id="description"
          name="description"
          placeholder="Add a note for this transfer (max 200 characters)"
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary resize-none h-24 text-[16px]"
          value={description}
          onChange={handleDescriptionChange}
          ref={descriptionRef}
          maxLength={200}
        />
      </motion.div>
      
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div 
            variants={itemAnimation}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-md"
          >
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview transfer effect */}
      <AnimatePresence>
        {fromAsset && toAsset && formattedAmount && parseFloat(formattedAmount) > 0 && parseFloat(formattedAmount) <= fromAsset.balance && (
          <motion.div 
            variants={itemAnimation}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-muted/30 p-4 rounded-lg border border-border mt-2"
          >
            <h4 className="font-medium mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-primary" />
              Transfer Preview
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium text-right">{formatCurrency(parseFloat(formattedAmount))}</span>
              
              <span className="text-muted-foreground">New source balance:</span>
              <span className="font-medium text-right">{formatCurrency(fromAsset.balance - parseFloat(formattedAmount))}</span>
              
              <span className="text-muted-foreground">New destination balance:</span>
              <span className="font-medium text-right">{formatCurrency(toAsset.balance + parseFloat(formattedAmount))}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[90vh] flex flex-col focus-visible:outline-none">
        <DrawerHeader className="border-b px-4 pb-4 pt-6 flex-shrink-0">
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-primary mx-auto shadow-lg shadow-primary/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <ArrowLeftRight className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          
          <DrawerTitle className="text-xl font-semibold text-center">
            Transfer Funds
          </DrawerTitle>
          <DrawerDescription className="text-center">
            Move money between your accounts
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 py-4 overflow-auto">
          {!hasEnoughAssets ? (
            renderNotEnoughAssetsView()
          ) : (
            renderTransferForm()
          )}
        </ScrollArea>
        
        {/* Footer with action buttons */}
        <DrawerFooter className="border-t pt-4 pb-6 flex-shrink-0 mt-auto bg-background">
          {!hasEnoughAssets ? (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Close
            </Button>
          ) : (
            <div className="grid gap-2">
              <Button 
                onClick={handleTransfer}
                disabled={
                  hasExactlyTwoAssets ? 
                    // For exactly two assets case, just check the amount
                    (!formattedAmount || parseFloat(formattedAmount) <= 0 || 
                     (fromAsset && parseFloat(formattedAmount) > fromAsset.balance) ||
                     (validAssets[0] && !fromAsset && parseFloat(formattedAmount) > validAssets[0].balance)) :
                    // For more than two assets, check asset selection too
                    (!fromAssetId || 
                  !toAssetId || 
                  !formattedAmount || 
                  parseFloat(formattedAmount) <= 0 || 
                     (fromAsset && parseFloat(formattedAmount) > fromAsset.balance))
                }
                className="h-12 font-medium focus:ring-2 focus:ring-offset-2 focus:ring-primary bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Complete Transfer
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 