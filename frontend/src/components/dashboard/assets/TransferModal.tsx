import { useState, useEffect, useRef, useMemo } from "react";
import { Asset } from "@/types/assets";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeftRight, 
  DollarSign, 
  AlertCircle,
  X,
  Info,
  PiggyBank,
  ArrowDown,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getAssetIcon, getAssetIconBg } from "@/lib/asset-utils";

// Define props
interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  sourceAsset: Asset;
  onTransfer: (fromAsset: Asset, toAsset: Asset, amount: number, description: string) => void;
  onAddAsset?: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  assets,
  sourceAsset,
  onTransfer,
  onAddAsset
}: TransferModalProps) {
  // State variables
  const [fromAssetId, setFromAssetId] = useState<string>("");
  const [toAssetId, setToAssetId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  
  // Refs for handling direct input
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Reset form when modal opens and set default from asset
  useEffect(() => {
    if (isOpen) {
      // Clear previous selection state
      setError("");
      setAmount("");
      setDescription("");
      
      // Set the source asset
      if (sourceAsset) {
        const sourceId = sourceAsset.id || sourceAsset._id || "";
        setFromAssetId(sourceId);
      
      // If exactly two assets, auto-select the other one
      if (hasExactlyTwoAssets) {
          const otherAsset = validAssets.find(asset => {
            const assetId = asset.id || asset._id || "";
            const sourceId = sourceAsset.id || sourceAsset._id || "";
            return assetId !== sourceId;
          });
          
        if (otherAsset) {
            const otherId = otherAsset.id || otherAsset._id || "";
            setToAssetId(otherId);
          } else {
            setToAssetId("");
          }
        } else {
          setToAssetId("");
        }
      } else {
        setFromAssetId("");
        setToAssetId("");
      }
    }
  }, [isOpen, sourceAsset, validAssets, hasExactlyTwoAssets]);
  
  // Get the selected assets with improved logging
  const fromAsset = useMemo(() => {
    const asset = validAssets.find(asset => {
      const assetId = asset.id || asset._id || "";
      return assetId === fromAssetId;
    });
    return asset;
  }, [validAssets, fromAssetId]);

  const toAsset = useMemo(() => {
    const asset = validAssets.find(asset => {
      const assetId = asset.id || asset._id || "";
      return assetId === toAssetId;
    });
    return asset;
  }, [validAssets, toAssetId]);
  
  // Calculate destination assets (all assets except the currently selected source asset)
  const destinationAssets = useMemo(() => {
    try {
      // Ensure assets is always a valid array before filtering
      if (!assets || !Array.isArray(assets)) return [];
      
      return assets.filter(asset => {
        if (!asset || !fromAsset) return false;
        const assetId = asset.id || asset._id;
        const fromAssetId = fromAsset.id || fromAsset._id;
        return assetId !== fromAssetId;
      });
    } catch (error) {
      console.error("Error filtering destination assets:", error);
      return [];
    }
  }, [assets, fromAsset]);
  
  // Swap source and destination assets
  const handleSwapAssets = () => {
    if (!fromAsset || !toAsset) return;
    
    // Animation-friendly swap with small delay
    setFromAssetId("");
    setToAssetId("");
    
    setTimeout(() => {
      setFromAssetId(toAssetId);
      setToAssetId(fromAssetId);
      
      // Clear any asset-related error messages
      if (error && (error.includes("source") || error.includes("destination") || error.includes("same"))) {
        setError("");
      }
    }, 50);
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Accept only numeric input with at most one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };
  
  // When submitting, grab the current values from state
  const handleSubmit = () => {
    // Get the latest values from state
    const currentAmount = amount;
    const currentDescription = description;
    
    if (!fromAsset) {
      setError("Please select a source asset");
      return;
    }
    
    if (!currentAmount || Number(currentAmount) <= 0) {
      setError("Amount must be greater than zero");
      return;
    }
    
    if (!toAsset) {
      setError("Please select a destination asset");
      return;
    }
    
    // Convert IDs to strings for safe comparison
    const fromAssetId = String(fromAsset.id || fromAsset._id || '');
    const toAssetId = String(toAsset.id || toAsset._id || '');
    
    // Check only ID equality, not name
    if (fromAssetId === toAssetId) {
      setError("Source and destination cannot be the same");
      return;
    }
    
    const numericAmount = parseFloat(currentAmount);
    
    if (numericAmount > fromAsset.balance) {
      setError(`Amount exceeds available balance of ${formatCurrency(fromAsset.balance)}`);
      return;
    }
    
    try {
      // Call the onTransfer callback with the correct parameters
      onTransfer(fromAsset, toAsset, numericAmount, currentDescription);
      
      // Reset form
      setAmount("");
      setDescription("");
      setToAssetId("");
      setError("");
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error transferring funds:", error);
      toast.error("Failed to transfer funds", {
        description: "Please try again later",
      });
    }
  };
  
  // Quick set buttons for amount
  const setQuickAmount = (percentage: number) => {
    if (fromAsset) {
      const quickAmount = (fromAsset.balance * percentage).toFixed(2);
      setAmount(quickAmount);
    }
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
            onClose();
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
                "w-full justify-between h-11 bg-background font-normal",
                !value && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed",
                "focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              )}
              disabled={disabled}
            >
              {selectedAsset ? (
                <div className="flex items-center gap-2 w-full">
                  <span className={cn("flex items-center justify-center rounded-full w-7 h-7", getAssetIconBg(selectedAsset.type))}>
                    {(() => {
                      const AssetIcon = getAssetIcon(selectedAsset.type);
                      return <AssetIcon className="h-4 w-4" />;
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
                          "flex items-center justify-center rounded-full w-8 h-8", 
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
  
  // Main transfer form
  const renderTransferForm = () => {
    return (
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
                setFromAssetId(value);
                // Reset to asset if it's the same
                if (value === toAssetId) {
                  setToAssetId("");
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
                setToAssetId(value);
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
        
        {/* Amount */}
        <motion.div variants={itemAnimation} className="space-y-2">
          <Label htmlFor="amount" className="text-[15px] font-medium">Amount</Label>
          <div className="relative">
            <div className={cn(
              "absolute left-0 top-0 bottom-0 flex items-center justify-center w-11 rounded-l-md border-r",
              "bg-muted/50 text-muted-foreground"
            )}>
              <DollarSign className="h-4 w-4" />
            </div>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full pl-12 h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary font-medium text-[16px]"
              value={amount}
              onChange={handleAmountChange}
              ref={amountInputRef}
            />
          </div>
          
          {/* Quick buttons */}
          {fromAsset && (
          <div className="flex gap-2 mt-2">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
                className="flex-1 h-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => setQuickAmount(0.25)}
            >
              25%
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
                className="flex-1 h-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => setQuickAmount(0.5)}
            >
              50%
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
                className="flex-1 h-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => setQuickAmount(0.75)}
            >
              75%
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
                className="flex-1 h-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => setQuickAmount(1)}
            >
                Max
            </Button>
          </div>
          )}
          
          {/* Available balance indicator */}
          {fromAsset && (
            <div className="text-sm text-muted-foreground text-right">
            Available: <span className="font-medium">{formatCurrency(fromAsset.balance)}</span>
          </div>
          )}
        </motion.div>
        
        {/* Description */}
        <motion.div variants={itemAnimation} className="space-y-2">
          <Label htmlFor="description" className="text-[15px] font-medium">
            Description <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <textarea
            id="description"
            name="description"
            placeholder="Add a note for this transfer"
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary resize-none h-24 text-[16px]"
            value={description}
            onChange={handleDescriptionChange}
            ref={descriptionInputRef}
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
          {fromAsset && toAsset && amount && parseFloat(amount) > 0 && parseFloat(amount) <= fromAsset.balance && (
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
                <span className="font-medium text-right">{formatCurrency(parseFloat(amount))}</span>
                
                <span className="text-muted-foreground">New source balance:</span>
                <span className="font-medium text-right">{formatCurrency(fromAsset.balance - parseFloat(amount))}</span>
                
                <span className="text-muted-foreground">New destination balance:</span>
                <span className="font-medium text-right">{formatCurrency(toAsset.balance + parseFloat(amount))}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] max-h-[90vh] p-0 flex flex-col bg-background border border-border overflow-hidden">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 z-10 border-b px-6 flex flex-col items-center text-center flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-primary shadow-lg shadow-primary/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <ArrowLeftRight className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          
          <DialogTitle className="text-xl font-semibold text-center">
            Transfer Funds
          </DialogTitle>
          <DialogDescription className="opacity-80 mt-1 text-center">
            Move money between your accounts
          </DialogDescription>
        </DialogHeader>

        {!hasEnoughAssets ? (
          renderNotEnoughAssetsView()
        ) : (
          <>
            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-6 py-4 pb-24">
                {renderTransferForm()}
                      </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 bg-background border-t border-border fixed bottom-0 left-0 right-0 w-full z-20">
              <Button 
                onClick={handleSubmit} 
                size="lg"
                disabled={
                  !fromAsset || 
                  !toAsset || 
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  (fromAsset && parseFloat(amount) > fromAsset.balance)
                }
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-medium h-11 w-full"
              >
                Complete Transfer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 