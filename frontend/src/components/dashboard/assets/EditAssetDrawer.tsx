import { useState, useEffect } from "react";
import { Asset } from "@/types/assets";
import { motion } from "framer-motion";
import { 
  Edit, 
  X,
  PiggyBank,
  Wallet,
  Leaf,
  Check,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface EditAssetDrawerProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAsset: (asset: Asset, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "bank", "e-wallet", "emergency"]),
  balance: z.coerce.number().min(0, "Balance must be 0 or greater"),
  institution: z.string().optional(),
  description: z.string().optional(),
});

export function EditAssetDrawer({
  asset,
  isOpen,
  onOpenChange,
  onUpdateAsset,
}: EditAssetDrawerProps) {
  const [loading, setLoading] = useState(false);

  // Set up form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset.name,
      balance: asset.balance,
      type: asset.type,
      institution: asset.institution || "",
      description: asset.description || "",
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Ensure asset ID is present
    if (!asset?.id) {
      toast.error("Error", {
        description: "Asset ID is missing. Please try again."
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the complete asset object with ID first
      const completeAsset: Asset = {
        id: asset.id,
        ...values,
        createdAt: asset.createdAt,
        updatedAt: new Date().toISOString(),
        isDeleted: asset.isDeleted || false
      };
      
      // Call the update function and pass the loading state setter
      onUpdateAsset(completeAsset, setLoading);
      
      // Add safety timeout to reset loading state if parent component doesn't
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 seconds safety timeout
      
      // Clear timeout on unmount
      return () => clearTimeout(safetyTimeout);
    } catch (_error) {
      console.error("Failed to update asset:", _error);
      setLoading(false);
      toast.error("Failed to update asset", {
        description: "An error occurred. Please try again later."
      });
    }
  };

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
      form.reset({
        name: asset.name,
        balance: asset.balance,
        type: asset.type,
        institution: asset.institution || "",
        description: asset.description || ""
      });
    }
  }, [isOpen, asset, form]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-h-[85vh] bg-background border-t border-border pb-safe flex flex-col">
        <DrawerHeader className="flex-shrink-0 text-center flex flex-col items-center border-b pb-3 pt-4 px-5 relative">
          <button 
            onClick={() => onOpenChange(false)} 
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-primary shadow-lg shadow-primary/20"
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <Edit className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          
          <DrawerTitle className="text-lg text-center">Edit Asset</DrawerTitle>
          <DrawerDescription className="opacity-80 text-xs text-center">
            Update your {asset.type} asset details
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 py-4 overflow-auto">
          <motion.div
            className="pr-2 space-y-5"
            initial="initial"
            animate="animate"
            variants={contentAnimation}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Asset Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Asset Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                        </FormControl>
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
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <span>E-Wallet</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="emergency">
                            <div className="flex items-center gap-2">
                              <Leaf className="h-4 w-4 text-muted-foreground" />
                              <span>Emergency Fund</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Asset Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Asset Name</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          placeholder="Enter a name for this asset"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Asset Balance */}
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Current Balance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-11 rounded-l-md border-r bg-muted/50 text-muted-foreground">
                            <span className="text-sm">$</span>
                          </div>
                          <Input
                            className="pl-12 h-11 font-medium"
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Institution (conditional) */}
                {(form.watch("type") === "bank" || 
                  form.watch("type") === "e-wallet") && (
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Institution</FormLabel>
                        <FormControl>
                          <Input
                            className="h-11"
                            placeholder="Enter institution name"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Bank name, fintech company, or e-wallet provider
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about this asset"
                          className="resize-none min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            
            {/* Extra space at the bottom for comfortable scrolling */}
            <div className="h-4"></div>
          </motion.div>
        </ScrollArea>
        
        <DrawerFooter className="flex-shrink-0 border-t bg-muted/30 pt-4 pb-6 px-4 mt-auto mb-safe z-10">
          <Button 
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full shadow-md hover:shadow-lg transition-all h-12"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Updating...</span>
              </div>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 