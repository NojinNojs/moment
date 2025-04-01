import { Asset, AssetType } from "@/types/assets";
import { 
  Wallet, 
  Landmark, 
  CreditCard, 
  ShieldAlert,
  DollarSign
} from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Get the appropriate icon component for an asset type
 * @param assetType The type of asset
 * @returns The corresponding Lucide icon component
 */
export function getAssetIcon(assetType: AssetType): LucideIcon {
  switch (assetType) {
    case "cash":
      return Wallet;
    case "bank":
      return Landmark;
    case "e-wallet":
      return CreditCard;
    case "emergency":
      return ShieldAlert;
    default:
      return DollarSign;
  }
}

// Interface for theme color variations
interface ColorSet {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  darkBg: string;
  darkText: string;
}

// Color sets for each asset type
const assetColors: Record<AssetType, ColorSet> = {
  "cash": {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
    hoverBg: "hover:bg-green-200",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400"
  },
  "bank": {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    hoverBg: "hover:bg-blue-200",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400"
  },
  "e-wallet": {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
    hoverBg: "hover:bg-purple-200",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400"
  },
  "emergency": {
    bg: "bg-amber-100",
    text: "text-amber-600", 
    border: "border-amber-200",
    hoverBg: "hover:bg-amber-200",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400"
  }
};

/**
 * Get the icon background color class for an asset type
 * @param assetType The type of asset
 * @param darkMode Whether to include dark mode classes
 * @returns Tailwind CSS class string for icon background
 */
export function getAssetIconBg(assetType: AssetType, darkMode = true): string {
  const colors = assetColors[assetType] || assetColors.bank;
  return `${colors.bg} ${colors.text} ${darkMode ? colors.darkBg + ' ' + colors.darkText : ''}`;
}

/**
 * Get the card border color class for an asset type
 * @param assetType The type of asset
 * @returns Tailwind CSS class string for card border
 */
export function getAssetBorderColor(assetType: AssetType): string {
  const colors = assetColors[assetType] || assetColors.bank;
  return colors.border;
}

/**
 * Get the color accent for an asset type
 * @param assetType The type of asset
 * @param element The element to style (bg, text, or border)
 * @returns Tailwind CSS class string
 */
export function getAssetColor(assetType: AssetType, element: 'bg' | 'text' | 'border' | 'hoverBg' = 'bg'): string {
  const colors = assetColors[assetType] || assetColors.bank;
  return colors[element];
}

/**
 * Group assets by their type category
 * @param assets Array of assets to group
 * @returns Object with assets grouped by type
 */
export function groupAssetsByCategory(assets: Asset[]): Record<AssetType, Asset[]> {
  return {
    cash: assets.filter(asset => asset.type === "cash"),
    bank: assets.filter(asset => asset.type === "bank"),
    "e-wallet": assets.filter(asset => asset.type === "e-wallet"),
    emergency: assets.filter(asset => asset.type === "emergency"),
  };
}

/**
 * Calculate total balance of assets
 * @param assets Array of assets
 * @returns Total balance as a number
 */
export function calculateTotalBalance(assets: Asset[]): number {
  return assets.reduce((total, asset) => total + asset.balance, 0);
}

/**
 * Filter out deleted assets
 * @param assets Array of assets to filter
 * @returns Array of non-deleted assets
 */
export function filterActiveAssets(assets: Asset[]): Asset[] {
  return assets.filter(asset => !asset.isDeleted);
}

/**
 * Sort assets by balance (descending by default)
 * @param assets Array of assets to sort
 * @param ascending Whether to sort in ascending order
 * @returns Sorted array of assets
 */
export function sortAssetsByBalance(assets: Asset[], ascending = false): Asset[] {
  return [...assets].sort((a, b) => 
    ascending 
      ? a.balance - b.balance 
      : b.balance - a.balance
  );
}

/**
 * Sort assets by name
 * @param assets Array of assets to sort
 * @returns Sorted array of assets
 */
export function sortAssetsByName(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => a.name.localeCompare(b.name));
} 