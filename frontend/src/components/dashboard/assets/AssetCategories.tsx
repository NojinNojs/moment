import { motion } from "framer-motion";
import { Asset } from "@/types/assets";
import { AssetCategoryItem } from "./AssetCategoryItem";
import { Badge } from "@/components/ui/badge";
import { Layers, FolderIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AssetCategoriesProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  onTransferClick?: (asset: Asset) => void;
  onAddClick?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      duration: 0.4,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
};

export function AssetCategories({
  assets,
  onAssetClick,
  onTransferClick,
  onAddClick,
}: AssetCategoriesProps) {
  // Group assets by category/type
  const cashAssets = assets.filter((asset) => asset.type === "cash");
  const bankAssets = assets.filter((asset) => asset.type === "bank");
  const eWalletAssets = assets.filter((asset) => asset.type === "e-wallet");
  const emergencyAssets = assets.filter((asset) => asset.type === "emergency");

  // Set up categories with correct string value
  const categories = [
    {
      id: "cash",
      assets: cashAssets,
      label: "Cash",
      color: "green",
    },
    {
      id: "bank",
      assets: bankAssets,
      label: "Bank Accounts",
      color: "blue",
    },
    {
      id: "e-wallet",
      assets: eWalletAssets,
      label: "E-Wallets",
      color: "purple",
    },
    {
      id: "emergency",
      assets: emergencyAssets,
      label: "Emergency Funds",
      color: "orange",
    },
  ].filter((category) => category.assets.length > 0);

  return (
    <motion.div
      className="mb-8 relative"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <motion.div
        className="flex items-center justify-between mb-6"
        variants={titleVariants}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-0.5">
            <FolderIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground leading-none mb-1">
              Asset Categories
            </h2>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-md bg-muted/50 text-muted-foreground"
              >
                <Layers className="h-3 w-3 mr-1 opacity-70" />
                {assets.length} Assets
              </Badge>
            </div>
          </div>
        </div>

        {onAddClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddClick}
            className="hover:bg-primary/10 hover:text-primary transition-all"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            <span>New Asset</span>
          </Button>
        )}
      </motion.div>

      <motion.div
        className={cn(
          "grid gap-5",
          categories.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        )}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <AssetCategoryItem
              category={category.label}
              assets={category.assets}
              onAssetClick={onAssetClick}
              onTransferClick={onTransferClick}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
