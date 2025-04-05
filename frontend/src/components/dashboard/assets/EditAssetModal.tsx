import { useState, useEffect } from "react";
import { Asset, AssetType } from "@/types/assets";
import { motion } from "framer-motion";
import { 
  Edit, 
  X,
  Wallet,
  CreditCard,
  Landmark,
  Coins,
  Loader2,
  Save,
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
import { CurrencyInput } from "@/components/dashboard/transactions/forms/CurrencyInput";

// Define valid asset types to match the drawer
type ValidAssetType = "cash" | "bank" | "e-wallet" | "emergency";
const ASSET_TYPES = [
  { value: "cash", label: "Cash Account", icon: Wallet },
  { value: "emergency", label: "Emergency Fund", icon: Coins },
  { value: "bank", label: "Bank Account", icon: Landmark },
  { value: "e-wallet", label: "E-Wallet", icon: CreditCard },
];

// Define props
interface EditAssetModalProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAsset: (asset: Asset, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) => void;
}

export function EditAssetModal({
  asset,
  isOpen,
  onOpenChange,
  onUpdateAsset,
}: EditAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: asset?.name || "",
    type: (asset?.type as ValidAssetType) || "cash",
    balance: asset?.balance?.toString() || "0",
    institution: asset?.institution || "",
    description: asset?.description || "",
  });

  // Animation variants
  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 15 } }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }
  };

  // Reset form when asset changes
  useEffect(() => {
    if (isOpen && asset) {
      setForm({
        name: asset.name || "",
        type: (asset.type as ValidAssetType) || "cash",
        balance: asset.balance?.toString() || "0",
        institution: asset.institution || "",
        description: asset.description || "",
      });
    }
  }, [isOpen, asset]);

  // Get the current selected asset type
  const selectedType = form.type;

  // Conditionally show fields based on asset type
  const showInstitutionField = ["bank", "e-wallet"].includes(selectedType);

  const handleSubmit = () => {
    if (!form.name) return;
    
    setLoading(true);
    
    // Normalize and parse the balance value correctly
    let parsedBalance = 0;
    
    if (form.balance) {
      let parseableValue = form.balance;
      
      // Handle Indonesian format (1.234,56)
      if (typeof form.balance === 'string' && form.balance.includes(',')) {
        parseableValue = form.balance.replace(/\./g, '').replace(/,/g, '.');
      } 
      // Handle US format (1,234.56)
      else if (typeof form.balance === 'string') {
        parseableValue = form.balance.replace(/,/g, '');
      }
      
      parsedBalance = parseFloat(parseableValue) || 0;
    }
    
    const updatedAsset: Asset = {
      id: asset.id,
      _id: asset._id,
      name: form.name,
      type: form.type as AssetType,
      balance: parsedBalance,
      institution: form.institution,
      description: form.description,
      createdAt: asset.createdAt,
      updatedAt: new Date().toISOString(),
      isDeleted: asset.isDeleted || false
    };

    onUpdateAsset(updatedAsset, setLoading);
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
          
          <DialogTitle className="text-xl font-semibold text-center">
            Edit Asset
          </DialogTitle>
          <DialogDescription className="opacity-80 mt-1 text-center">
            Update your {selectedType} asset details
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          <motion.div
            className="pr-2 space-y-5"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <div className="space-y-5">
              {/* Asset Type */}
              <div>
                <Label htmlFor="asset-type" className="text-base">Asset Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({...form, type: value as ValidAssetType})}
                >
                  <SelectTrigger id="asset-type" className="h-11">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="cursor-pointer h-10"
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex items-center justify-center bg-muted/50 rounded-full w-7 h-7">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Asset Name */}
              <div>
                <Label htmlFor="name" className="text-base">Asset Name</Label>
                <Input
                  id="name"
                  placeholder="Enter asset name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="h-11 text-[16px]"
                />
              </div>

              {/* Balance */}
              <div>
                <Label htmlFor="current-balance" className="text-base">Current Balance</Label>
                <CurrencyInput
                  id="current-balance"
                  value={form.balance}
                  onChange={(value) => {
                    // Handle empty input
                    if (value === "") {
                      setForm({...form, balance: "0"});
                      return;
                    }
                    
                    // Normalize the value for parseFloat during submission
                    // For now, just store the raw input string
                    setForm({...form, balance: value});
                  }}
                  placeholder="0.00"
                  className="w-full"
                  locale="en-US" // Use US format by default, can be made configurable
                />
              </div>

              {/* Institution (conditional) */}
              {showInstitutionField && (
                <div>
                  <Label htmlFor="institution" className="text-base">
                    {selectedType === "bank" ? "Bank Name" : "Provider"}
                  </Label>
                  <Input
                    id="institution"
                    placeholder={
                      selectedType === "bank"
                        ? "e.g., BCA, Mandiri"
                        : "e.g., GoPay, OVO, DANA"
                    }
                    value={form.institution}
                    onChange={(e) => setForm({...form, institution: e.target.value})}
                    className="h-11 text-[16px]"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add notes or details about this asset"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="h-24 resize-none text-[16px]"
                />
              </div>
            </div>
          </motion.div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 z-20">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-medium h-11 w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}