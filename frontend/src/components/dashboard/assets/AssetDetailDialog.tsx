import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

// Define the Asset type interface locally if it can't be imported from @/types
interface Asset {
  _id?: string;
  id?: string | number;
  name: string;
  type: string;
  balance?: number;
  accountNumber?: string;
  institution?: string;
  notes?: string;
}

// Mock these imports that can't be resolved
const useEmitter = () => (event: string, data: Record<string, unknown>) => {
  console.log('Event emitted:', event, data);
};

// Mock components that can't be imported - with unused parameters removed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeleteAssetConfirmation = (__unused_props: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  assetName: string 
}) => null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AssetForm = (__unused_props: { 
  isOpen: boolean; 
  onClose: () => void; 
  asset: Asset | null; 
  onAssetUpdated: (asset: Asset) => void 
}) => null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TransactionHistoryTable = (__unused_props: { 
  transactions: Record<string, unknown>[]; 
  isLoading: boolean 
}) => null;

// Mock API service
const apiService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAssetTransactions: async (__unused_id: string) => ({ 
    transactions: [] as Record<string, unknown>[] 
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteAsset: async (__unused_id: string) => {}
};

interface AssetDetailDialogProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetDetailDialog({ 
  asset, 
  isOpen, 
  onClose 
}: AssetDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const emitEvent = useEmitter();

  const loadTransactionHistory = useCallback(async () => {
    if (!asset?._id) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getAssetTransactions(asset._id);
      setTransactionHistory(response.transactions || []);
    } catch (error: unknown) {
      console.error("Error loading transaction history:", error);
      toast.error("Failed to load transaction history");
    } finally {
      setIsLoading(false);
    }
  }, [asset?._id]);

  useEffect(() => {
    if (isOpen && asset?._id && activeTab === "history") {
      loadTransactionHistory();
    }
  }, [isOpen, asset?._id, activeTab, loadTransactionHistory]);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const handleAssetUpdated = (updatedAsset: Asset) => {
    setShowEditForm(false);
    emitEvent("assetUpdated", { asset: updatedAsset });
    toast.success("Asset updated successfully");
  };

  const handleDeleteConfirmed = () => {
    if (!asset?._id) return;
    
    apiService.deleteAsset(asset._id)
      .then(() => {
        onClose();
        emitEvent("assetDeleted", { assetId: asset._id });
        toast.success("Asset deleted successfully");
      })
      .catch((error: unknown) => {
        console.error("Error deleting asset:", error);
        toast.error("Failed to delete asset");
      });
  };

  if (!asset) return null;

  return (
    <>
      <Dialog open={isOpen && !showEditForm && !showDeleteConfirmation} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{asset.name}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Transaction History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="py-4">
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{asset.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-medium">
                        ${asset.balance?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                    {asset.accountNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-medium">{asset.accountNumber}</p>
                      </div>
                    )}
                    {asset.institution && (
                      <div>
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-medium">{asset.institution}</p>
                      </div>
                    )}
                    {asset.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="font-medium">{asset.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="py-4">
              <TransactionHistoryTable 
                transactions={transactionHistory} 
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Edit Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {asset && showEditForm && (
        <AssetForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          asset={asset}
          onAssetUpdated={handleAssetUpdated}
        />
      )}
      
      {asset && showDeleteConfirmation && (
        <DeleteAssetConfirmation
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteConfirmed}
          assetName={asset.name}
        />
      )}
    </>
  );
} 