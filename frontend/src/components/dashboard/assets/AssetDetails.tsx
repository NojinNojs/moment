import { Asset } from "@/types/assets";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AssetDetailsSheet } from "./AssetDetailsSheet";
import { AssetDetailsDrawer } from "./AssetDetailsDrawer";

interface AssetDetailsProps {
  asset: Asset | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  onTransfer?: (asset: Asset) => void;
}

export function AssetDetails({
  asset,
  isOpen,
  onOpenChange,
  onEdit = () => {},
  onDelete = () => {},
  onTransfer = () => {},
}: AssetDetailsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle deletion with auto close
  const handleDelete = (assetId: string) => {
    onOpenChange(false); // Close the sheet/drawer first
    onDelete(assetId); // Then trigger deletion
  };

  if (!isMounted || !asset) return null;

  // Use sheet for desktop and drawer for mobile
  if (isDesktop) {
    return (
      <AssetDetailsSheet
        asset={asset}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onEdit={(a) => {
          // First close the sheet, then open the edit modal
          onOpenChange(false);
          onEdit(a);
        }}
        onDelete={handleDelete}
        onTransfer={(asset) => {
          onTransfer(asset);
          onOpenChange(false);
        }}
      />
    );
  }

  // Use drawer for mobile
  return (
    <AssetDetailsDrawer
      asset={asset}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onEdit={onEdit}
      onDelete={handleDelete}
      onTransfer={onTransfer}
    />
  );
}
