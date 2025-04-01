import { useState, useEffect, useCallback } from "react";
import { Asset, AssetTransfer } from "@/types/assets";
import {
  ArrowLeftRight,
  Edit,
  Trash2,
  X,
  ChevronDown,
  PiggyBank,
  Wallet,
  BarChart4,
  Leaf,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getAssetIcon, getAssetIconBg, getAssetColor } from "@/lib/asset-utils";
import { TransactionItem, Transaction } from "@/components/dashboard/transactions/list/TransactionItem";
import apiService from "@/services/api";

interface AssetDetailsDrawerProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  onTransfer?: (asset: Asset) => void;
}

// Empty state variants for different asset types
const emptyStateVariants = {
  cash: {
    icon: Wallet,
    title: "No Cash Transactions",
    message: "Your cash asset is ready to track spending and income.",
    action: "Record Transaction"
  },
  bank: {
    icon: PiggyBank,
    title: "Bank Account is Ready",
    message: "Transfer funds or record transactions to get started.",
    action: "Make Transfer"
  },
  "e-wallet": {
    icon: Leaf,
    title: "E-Wallet is Empty",
    message: "Add funds or make transfers to see your activity.",
    action: "Add Transaction"
  },
  emergency: {
    icon: BarChart4,
    title: "Emergency Fund Tracking",
    message: "Keep track of deposits and withdrawals for your safety net.",
    action: "Record Activity"
  }
};

