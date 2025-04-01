import { motion } from "framer-motion";
import { Asset } from "@/types/assets";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Landmark,
  CreditCard,
  CircleDollarSign,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Add a function to get category color class based on category name
function getCategoryColorClass(category: string): string {
  switch (category.toLowerCase()) {
    case "cash":
      return "text-green-600 bg-green-100 dark:bg-green-950/20 dark:text-green-400";
    case "bank accounts":
    case "bank":
      return "text-blue-600 bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400";
    case "e-wallets":
    case "e-wallet":
      return "text-purple-600 bg-purple-100 dark:bg-purple-950/20 dark:text-purple-400";
    case "emergency funds":
    case "emergency":
      return "text-orange-600 bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400";
    case "property":
      return "text-pink-600 bg-pink-100 dark:bg-pink-950/20 dark:text-pink-400";
    case "vehicle":
      return "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400";
    case "investment":
      return "text-amber-600 bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400";
    default:
      return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  }
}

// Get border color based on category
function getCategoryBorderColor(category: string): string {
  switch (category.toLowerCase()) {
    case "cash":
      return "group-hover:border-green-300 dark:group-hover:border-green-800";
    case "bank accounts":
    case "bank":
      return "group-hover:border-blue-300 dark:group-hover:border-blue-800";
    case "e-wallets":
    case "e-wallet":
      return "group-hover:border-purple-300 dark:group-hover:border-purple-800";
    case "emergency funds":
    case "emergency":
      return "group-hover:border-orange-300 dark:group-hover:border-orange-800";
    default:
      return "group-hover:border-gray-300 dark:group-hover:border-gray-700";
  }
}

// Get icon based on asset type
function getAssetIcon(type: string) {
  switch (type.toLowerCase()) {
    case "cash":
      return <Wallet className="h-4 w-4" />;
    case "bank":
      return <Landmark className="h-4 w-4" />;
    case "e-wallet":
      return <CreditCard className="h-4 w-4" />;
    case "emergency":
      return <CircleDollarSign className="h-4 w-4" />;
    default:
      return <CircleDollarSign className="h-4 w-4" />;
  }
}

interface AssetCategoryItemProps {
  category: string;
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  onTransferClick?: (asset: Asset) => void;
}

export function AssetCategoryItem({
  category,
  assets,
  onAssetClick,
}: AssetCategoryItemProps) {
  const categoryColorClass = getCategoryColorClass(category);
  const categoryBorderClass = getCategoryBorderColor(category);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 24,
      },
    },
  };

  return (
    <Card className="shadow-md border overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-background to-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Badge
              variant="outline"
              className={cn("py-1 font-medium", categoryColorClass)}
            >
              {category}
            </Badge>
          </div>

          <CardTitle className="text-lg font-semibold">
            $
            {assets
              .reduce((total, asset) => total + asset.balance, 0)
              .toLocaleString()}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {assets.length > 0 ? (
          <motion.div
            className="grid gap-2.5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {assets.map((asset) => (
              <motion.div
                key={asset.id || asset._id}
                variants={itemVariants}
                className={cn(
                  "group relative bg-background border rounded-lg p-3.5 shadow-sm",
                  "hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
                  "bg-gradient-to-r from-transparent to-muted/10",
                  categoryBorderClass
                )}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(var(--card), 0.8)",
                  transition: { type: "spring", stiffness: 400, damping: 10 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAssetClick(asset)}
              >
                {/* Background decorative elements */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-tl from-foreground/5 to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />

                <div className="flex items-center justify-between z-10 relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-full",
                        "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                        categoryColorClass
                      )}
                    >
                      {getAssetIcon(asset.type)}
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {asset.name}
                      </h3>
                      <div className="flex items-center">
                        <p className="text-sm text-muted-foreground">
                          {asset.institution}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "font-semibold group-hover:font-bold group-hover:scale-105 transition-all text-right",
                        asset.type === "cash"
                          ? "group-hover:text-green-600"
                          : asset.type === "bank"
                          ? "group-hover:text-blue-600"
                          : asset.type === "e-wallet"
                          ? "group-hover:text-purple-600"
                          : asset.type === "emergency"
                          ? "group-hover:text-orange-600"
                          : "group-hover:text-primary"
                      )}
                    >
                      ${asset.balance.toLocaleString()}
                    </p>

                    <motion.div
                      className="flex items-center justify-center h-6 w-6 rounded-full text-primary opacity-50 group-hover:opacity-100"
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 0.75,
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
            <p className="text-sm">No {category.toLowerCase()} assets found</p>
            <p className="text-xs mt-1 mb-2">
              Add your first {category.toLowerCase()} asset
            </p>
            <Button 
              key={`add-${category.toLowerCase()}`}
              size="sm" 
              variant="outline" 
              className="mt-1"
            >
              Add {category.slice(0, -1)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
