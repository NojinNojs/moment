import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Wallet,
  CreditCard,
  Smartphone,
  Plus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define Asset type locally if import fails
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

// Mock API service and component imports
// const apiService = {
//   getAssets: async () => ({ assets: [] as Asset[] })
// };

// Mock components with proper props to fix earlier unused props error
const AssetDetailDialog = ({
  asset,
  isOpen,
  onClose
}: {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  // Using destructured props
  if (!isOpen || !asset) return null;
  
  // Mock implementation that uses the props
  return (
    <div style={{ display: isOpen ? 'block' : 'none' }}>
      <div>
        <h2>{asset.name}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const AssetForm = ({
  isOpen,
  onClose,
  asset,
  onAssetUpdated
}: {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onAssetUpdated: (asset: Asset) => void;
}) => {
  // Using destructured props
  if (!isOpen) return null;
  
  // Mock implementation that uses the props
  const handleSave = () => {
    // Create mock asset with required fields if asset is null
    const updatedAsset: Asset = asset || {
      name: "New Asset",
      type: "cash"
    };
    
    onAssetUpdated(updatedAsset);
    onClose();
  };
  
  return (
    <div style={{ display: isOpen ? 'block' : 'none' }}>
      <div>
        <h2>{asset ? 'Edit Asset' : 'Add Asset'}</h2>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

interface AssetsListProps {
  assets: Asset[];
  loading: boolean;
}

export default function AssetsList({ assets, loading }: AssetsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAddAssetForm, setShowAddAssetForm] = useState(false);

  // Get asset icon based on type
  const getAssetIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "bank":
        return <Building2 className="h-5 w-5" />;
      case "cash":
        return <Wallet className="h-5 w-5" />;
      case "credit card":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleAddAccount = () => {
    setShowAddAssetForm(true);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search accounts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAddAccount}
            size="sm"
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-muted-foreground">Loading accounts...</div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <div className="text-muted-foreground mb-2">
              {searchTerm ? "No accounts found matching your search" : "No accounts found"}
            </div>
            {!searchTerm && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddAccount}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add your first account
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {filteredAssets.map((asset) => (
                <Card 
                  key={asset._id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleAssetClick(asset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 bg-muted p-2 rounded-md">
                          {getAssetIcon(asset.type || "")}
                        </div>
                        <div>
                          <h3 className="font-medium">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {asset.type} {asset.institution ? `• ${asset.institution}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${asset.balance?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        {asset.accountNumber && (
                          <p className="text-xs text-muted-foreground">
                            {asset.accountNumber.replace(/\d(?=\d{4})/g, "*")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Asset Detail Dialog */}
      {selectedAsset && (
        <AssetDetailDialog
          asset={selectedAsset}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* Add Asset Form */}
      <AssetForm
        isOpen={showAddAssetForm}
        onClose={() => setShowAddAssetForm(false)}
        asset={null}
        onAssetUpdated={() => {}}
      />
    </>
  );
}