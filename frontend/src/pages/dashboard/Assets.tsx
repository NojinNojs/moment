import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { TransferModal, AddAssetDialog } from "@/components/dashboard/assets";
import { AddAssetDrawer } from "@/components/dashboard/assets";
import { Asset, AssetType } from "@/types/assets";
import { Building } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  AssetOverview,
  AssetCategories,
  AssetEmptyState,
  AssetActionButtons,
  AssetTips
} from "@/components/dashboard/assets";
import { AssetTransferDrawer } from "@/components/dashboard/assets/AssetTransferDrawer";
import { AssetDetails } from "@/components/dashboard/assets/AssetDetails";
import { EditAssetDrawer } from "@/components/dashboard/assets/EditAssetDrawer";
import { EditAssetModal } from "@/components/dashboard/assets";
import { DeleteAssetDialog } from "@/components/dashboard/assets/DeleteAssetDialog";
import apiService from "@/services/api";
import { toast } from "sonner";

// Interface for error objects
interface ApiErrorResponse {
  message?: string;
  data?: {
    message?: string;
  };
}

export default function Assets() {
  // State for modals and drawers
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferDrawer, setShowTransferDrawer] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showAssetDetailsDrawer, setShowAssetDetailsDrawer] = useState(false);
  const [showEditAssetDrawer, setShowEditAssetDrawer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>(undefined);
  const [initialAssetType, setInitialAssetType] = useState<AssetType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if viewing on mobile (used for conditional rendering and responsive layouts)
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for assets
  const [assets, setAssets] = useState<Asset[]>([]);

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  // Function to fetch assets from API
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAssets();
      
      if (response.success && response.data) {
        setAssets(response.data.filter((asset): asset is Asset => asset !== undefined));
      } else {
        setError(response.message || 'Failed to fetch assets');
        toast.error("Error", {
          description: response.message || 'Failed to fetch assets',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new asset
  const handleAddAsset = async (newAssetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiService.createAsset(newAssetData);
      
      if (response.success && response.data) {
        // Add the new asset to the local state
        setAssets(prevAssets => [...prevAssets, response.data].filter((asset): asset is Asset => asset !== undefined));
        
        toast.success("Asset Added", {
          description: `${newAssetData.name} has been added successfully.`,
        });
        
        // Close the add asset modal/drawer
        setShowAddAssetModal(false);
      } else {
        // Handle error response
        const errorMessage = response.message || 'Failed to add asset';
        
        // Make error message more user-friendly
        let displayMessage = errorMessage;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate key')) {
          displayMessage = `Cannot create an asset with the same name in the same category`;
        }
        
        toast.error("Failed to Add Asset", {
          description: displayMessage,
        });
      }
    } catch (err: unknown) {
      // Handle exception
      let errorMessage = 'An unexpected error occurred';
      
      if (err && typeof err === 'object') {
        // Try to extract error message from different possible formats
        const errorObj = err as ApiErrorResponse;
        errorMessage = errorObj.message || (errorObj.data && errorObj.data.message) || errorMessage;
      }
      
      // Make error message more user-friendly
      let displayMessage = errorMessage;
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate key')) {
        displayMessage = `Cannot create an asset with the same name in the same category`;
      }
      
      toast.error("Error", {
        description: displayMessage,
      });
    }
  };

  // Handle asset click for viewing details or editing
  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetailsDrawer(true);
  };

  // Handle opening transfer UI (modal on desktop, drawer on mobile)
  const handleTransferClick = (asset?: Asset) => {
    if (asset) {
      setSelectedAsset(asset);
    }
    
    if (isMobile) {
      setShowTransferDrawer(true);
    } else {
      setShowTransferModal(true);
    }
  };

  // Handle executing a transfer
  const handleTransfer = async (fromAsset: Asset, toAsset: Asset, amount: number, description: string) => {
    try {
      // Validate transfer
      if (fromAsset.balance < amount) {
        toast.error("Insufficient Funds", {
          description: `${fromAsset.name} does not have enough balance for this transfer.`,
        });
        return;
      }

      // Validate description length
      if (description && description.length > 200) {
        toast.error("Description Too Long", {
          description: "Transfer description cannot exceed 200 characters.",
        });
        return;
      }

      // Get the correct asset IDs
      const fromAssetId = fromAsset.id || fromAsset._id;
      const toAssetId = toAsset.id || toAsset._id;

      if (!fromAssetId || !toAssetId) {
        toast.error("Error", {
          description: "Invalid asset IDs. Please try again.",
        });
        return;
      }

      // Create the transfer via API
      const response = await apiService.createAssetTransfer({
        fromAsset: fromAssetId,
        toAsset: toAssetId,
        amount,
        description,
        date: new Date().toISOString()
      });

      if (response.success) {
        // Update the asset balances in local state
        setAssets((prevAssets) => 
          prevAssets.map((asset) => {
            const assetId = asset.id || asset._id;
            if (!assetId) return asset;
            
            if (assetId === fromAssetId) {
              return { ...asset, balance: asset.balance - amount };
            }
            if (assetId === toAssetId) {
              return { ...asset, balance: asset.balance + amount };
            }
            return asset;
          }).filter((asset): asset is Asset => asset !== undefined)
        );

        // Show success message
        toast.success("Transfer Successful", {
          description: `Successfully transferred ${amount} from ${fromAsset.name} to ${toAsset.name}`,
        });

        // Close the transfer modal/drawer
        setShowTransferModal(false);
        setShowTransferDrawer(false);
      } else {
        // Extract more user-friendly error message
        let errorMessage = response.message || 'An error occurred during the transfer';
        
        // Check for common validation errors and provide more user-friendly messages
        if (errorMessage.includes("Description cannot exceed 200 characters")) {
          errorMessage = "Transfer description cannot exceed 200 characters. Please shorten your description.";
        } else if (errorMessage.includes("Insufficient funds")) {
          errorMessage = `${fromAsset.name} has insufficient funds for this transfer.`;
        } else if (errorMessage.includes("validation failed")) {
          // Extract the specific validation error if possible
          const validationMatch = errorMessage.match(/validation failed: ([^:]+): ([^,]+)/);
          if (validationMatch && validationMatch.length >= 3) {
            const [, field, fieldError] = validationMatch;
            errorMessage = `${field}: ${fieldError}`;
          }
        }
        
        toast.error("Transfer Failed", {
          description: errorMessage,
        });
      }
    } catch (err) {
      // Extract meaningful error message from error object
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as Error).message);
      }
      
      // Friendly error formatting
      if (errorMessage.includes("Description cannot exceed 200 characters")) {
        errorMessage = "Transfer description cannot exceed 200 characters. Please shorten your description.";
      }
      
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  // Handle editing an asset
  const handleEditAsset = (asset: Asset) => {
    // Make sure we have a valid asset with ID
    if (!asset?.id && !asset?._id) {
      toast.error("Error", {
        description: "Cannot edit asset: Missing asset ID"
      });
      return;
    }
    
    // Normalize the asset ID
    const normalizedAsset = {
      ...asset,
      id: asset.id || asset._id
    };
    
    // Set the selected asset
    setSelectedAsset(normalizedAsset);
    
    // Open the appropriate UI based on device
    if (isMobile) {
      setShowEditAssetDrawer(true);
    } else {
      setShowEditModal(true);
    }
  };

  // Handle deleting an asset (initiates the delete dialog)
  const handleDeleteAsset = (assetId: string) => {
    // Find the asset to be deleted
    const assetToDelete = assets.find(asset => 
      (asset.id === assetId || asset._id === assetId)
    );
    
    if (assetToDelete) {
      setSelectedAsset(assetToDelete);
      setShowDeleteDialog(true);
    } else {
      toast.error("Error", {
        description: "Asset not found. Please refresh the page and try again."
      });
    }
  };

  // Handle confirming asset deletion
  const handleConfirmDelete = async () => {
    if (!selectedAsset) return;
    
    try {
      const assetId = selectedAsset.id || selectedAsset._id;
      if (!assetId) {
        toast.error("Error", {
          description: "Invalid asset ID. Please try again.",
        });
        return;
      }

      const response = await apiService.permanentDeleteAsset(assetId);
      
      if (response.success) {
        // Remove the asset from local state
        setAssets(prevAssets => 
          prevAssets.filter(a => {
            const aId = a.id || a._id;
            return aId !== assetId;
          })
        );
        
        // Close the delete dialog and clear selected asset
        setShowDeleteDialog(false);
        setSelectedAsset(undefined);
      } else {
        toast.error("Failed to Delete Asset", {
          description: response.message || 'An error occurred while deleting the asset',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  // Handle updating an asset
  const handleUpdateAsset = async (updatedAsset: Asset, setIsLoading?: React.Dispatch<React.SetStateAction<boolean>> | ((loading: boolean) => void)) => {
    try {
      const assetId = updatedAsset.id || updatedAsset._id;
      if (!assetId) {
        if (setIsLoading) setIsLoading(false);
        toast.error("Error", {
          description: "Invalid asset ID. Please try again.",
        });
        return;
      }

      const response = await apiService.updateAsset(assetId, updatedAsset);
      
      if (response.success && response.data) {
        // Update the asset in local state
        setAssets(prevAssets => 
          prevAssets.map(asset => {
            const aId = asset.id || asset._id;
            return aId === assetId ? response.data : asset;
          }).filter((asset): asset is Asset => asset !== undefined)
        );
        
        toast.success("Asset Updated", {
          description: `${updatedAsset.name} has been updated successfully.`,
        });
        
        // Close the edit modal/drawer
        setShowEditModal(false);
        setShowEditAssetDrawer(false);
        
        // Reset loading state
        if (setIsLoading) setIsLoading(false);
      } else {
        // Handle error response
        const errorMessage = response.message || 'Failed to update asset';
        
        // Make error message more user-friendly
        let displayMessage = errorMessage;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate key')) {
          displayMessage = `Cannot update to an asset with the same name in the same category`;
        }
        
        toast.error("Failed to Update Asset", {
          description: displayMessage,
        });
        
        // Reset loading state on error
        if (setIsLoading) setIsLoading(false);
      }
    } catch (err: unknown) {
      // Handle exception
      let errorMessage = 'An unexpected error occurred';
      
      if (err && typeof err === 'object') {
        // Try to extract error message from different possible formats
        const errorObj = err as ApiErrorResponse;
        errorMessage = errorObj.message || (errorObj.data && errorObj.data.message) || errorMessage;
      }
      
      // Make error message more user-friendly
      let displayMessage = errorMessage;
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate key')) {
        displayMessage = `Cannot update to an asset with the same name in the same category`;
      }
      
      toast.error("Error", {
        description: displayMessage,
      });
      
      // Reset loading state on error
      if (setIsLoading) setIsLoading(false);
    }
  };

  // Handle opening the add asset modal
  const handleAddClick = () => {
    setShowAddAssetModal(true);
  };

  // Handle soft delete (temporary hiding without permanent removal)
  const handleSoftDelete = async (assetId: string, isSoftDeleted: boolean) => {
    try {
      if (!assetId) {
        toast.error("Error", {
          description: "Missing asset ID. Cannot perform operation."
        });
        return;
      }
      
      if (isSoftDeleted) {
        // For soft deletion, update the asset in local state first
        setAssets(prevAssets => prevAssets.map(asset => {
          const aId = asset.id || asset._id;
          if (aId === assetId) {
            return { ...asset, isDeleted: true };
          }
          return asset;
        }));
        
        // Then make the API call
        await apiService.deleteAsset(assetId);
      } else {
        // For restoration, make the API call first
        const response = await apiService.restoreAsset(assetId);
        
        if (response.success && response.data) {
          // Then update the asset in local state
          setAssets(prevAssets => prevAssets.map(asset => {
            const aId = asset.id || asset._id;
            if (aId === assetId) {
              return { ...asset, isDeleted: false };
            }
            return asset;
          }));
          
          toast.success("Asset Restored", {
            description: "Asset has been restored successfully.",
          });
        } else {
          let errorMessage = response.message || 'An error occurred';
          
          // Make error message more user-friendly
          if (errorMessage.includes('another asset with the same name')) {
            errorMessage = "Cannot restore this asset because another asset with the same name and type already exists.";
          }
          
          toast.error("Failed to Restore Asset", {
            description: errorMessage,
          });
        }
      }
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err && typeof err === 'object') {
        // Try to extract error message from different possible formats
        const errorObj = err as ApiErrorResponse;
        errorMessage = errorObj.message || (errorObj.data && errorObj.data.message) || errorMessage;
      }
      
      // Make error message more user-friendly
      if (errorMessage.includes('another asset with the same name')) {
        errorMessage = "Cannot restore this asset because another asset with the same name and type already exists.";
      }
      
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="py-6 lg:py-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <DashboardHeader
              title="Asset Manager"
              description="Track and manage your money across different accounts"
              icon={<Building className="h-8 w-8 text-primary opacity-85" />}
            />
          </div>

          {/* Display loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your assets...</p>
            </div>
          )}

          {/* Display error state */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
              <h3 className="font-semibold">Error loading assets</h3>
              <p>{error}</p>
              <button 
                onClick={fetchAssets} 
                className="mt-2 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Content based on whether there are non-deleted assets */}
          {!loading && !error && (
            <>
              {assets.filter(asset => !asset.isDeleted).length === 0 ? (
                <AssetEmptyState onAddClick={handleAddClick} />
              ) : (
                <>
                  {/* Asset Overview (Summary Cards) - filter to show only non-deleted assets */}
                  <AssetOverview 
                    assets={assets.filter(asset => !asset.isDeleted)} 
                    onAddClick={handleAddClick} 
                  />

                  {/* Asset Categories - filter to show only non-deleted assets */}
                  <AssetCategories 
                    assets={assets.filter(asset => !asset.isDeleted)} 
                    onAssetClick={handleAssetClick}
                    onTransferClick={handleTransferClick}
                    onAddClick={handleAddClick}
                  />

                  {/* Action Buttons */}
                  <AssetActionButtons 
                    onAddClick={handleAddClick} 
                    onTransferClick={() => handleTransferClick()} 
                  />

                  {/* Tips Section */}
                  <AssetTips />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop: Transfer Modal - filter to show only non-deleted assets */}
      {!isMobile && (
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedAsset(undefined);
          }}
          assets={assets.filter(asset => !asset.isDeleted)}
          sourceAsset={selectedAsset || assets.filter(asset => !asset.isDeleted)[0]}
          onTransfer={handleTransfer}
          onAddAsset={handleAddClick}
        />
      )}

      {/* Mobile: Transfer Drawer - filter to show only non-deleted assets */}
      {isMobile && (
        <AssetTransferDrawer
          open={showTransferDrawer}
          onOpenChange={setShowTransferDrawer}
          assets={assets.filter(asset => !asset.isDeleted)}
          sourceAsset={selectedAsset}
          onTransfer={handleTransfer}
          onAddAsset={handleAddClick}
        />
      )}

      {/* Asset Details Component (handles both drawer for mobile and sheet for desktop) */}
      {selectedAsset && (
        <AssetDetails
          asset={selectedAsset}
          isOpen={showAssetDetailsDrawer}
          onOpenChange={setShowAssetDetailsDrawer}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          onTransfer={(asset) => {
            setShowAssetDetailsDrawer(false);
            handleTransferClick(asset);
          }}
        />
      )}

      {/* Add Asset UI (drawer for mobile, dialog for desktop) */}
      {isMobile ? (
        <AddAssetDrawer
          open={showAddAssetModal}
          onOpenChange={(open: boolean) => {
            setShowAddAssetModal(open);
            if (!open) setInitialAssetType(undefined);
          }}
          onAddAsset={handleAddAsset}
          initialAssetType={initialAssetType}
        />
      ) : (
        <AddAssetDialog
          isOpen={showAddAssetModal}
          onOpenChange={(open: boolean) => {
            setShowAddAssetModal(open);
            if (!open) setInitialAssetType(undefined);
          }}
          onAddAsset={handleAddAsset}
          initialAssetType={initialAssetType}
        />
      )}

      {/* Edit Asset UI (drawer for mobile, modal for desktop) */}
      {isMobile ? (
        selectedAsset && (
          <EditAssetDrawer
            asset={selectedAsset}
            isOpen={showEditAssetDrawer}
            onOpenChange={(open) => setShowEditAssetDrawer(open)}
            onUpdateAsset={handleUpdateAsset}
          />
        )
      ) : (
        <EditAssetModal
          asset={selectedAsset as Asset} 
          isOpen={showEditModal && selectedAsset !== undefined}
          onOpenChange={(open: boolean) => {
            setShowEditModal(open);
            if (!open) setSelectedAsset(undefined);
          }}
          onUpdateAsset={handleUpdateAsset}
        />
      )}

      {/* Delete Asset Confirmation */}
      {selectedAsset && (
        <DeleteAssetDialog
          asset={selectedAsset}
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleConfirmDelete}
          onSoftDelete={handleSoftDelete}
        />
      )}
    </div>
  );
} 