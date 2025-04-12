import { useState, useEffect, useCallback } from "react";
import { Asset } from "@/types/assets";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftRight, 
  Edit, 
  X,
  Trash2,
  ChevronDown,
  PiggyBank,
  Wallet,
  BarChart4,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { getAssetIcon, getAssetIconBg, getAssetColor } from "@/lib/asset-utils";
import { TransactionItem, Transaction } from "@/components/dashboard/transactions/list/TransactionItem";
import apiService from "@/services/api";
import useCurrencyFormat from '@/hooks/useCurrencyFormat';

interface AssetDetailsSheetProps {
  asset: Asset;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (assetId: string) => void;
  onTransfer?: (asset: Asset) => void;
}

// Interface for asset transfers
interface AssetTransfer {
  _id: string;
  fromAsset: {
    _id: string;
    name: string;
    type: string;
  };
  toAsset: {
    _id: string;
    name: string;
    type: string;
  };
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
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

export function AssetDetailsSheet({ 
  asset, 
  isOpen, 
  onOpenChange,
  onEdit,
  onDelete,
  onTransfer
}: AssetDetailsSheetProps) {
  const [showFullTransactions, setShowFullTransactions] = useState<boolean>(false);
  const [assetTransfers, setAssetTransfers] = useState<AssetTransfer[]>([]);
  const [assetTransactions, setAssetTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { formatCurrency } = useCurrencyFormat();
  
  // Get icon component using utility function
  const AssetIcon = getAssetIcon(asset.type);
  
  // Get empty state variant based on asset type
  const emptyState = emptyStateVariants[asset.type as keyof typeof emptyStateVariants] || emptyStateVariants.bank;
  const EmptyStateIcon = emptyState.icon;
  
  // Animation variants for transaction list items
  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  // Format date for grouping headers
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Fetch asset transfers related to the current asset
  const fetchAssetTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const assetId = asset.id || asset._id;
      
      // Fetch all transfers from API
      const response = await apiService.getAssetTransfers();
      
      if (response.success && response.data) {
        // Filter transfers related to the current asset
        const transfers = response.data.filter(transfer => {
          // Check if this asset is either the source or destination
          const fromAssetId = typeof transfer.fromAsset === 'object' 
            ? transfer.fromAsset._id 
            : transfer.fromAsset;
            
          const toAssetId = typeof transfer.toAsset === 'object' 
            ? transfer.toAsset._id 
            : transfer.toAsset;
            
          return fromAssetId === assetId || toAssetId === assetId;
        });
        
        setAssetTransfers(transfers as AssetTransfer[]);
      } else {
        // Handle unsuccessful response
        console.warn("Failed to fetch asset transfers:", response.message);
        setAssetTransfers([]);
      }
    } catch (error) {
      console.error("Error fetching asset transfers:", error);
      // Set empty array on error to avoid undefined errors
      setAssetTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [asset, setLoading, setAssetTransfers]);

  // Add function to fetch transactions related to the asset
  const fetchAssetTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const assetId = asset.id || asset._id;
      
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
    } finally {
      setLoading(false);
    }
  }, [asset, setLoading, setAssetTransactions]);

  // Fetch transactions and transfers when the drawer opens
  useEffect(() => {
    if (isOpen && asset) {
      fetchAssetTransfers();
      fetchAssetTransactions();
    }
  }, [isOpen, asset, fetchAssetTransfers, fetchAssetTransactions]);

  // Convert asset transfers to Transaction format for TransactionItem component
  const convertToTransactions = (transfers: AssetTransfer[]): Transaction[] => {
    return transfers.map(transfer => {
      const assetId = asset.id || asset._id;
      
      // Determine if this is an incoming or outgoing transfer
      const isIncoming = typeof transfer.toAsset === 'object' 
        ? transfer.toAsset._id === assetId
        : transfer.toAsset === assetId;
        
      // Get the other party's name (source or destination)
      const otherParty = isIncoming
        ? (typeof transfer.fromAsset === 'object' ? transfer.fromAsset.name : 'Unknown Account')
        : (typeof transfer.toAsset === 'object' ? transfer.toAsset.name : 'Unknown Account');
      
      return {
        // Ensure id is string or number, not _id which is only string
        id: typeof transfer._id === 'string' ? parseInt(transfer._id, 10) : Math.floor(Math.random() * 10000),
        title: isIncoming 
          ? `Transfer from ${otherParty}` 
          : `Transfer to ${otherParty}`,
        amount: isIncoming ? transfer.amount : -transfer.amount, // Positive for incoming, negative for outgoing
        date: new Date(transfer.date).toISOString().split('T')[0],
        category: "Transfer",
        description: transfer.description || (isIncoming ? "Incoming transfer" : "Outgoing transfer"),
        account: asset.name,
        type: isIncoming ? 'income' : 'expense',
        status: 'completed',
        paymentMethod: 'Transfer',
        recipientOrSender: otherParty
      };
    });
  };

  // Toggle showing all transactions
  const toggleTransactions = () => {
    setShowFullTransactions(!showFullTransactions);
  };

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
  const getSortedDates = (dateGroups: Record<string, Transaction[]>) => {
    return Object.keys(dateGroups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  };

  // Convert transfers to transactions
  const transactions = convertToTransactions(assetTransfers);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 h-full flex flex-col overflow-hidden" side="right">
        <SheetHeader className="sticky top-0 z-10 bg-background pb-2 border-b px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={cn(
                "p-2 rounded-full", 
                getAssetIconBg(asset.type)
              )}>
                <AssetIcon className="h-4 w-4" />
              </div>
              <SheetTitle className="text-xl font-semibold ml-2">{asset.name}</SheetTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                className="rounded-full bg-primary/10 hover:bg-primary/90 transition-colors"
                onClick={handleEditClick}
              >
                <Edit className="h-4 w-4 text-primary hover:text-primary-foreground" />
              </Button>
              
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full bg-destructive/10 hover:bg-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
              
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </SheetClose>
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div>
              {asset.institution && (
                <SheetDescription className="text-sm">
                  {asset.institution}
                </SheetDescription>
              )}
              {asset.description && !asset.institution && (
                <SheetDescription className="text-sm">
                  {asset.description}
                </SheetDescription>
              )}
            </div>
            <span className="text-2xl font-bold">{formatCurrency(asset.balance)}</span>
          </div>
        </SheetHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-4 py-2">
            <ScrollArea className="h-full">
              <div className="px-4 py-6 space-y-6 pb-24">
                {/* Current Balance Card */}
                <Card className={cn(
                  "p-5 bg-gradient-to-br rounded-lg border shadow-sm",
                  `from-${getAssetColor(asset.type, 'bg').replace('bg-', '')}/20 to-muted`
                )}>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <h1 className="text-3xl font-bold mt-1">{formatCurrency(asset.balance)}</h1>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground mt-2">{asset.description}</p>
                  )}
                </Card>
                
                {/* Action Buttons */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="w-full flex items-center justify-center gap-2 h-12"
                    size="lg"
                    onClick={handleTransferClick}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Transfer Funds</span>
                  </Button>
                </motion.div>

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
                        <ChevronDown className={cn(
                          "ml-1 h-3 w-3 transition-transform", 
                          showFullTransactions ? "rotate-180" : ""
                        )} />
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
                                        linkable={true}
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
                        <motion.div 
                          className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4"
                          initial={{ scale: 0.8 }}
                          animate={{ 
                            scale: [0.8, 1.1, 1],
                            rotate: [0, -10, 10, 0]
                          }}
                          transition={{ 
                            duration: 0.7,
                            ease: "easeOut",
                            times: [0, 0.5, 0.8, 1]
                          }}
                        >
                          <EmptyStateIcon className="h-8 w-8 text-muted-foreground/50" />
                        </motion.div>
                        <motion.h4 
                          className="text-base font-medium mb-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {emptyState.title}
                        </motion.h4>
                        <motion.p 
                          className="text-sm text-muted-foreground max-w-md mx-auto mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {emptyState.message}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
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
                              className="mx-auto"
                            >
                              <ArrowLeftRight className="h-4 w-4 mr-2" />
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
                                        linkable={true}
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 