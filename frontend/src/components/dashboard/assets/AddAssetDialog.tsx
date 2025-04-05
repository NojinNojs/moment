import React from "react";
import {
  PlusCircle,
  Wallet,
  Landmark,
  CreditCard,
  Coins,
  X,
} from "lucide-react";
import { Asset, AssetType } from "@/types/assets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/dashboard/transactions/forms/CurrencyInput";
import useCurrencyFormat from '@/hooks/useCurrencyFormat';

interface AddAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAsset: (asset: Omit<Asset, "id">) => void;
  initialAssetType?: AssetType;
}

// Define valid asset types
type ValidAssetType = "cash" | "bank" | "e-wallet" | "emergency";

// Form validation schema
const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "bank", "e-wallet", "emergency"], {
    required_error: "Please select an asset type",
  }),
  balance: z.string().default("0"),
  institution: z.string().optional(),
  description: z.string().optional(),
});

export function AddAssetDialog({
  isOpen,
  onOpenChange,
  onAddAsset,
  initialAssetType,
}: AddAssetDialogProps) {
  // Get currency formatting hooks
  const { currencyLocale, currencySymbol } = useCurrencyFormat();
  
  // Setup form with validation
  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      type: (initialAssetType as ValidAssetType) || "cash",
      balance: "0",
      institution: "",
      description: "",
    },
  });

  // Update form when initialAssetType changes
  React.useEffect(() => {
    if (
      initialAssetType &&
      ["cash", "bank", "e-wallet", "emergency"].includes(initialAssetType)
    ) {
      form.setValue("type", initialAssetType as ValidAssetType);
    }
  }, [initialAssetType, form]);

  // Reset form when dialog is opened
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        type: (initialAssetType as ValidAssetType) || "cash",
        balance: "0",
        institution: "",
        description: "",
      });
    }
  }, [isOpen, form, initialAssetType]);

  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween" } },
  };

  const iconAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  };

  // Asset type options with Lucide icons
  const assetTypes = [
    { value: "cash", label: "Cash Account", icon: Wallet },
    { value: "emergency", label: "Emergency Fund", icon: Coins },
    { value: "bank", label: "Bank Account", icon: Landmark },
    { value: "e-wallet", label: "E-Wallet", icon: CreditCard },
  ];

  // Get the current selected asset type
  const selectedType = form.watch("type");

  // Conditionally show fields based on asset type
  const showInstitutionField = ["bank", "e-wallet"].includes(selectedType);

  // Convert string to number for the final submission
  const parseBalance = (value: string): number => {
    try {
      // For Indonesian locale
      if (currencyLocale === 'id-ID') {
        // Convert 1.234,56 to 1234.56
        const normalized = value.replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(normalized) || 0;
      } 
      // For US locale and others
      else {
        // Remove commas and parse
        const normalized = value.replace(/,/g, '');
        return parseFloat(normalized) || 0;
      }
    } catch (error) {
      console.error('Error parsing balance:', error);
      return 0;
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof assetSchema>) => {
    try {
      // Convert balance string to number only at submission time
      onAddAsset({
        name: values.name,
        type: values.type as AssetType,
        balance: parseBalance(values.balance),
        institution: values.institution,
        description: values.description,
      });

      // Remove toast notification to prevent duplicates
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating asset:", error);
      toast.error("Failed to create asset", {
        description: "Please try again",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[90vh] max-h-[90vh] p-0 flex flex-col bg-background border border-border">
        <DialogHeader className="sticky top-0 bg-background pt-6 pb-4 z-10 border-b px-6 flex flex-col items-center text-center flex-shrink-0">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-primary/90 shadow-lg shadow-primary/20"
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <PlusCircle className="h-8 w-8 text-primary-foreground" />
          </motion.div>

          <DialogTitle className="text-xl font-semibold text-center">
            Add New Asset
          </DialogTitle>
          <DialogDescription className="opacity-80 mt-1 text-center">
            Create a new asset to track your money
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 overflow-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 pr-4"
            >
              <motion.div
                variants={containerAnimation}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {/* Asset Type */}
                <motion.div variants={itemAnimation}>
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[15px] font-medium">
                          Asset Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[9999]">
                            {assetTypes.map((type) => {
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
                        <FormDescription className="text-xs">
                          The type of asset will determine how it's categorized
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Asset Name */}
                <motion.div variants={itemAnimation}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[15px] font-medium">
                          Asset Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Spending Money, BCA Account"
                            {...field}
                            className="h-11 text-[16px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Balance */}
                <motion.div variants={itemAnimation}>
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[15px] font-medium">
                          Current Balance
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0.00"
                            className="w-full"
                            locale={currencyLocale}
                            currencySymbol={currencySymbol}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Institution (conditional) */}
                {showInstitutionField && (
                  <motion.div variants={itemAnimation}>
                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[15px] font-medium">
                            {selectedType === "bank" ? "Bank Name" : "Provider"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                selectedType === "bank"
                                  ? "e.g., BCA, Mandiri"
                                  : "e.g., GoPay, OVO, DANA"
                              }
                              {...field}
                              value={field.value || ""}
                              className="h-11 text-[16px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Description (Optional) */}
                <motion.div variants={itemAnimation}>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[15px] font-medium">
                          Description{" "}
                          <span className="text-muted-foreground font-normal">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes or details about this asset"
                            className="h-24 resize-none text-[16px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* Extra space at the bottom */}
                <div className="h-4"></div>
              </motion.div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border mt-auto flex-shrink-0 z-20">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-medium h-11 w-full"
          >
            Add Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
