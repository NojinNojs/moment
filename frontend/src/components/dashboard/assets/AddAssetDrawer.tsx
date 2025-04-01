import { useEffect } from "react";
import {
  PlusCircle,
  DollarSign,
  Wallet,
  Landmark,
  CreditCard,
  Coins,
  ArrowLeft,
} from "lucide-react";
import { Asset, AssetType } from "@/types/assets";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AddAssetDrawerProps {
  open: boolean;
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
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  institution: z.string().optional(),
  description: z.string().optional(),
});

export function AddAssetDrawer({
  open,
  onOpenChange,
  onAddAsset,
  initialAssetType,
}: AddAssetDrawerProps) {
  // Setup form with validation
  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      type: (initialAssetType as ValidAssetType) || "cash",
      balance: 0,
      institution: "",
      description: "",
    },
  });

  // Update form when initialAssetType changes
  useEffect(() => {
    if (
      initialAssetType &&
      ["cash", "bank", "e-wallet", "emergency"].includes(initialAssetType)
    ) {
      form.setValue("type", initialAssetType as ValidAssetType);
    }
  }, [initialAssetType, form]);

  // Reset form when drawer is opened
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        type: (initialAssetType as ValidAssetType) || "cash",
        balance: 0,
        institution: "",
        description: "",
      });
    }
  }, [open, form, initialAssetType]);

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

  // Handle form submission
  const onSubmit = (values: z.infer<typeof assetSchema>) => {
    try {
      onAddAsset({
        name: values.name,
        type: values.type as AssetType,
        balance: values.balance,
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-h-[85vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0 text-center flex flex-col items-center border-b pb-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2 h-8 w-8 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>

          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-primary/90 shadow-lg shadow-primary/20"
            initial="initial"
            animate="animate"
            variants={iconAnimation}
          >
            <PlusCircle className="h-8 w-8 text-primary-foreground" />
          </motion.div>

          <DrawerTitle className="text-xl font-semibold text-center">
            Add New Asset
          </DrawerTitle>
          <DrawerDescription className="opacity-80 mt-1 text-center">
            Create a new asset to track your money
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-4 overflow-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pr-2"
            >
              <motion.div
                variants={containerAnimation}
                initial="hidden"
                animate="show"
                className="space-y-4"
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
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[2000]">
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
                            className="h-10 text-[16px]"
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
                          <div className="relative">
                            <div
                              className={cn(
                                "absolute left-0 top-0 bottom-0 flex items-center justify-center w-10 rounded-l-md border-r",
                                "bg-muted/50 text-muted-foreground"
                              )}
                            >
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <Input
                              inputMode="decimal"
                              placeholder="0.00"
                              className="pl-12 h-10 font-medium text-[16px]"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => {
                                // Accept only numeric input with at most one decimal point
                                const value = e.target.value;
                                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                  // Handle special cases
                                  if (value === "") {
                                    field.onChange(0);
                                  } else if (value === ".") {
                                    field.onChange(0);
                                  } else {
                                    field.onChange(parseFloat(value));
                                  }
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter the current balance of this asset
                        </FormDescription>
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
                              className="h-10 text-[16px]"
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
                            className="h-24 min-h-[80px] resize-none text-[16px]"
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

        <DrawerFooter className="flex-shrink-0 border-t bg-muted/30 pt-4 mt-auto z-10">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all font-medium h-10"
          >
            Add Asset
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
