// Define the possible asset types
export type AssetType = "cash" | "bank" | "e-wallet" | "emergency";

// Define the asset interface
export interface Asset {
  id?: string; // Frontend ID, might be missing in MongoDB data 
  _id?: string; // MongoDB ID
  name: string;
  type: AssetType;
  balance: number;
  institution?: string;
  description?: string;
  color?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  types: AssetType[];
}

// Basic AssetTransfer interface
export interface AssetTransfer {
  _id?: string;     // MongoDB ID
  id?: string;      // Frontend ID
  // Allow for both direct ID strings and objects with full asset details
  fromAsset?: {
    _id: string;
    id?: string;
    name: string;
    type: string;
  } | string;
  toAsset?: {
    _id: string;
    id?: string;
    name: string;
    type: string;
  } | string;
  // Also support direct ID references that would be used in type definitions
  fromAssetId?: string;
  toAssetId?: string;
  amount: number;
  description?: string;
  date: Date | string;
  createdAt?: string;
  updatedAt?: string;
} 