import {
  CreditCard,
  Landmark,
  Edit,
  Trash2,
  Wallet,
  Coins,
  MoreHorizontal,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Asset } from "@/types/assets";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Extend the AssetType to include all possible asset types
type ExtendedAssetType = "cash" | "bank" | "e-wallet" | "emergency";

// Interface for AssetCard props
interface AssetCardProps {
  asset: Asset;
  onClick?: (asset: Asset) => void;
  onTransfer?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
}

export function AssetCard({
  asset,
  onTransfer,
  onEdit,
  onDelete,
  onClick,
}: AssetCardProps) {
  // Get icon based on asset type
  const getAssetIcon = (type: ExtendedAssetType) => {
    switch (type) {
      case "cash":
        return <Wallet className="h-5 w-5" />;
      case "bank":
        return <Landmark className="h-5 w-5" />;
      case "e-wallet":
        return <CreditCard className="h-5 w-5" />;
      case "emergency":
        return <Coins className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  // Get background color based on asset type
  const getAssetIconBg = (type: ExtendedAssetType) => {
    switch (type) {
      case "cash":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "bank":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "e-wallet":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "emergency":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get gradient based on asset type
  const getAssetGradient = (type: ExtendedAssetType) => {
    switch (type) {
      case "cash":
        return "from-green-50 dark:from-green-950/5";
      case "bank":
        return "from-blue-50 dark:from-blue-950/5";
      case "e-wallet":
        return "from-purple-50 dark:from-purple-950/5";
      case "emergency":
        return "from-amber-50 dark:from-amber-950/5";
      default:
        return "from-gray-50 dark:from-gray-950/5";
    }
  };

  // Get border hover color based on asset type
  const getAssetBorderHover = (type: ExtendedAssetType) => {
    switch (type) {
      case "cash":
        return "group-hover:border-green-200 dark:group-hover:border-green-800";
      case "bank":
        return "group-hover:border-blue-200 dark:group-hover:border-blue-800";
      case "e-wallet":
        return "group-hover:border-purple-200 dark:group-hover:border-purple-800";
      case "emergency":
        return "group-hover:border-amber-200 dark:group-hover:border-amber-800";
      default:
        return "group-hover:border-gray-200 dark:group-hover:border-gray-700";
    }
  };

  // Add onClick handling to the Card component
  const handleClick = () => {
    if (onClick) {
      onClick(asset);
    }
  };

  const handleDelete = () => {
    const assetId = asset.id || asset._id;
    if (!assetId) {
      toast.error("Error", {
        description: "Invalid asset ID. Cannot delete asset."
      });
      return;
    }
    if (onDelete) {
      onDelete(assetId);
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.01,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "cursor-pointer group relative overflow-hidden border-background/80",
          "hover:shadow-lg transition-all duration-300",
          getAssetBorderHover(asset.type as ExtendedAssetType),
          "bg-gradient-to-r to-transparent",
          getAssetGradient(asset.type as ExtendedAssetType)
        )}
        onClick={handleClick}
      >
        {/* Decorative background elements */}
        <div className="absolute right-0 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity bg-gradient-to-tl from-foreground/10 to-transparent" />
        <div className="absolute -right-6 top-0 w-12 h-12 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br from-primary/20 to-transparent" />

        <CardHeader className="pb-2 flex flex-row items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "p-2 rounded-full transition-all duration-300",
                getAssetIconBg(asset.type as ExtendedAssetType)
              )}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              {getAssetIcon(asset.type as ExtendedAssetType)}
            </motion.div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {asset.name}
              </CardTitle>
              <CardDescription className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                {asset.institution || asset.description || asset.type}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                whileHover={{
                  scale: 1.1,
                  rotate: 15,
                  backgroundColor: "rgba(var(--primary), 0.1)",
                }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl overflow-hidden shadow-lg border-border/50"
            >
              {onTransfer && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransfer(asset);
                  }}
                  className="flex items-center gap-2 cursor-pointer h-9 px-3"
                >
                  <ArrowRightLeft className="h-4 w-4" /> Transfer Funds
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(asset);
                  }}
                  className="flex items-center gap-2 cursor-pointer h-9 px-3"
                >
                  <Edit className="h-4 w-4" /> Edit Asset
                </DropdownMenuItem>
              )}
              {asset.link && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(asset.link, "_blank");
                  }}
                  className="flex items-center gap-2 cursor-pointer h-9 px-3"
                >
                  <ExternalLink className="h-4 w-4" /> View Website
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="flex items-center gap-2 cursor-pointer text-destructive hover:text-destructive h-9 px-3 border-t"
                >
                  <Trash2 className="h-4 w-4" /> Delete Asset
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="pt-0 pb-4 relative z-10">
          <motion.p
            className={cn(
              "text-xl font-bold",
              asset.type === "cash"
                ? "text-green-600 dark:text-green-400"
                : asset.type === "bank"
                ? "text-blue-600 dark:text-blue-400"
                : asset.type === "e-wallet"
                ? "text-purple-600 dark:text-purple-400"
                : asset.type === "emergency"
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary"
            )}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            ${asset.balance?.toLocaleString()}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
