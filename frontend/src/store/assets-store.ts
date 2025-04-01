import { create } from "zustand";
import { Asset } from "@/types/assets";
import { v4 as uuidv4 } from "uuid";

interface AssetsState {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, "id">) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  transferAmount: (fromId: string, toId: string, amount: number) => void;
}

export const useAssetsStore = create<AssetsState>((set) => ({
  // Initial state - pre-populated with some sample assets
  assets: [],
  
  // Add a new asset
  addAsset: (assetData) => set((state) => ({
    assets: [
      ...state.assets,
      {
        id: uuidv4(),
        ...assetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })),
  
  // Update an existing asset
  updateAsset: (updatedAsset) => set((state) => ({
    assets: state.assets.map((asset) =>
      asset.id === updatedAsset.id
        ? { ...updatedAsset, updatedAt: new Date().toISOString() }
        : asset
    ),
  })),
  
  // Delete an asset
  deleteAsset: (id) => set((state) => ({
    assets: state.assets.filter((asset) => asset.id !== id),
  })),
  
  // Transfer money between assets
  transferAmount: (fromId, toId, amount) => set((state) => {
    // Find the source and target assets
    const fromAsset = state.assets.find((a) => a.id === fromId);
    const toAsset = state.assets.find((a) => a.id === toId);
    
    if (!fromAsset || !toAsset || amount <= 0 || amount > fromAsset.balance) {
      console.error("Invalid transfer", { fromAsset, toAsset, amount });
      return state;
    }
    
    // Create new assets with updated balances
    const now = new Date().toISOString();
    
    const updatedAssets = state.assets.map((asset) => {
      if (asset.id === fromId) {
        return {
          ...asset,
          balance: Number((asset.balance - amount).toFixed(2)),
          updatedAt: now,
        };
      }
      if (asset.id === toId) {
        return {
          ...asset,
          balance: Number((asset.balance + amount).toFixed(2)),
          updatedAt: now,
        };
      }
      return asset;
    });
    
    return { assets: updatedAssets };
  }),
})); 