export function AssetDetailsDrawer({ 
  asset,
  isOpen, 
  onOpenChange,
  onEdit,
  onDelete,
  onTransfer,
}: AssetDetailsDrawerProps) {
  const [showFullscreenView] = useState(false);
  const [showFullTransactions, setShowFullTransactions] = useState<boolean>(false);
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  const [assetTransactions, setAssetTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get icon component using utility function
  const AssetIcon = getAssetIcon(asset.type);
  
  // Get empty state variant based on asset type
  const emptyState = emptyStateVariants[asset.type as keyof typeof emptyStateVariants] || emptyStateVariants.bank;
  const EmptyStateIcon = emptyState.icon;

  // Format date for grouping headers
  const formatDateHeader = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(date);
      }
    } catch (error) {
      console.error("Error formatting date header:", error);
      return dateString;
    }
  };

  // Animation variants for transaction list items
  const listItemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  };

  // Fetch asset transfers
  const fetchAssetTransfers = useCallback(async () => {
    try {
      setError(null);
      setIsLoadingTransfers(true);
      
      // Make API call to fetch transfers
      const response = await apiService.getAssetTransfers();
      
      if (response.success && response.data) {
        // Get the asset ID, ensuring it's a string for comparison
        const assetId = String(asset.id || asset._id);
        
        // Filter transfers that involve the current asset
        // Handle both direct ID references and nested object structures
        const relevantTransfers = response.data.filter((transfer: AssetTransfer) => {
          // Extract fromAsset ID, handling both direct ID and object references
          const fromAssetId = typeof transfer.fromAsset === 'object' 
            ? String(transfer.fromAsset._id || transfer.fromAsset.id)
            : typeof transfer.fromAssetId === 'string'
              ? transfer.fromAssetId
              : String(transfer.fromAssetId || transfer.fromAsset);
              
          // Extract toAsset ID, handling both direct ID and object references
          const toAssetId = typeof transfer.toAsset === 'object'
            ? String(transfer.toAsset._id || transfer.toAsset.id)
            : typeof transfer.toAssetId === 'string'
              ? transfer.toAssetId
              : String(transfer.toAssetId || transfer.toAsset);
          
          // Check if this transfer involves the current asset
          return fromAssetId === assetId || toAssetId === assetId;
        });
        
        setAssetTransfers(relevantTransfers);
      } else {
        setError(response.message || "Failed to fetch transfers");
      }
    } catch (err) {
      console.error("Error fetching asset transfers:", err);
      setError("Error fetching transfers. Please try again later.");
    } finally {
      setIsLoadingTransfers(false);
    }
  }, [asset, setError, setIsLoadingTransfers, setAssetTransfers]);

  // Add function to fetch asset transactions
  const fetchAssetTransactions = useCallback(async () => {
    try {
      setError(null);
      // Use type assertion to access the properties
      const typedAsset = asset as Asset;
      const assetId = typedAsset ? String(typedAsset.id || typedAsset._id) : undefined;
      
      if (!assetId) {
        console.warn("Unable to determine asset ID");
        setAssetTransactions([]);
        return;
      }
      
      // Fetch all transactions from API
      const response = await apiService.getTransactions();
      
      if (response.success && response.data) {
        // Filter transactions related to the current asset
        const transactions = response.data.filter(transaction => {
          const transactionAccount = transaction.account;
          
          // Handle both string and object accounts
          if (typeof transactionAccount === 'object' && transactionAccount !== null) {
            // Use type assertion to fix TypeScript error
            const accountObj = transactionAccount as { _id?: string; id?: string | number };
            return (accountObj._id === assetId || accountObj.id === assetId);
          }
          
          // For string accounts, try to match by name since we might not have the id
          return transactionAccount === asset.name;
        }).map(t => ({
          id: typeof t.id === 'string' ? parseInt(t.id, 10) : (t.id || Math.floor(Math.random() * 10000)),
          title: t.title,
          amount: t.amount,
          date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString().split('T')[0],
          category: t.category,
          description: t.description || '',
          account: t.account || '',
          type: t.type,
          status: t.status || 'completed',
          isDeleted: t.isDeleted || false
        }));
        
        setAssetTransactions(transactions);
      } else {
        // Handle unsuccessful response
        console.warn("Failed to fetch asset transactions:", response.message);
        setAssetTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching asset transactions:", error);
      // Set empty array on error to avoid undefined errors
      setAssetTransactions([]);
    }
  }, [asset, setError, setAssetTransactions]);

  // Modify the useEffect to fetch both transfers and transactions
  useEffect(() => {
    if (isOpen && asset) {
      fetchAssetTransfers();
      fetchAssetTransactions();
    }
  }, [isOpen, asset, fetchAssetTransfers, fetchAssetTransactions]);

  // Add a function to handle deleting a transfer
  const handleDeleteTransfer = async (transferId: number) => {
    try {
      // Convert to string if needed for backend API
      const transferIdStr = String(transferId);
      
      // Here you would normally call your API to delete the transfer
      // For now, we'll just remove it from the local state
      setAssetTransfers(prev => prev.filter(transfer => transfer.id !== transferIdStr));
      
      // Remove toast notification to prevent duplicates
      // The parent component will display its own toast with dismiss button
    } catch (error) {
      console.error("Error deleting transfer:", error);
      // Let the parent component handle the error toast
    }
  };

  // Add a function to handle editing a transfer
  const handleEditTransfer = (transferId: number) => {
    // Convert to string if needed
    const transferIdStr = String(transferId);
    
    // Find the transfer to edit
    const transferToEdit = assetTransfers.find(transfer => transfer.id === transferIdStr);
    
    if (transferToEdit) {
      // Here you would normally open an edit dialog or navigate to an edit page
      console.log("Editing transfer:", transferIdStr);
      
      // Close the drawer and open the transfer modal or drawer with pre-populated data
      onOpenChange(false);
      if (onTransfer) {
        onTransfer(asset);
      }
    }
  };

  // Convert asset transfers to Transaction format for TransactionItem component
  const convertToTransactions = (transfers: AssetTransfer[]): Transaction[] => {
    return transfers.map(transfer => {
      const assetId = String(asset.id || asset._id);
      
      // Safely extract IDs and handle various API response formats
      let fromAssetId: string;
      let fromAssetName: string = 'Unknown';
      
      if (typeof transfer.fromAsset === 'object' && transfer.fromAsset) {
        fromAssetId = String(transfer.fromAsset._id || transfer.fromAsset.id || '');
        fromAssetName = transfer.fromAsset.name || `Asset ${fromAssetId.substring(0, 6)}`;
      } else if (typeof transfer.fromAsset === 'string') {
        fromAssetId = transfer.fromAsset;
        fromAssetName = `Asset ${fromAssetId.substring(0, 6)}`;
      } else {
        fromAssetId = String(transfer.fromAssetId || '');
        fromAssetName = `Asset ${fromAssetId.substring(0, 6)}`;
      }
      
      let toAssetId: string;
      let toAssetName: string = 'Unknown';
      
      if (typeof transfer.toAsset === 'object' && transfer.toAsset) {
        toAssetId = String(transfer.toAsset._id || transfer.toAsset.id || '');
        toAssetName = transfer.toAsset.name || `Asset ${toAssetId.substring(0, 6)}`;
      } else if (typeof transfer.toAsset === 'string') {
        toAssetId = transfer.toAsset;
        toAssetName = `Asset ${toAssetId.substring(0, 6)}`;
      } else {
        toAssetId = String(transfer.toAssetId || '');
        toAssetName = `Asset ${toAssetId.substring(0, 6)}`;
      }
      
      // Determine if this is an incoming or outgoing transfer
      const isIncoming = toAssetId === assetId;
      
      // Get the other party's name
      const otherPartyName = isIncoming ? fromAssetName : toAssetName;
      
      // Get transfer ID safely
      const transferId = String(transfer._id || transfer.id || '');
      
      // Safety check if ID parsing fails, generate a random ID
      const parsedId = parseInt(transferId);
      const safeId = !isNaN(parsedId) ? parsedId : Math.floor(Math.random() * 100000);
      
      return {
        id: safeId,
        title: isIncoming 
          ? `Transfer from ${otherPartyName}` 
          : `Transfer to ${otherPartyName}`,
        amount: isIncoming ? transfer.amount : -transfer.amount, // Positive for incoming, negative for outgoing
        date: typeof transfer.date === 'string'
          ? transfer.date
          : transfer.date instanceof Date 
            ? transfer.date.toISOString().split('T')[0]
            : new Date(transfer.date || transfer.createdAt || Date.now()).toISOString().split('T')[0],
        category: "Transfer",
        description: transfer.description || (isIncoming ? "Incoming transfer" : "Outgoing transfer"),
        account: asset.name,
        type: isIncoming ? 'income' : 'expense',
        status: 'completed',
        paymentMethod: 'Transfer',
        recipientOrSender: otherPartyName
      };
    });
  };

  // Toggle showing all transactions
  const toggleTransactions = () => {
    setShowFullTransactions(!showFullTransactions);
  };

  // Handle button actions
  const handleDeleteClick = () => {
    if (onDelete) {
      // Use the correct ID (either id or _id)
      const assetId = asset.id || asset._id;
      onDelete(assetId as string);
      onOpenChange(false);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(asset);
      onOpenChange(false);
    }
  };

  const handleTransferClick = () => {
    if (onTransfer) {
      onTransfer(asset);
      onOpenChange(false);
    }
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  };

  // Sort dates in descending order (newest first)
  const getSortedDates = (
    dateGroups: Record<string, Transaction[]>
  ) => {
    return Object.keys(dateGroups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  };

  // Convert transfers to transactions
  const transactions = convertToTransactions(assetTransfers);

  return (
    <Drawer 
      open={isOpen} 
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent
        className={cn(
          "h-[85vh] max-h-[85vh] transition-all duration-300 flex flex-col",
          showFullscreenView && "h-[100vh] max-h-[100vh] rounded-none"
        )}
      >
        <DrawerHeader className="border-b px-4 pb-4 pt-6 flex-shrink-0">
          <DrawerClose className="absolute right-4 top-6 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>

          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center", 
              getAssetIconBg(asset.type)
            )}>
              <AssetIcon className="h-5 w-5" />
            </div>
            <div className="grid gap-0.5">
              <DrawerTitle className="text-xl font-semibold">
                {asset.name}
              </DrawerTitle>
              <DrawerDescription>
                {asset.institution || asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6 pb-16">
            {/* Current Balance Card */}
            <Card className={cn(
              "p-5 bg-gradient-to-br rounded-lg border shadow-sm",
              `from-${getAssetColor(asset.type, 'bg').replace('bg-', '')}/20 to-muted`
            )}>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <h1 className="text-3xl font-bold mt-1">
                {formatCurrency(asset.balance)}
              </h1>
              {asset.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {asset.description}
                </p>
              )}
            </Card>

            {/* Recent Transactions Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Transfers</h3>
                {transactions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={toggleTransactions}
                  >
                    {showFullTransactions ? "Show Less" : "Show More"}
                    <ChevronDown
                      className={cn(
                        "ml-1 h-3 w-3 transition-transform",
                        showFullTransactions ? "rotate-180" : ""
                      )}
                    />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {transactions.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {(() => {
                      // Get the transactions to display
                      const transactionsToDisplay = showFullTransactions
                        ? transactions
                        : transactions.slice(0, 3);

                      // Group transactions by date
                      const groupedTransactions = groupTransactionsByDate(
                        transactionsToDisplay
                      );
                      const sortedDates = getSortedDates(groupedTransactions);

                      let transactionIndex = 0;

                      return sortedDates.map((date) => (
                        <div key={date} className="mb-4">
                          <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {formatDateHeader(date)}
                            </h4>
                          </div>

                          <div className="space-y-2 mt-2">
                            {groupedTransactions[date].map((transaction) => {
                              const currentIndex = transactionIndex++;
                              return (
                                <motion.div
                                  key={transaction.id}
                                  custom={currentIndex}
                                  variants={listItemVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="hidden"
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <TransactionItem
                                    transaction={transaction}
                                    className="w-full"
                                    onDeleteTransaction={handleDeleteTransfer}
                                    onEditTransaction={handleEditTransfer}
                                  />
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </AnimatePresence>
                ) : isLoadingTransfers ? (
                  <div className="text-center py-10">
                    <div className="animate-pulse">
                      <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-4"></div>
                      <div className="h-4 w-1/2 bg-muted rounded mx-auto mb-2"></div>
                      <div className="h-3 w-1/3 bg-muted rounded mx-auto"></div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <X className="h-8 w-8 text-destructive" />
                    </div>
                    <h4 className="text-base font-medium mb-1">Error Loading Transfers</h4>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={fetchAssetTransfers}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4"
                    >
                      <EmptyStateIcon className="h-8 w-8 text-muted-foreground/60" />
                    </motion.div>
                    
                    <h3 className="text-lg font-medium">{emptyState.title}</h3>
                    
                    <p className="text-muted-foreground mt-1 mb-6 max-w-xs mx-auto text-sm">
                      {emptyState.message}
                    </p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleTransferClick}
                          className="mx-auto h-8 text-xs"
                        >
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          {emptyState.action}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {!showFullTransactions && transactions.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTransactions}
                    className="w-full mt-2"
                  >
                    View all {transactions.length} transfers
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
              </div>
              
              <div className="space-y-2">
                {assetTransactions.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {(() => {
                      // Get the transactions to display (limit to 5)
                      const transactionsToDisplay = assetTransactions.slice(0, 5);
                      
                      // Group transactions by date
                      const groupedTransactions = groupTransactionsByDate(transactionsToDisplay);
                      const sortedDates = getSortedDates(groupedTransactions);
                      
                      let transactionIndex = 0;
                      
                      return sortedDates.map(date => (
                        <div key={date} className="mb-4">
                          <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {formatDateHeader(date)}
                            </h4>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            {groupedTransactions[date].map(transaction => {
                              const currentIndex = transactionIndex++;
                              return (
                                <motion.div
                                  key={transaction.id}
                                  custom={currentIndex}
                                  variants={listItemVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="hidden"
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <TransactionItem
                                    transaction={transaction}
                                    className="w-full"
                                  />
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg p-6 text-center"
                  >
                    <p className="text-sm text-muted-foreground">No transactions for this asset yet</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="flex-shrink-0 border-t pt-4 pb-4 gap-2">
          <div className="grid grid-cols-3 gap-2 w-full mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditClick}
              className="h-10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTransferClick}
              className="h-10"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transfer
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 
