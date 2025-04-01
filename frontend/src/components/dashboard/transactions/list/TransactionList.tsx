import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionItem, { Transaction } from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  description?: string;
  limit?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  showActions?: boolean;
  onEditTransaction?: (id: number) => void;
  onDeleteTransaction?: (id: number) => void;
  onViewAllTransactions?: () => void;
  className?: string;
  compactMode?: boolean;
  groupByDate?: boolean;
}

type SortField = 'date' | 'amount' | 'title' | 'category';
type SortDirection = 'asc' | 'desc';

// Function to format date for grouping
const formatDateForGrouping = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format as "25 March, 2025" as requested in the example
  return date.getDate() + " " + 
    date.toLocaleString('en-US', { month: 'long' }) + ", " + 
    date.getFullYear();
};

// Interface for grouped transactions
interface GroupedTransactions {
  [date: string]: Transaction[];
}

// Define CategoryObject interface
interface CategoryObject {
  _id?: string;
  id?: string | number;
  name: string;
  type?: string;
  color?: string;
}

// Add helper function to get category as string
const getCategoryString = (category: string | CategoryObject | undefined): string => {
  if (!category) return '';
  if (typeof category === 'object' && category !== null) {
    return category.name || '';
  }
  return category;
};

/**
 * Enhanced TransactionList - A component to display a list of financial transactions with filtering and sorting
 * Features:
 * - Header with title and description
 * - Search and filter functionality
 * - Sortable columns
 * - Advanced transaction items with hover effects and detail view
 * - Animation effects for list items
 * - Loading skeleton state
 * - Empty state message
 * - Actions for adding new transactions
 * - Date grouping for better mobile experience
 */
export const TransactionList = ({
  transactions,
  title = "Recent Transactions",
  description = "Your latest financial activity",
  limit,
  emptyMessage = "No transactions to display",
  isLoading = false,
  showActions = true,
  onEditTransaction,
  onDeleteTransaction,
  onViewAllTransactions,
  className,
  compactMode = true,
  groupByDate = false,
}: TransactionListProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevFilteredTransactionsRef = useRef<Transaction[]>([]);

  // Handle sort field change with direction toggling
  const handleSortChange = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if the same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending order
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  // Memoize filteredAndSortedTransactions to prevent recalculations on every render
  const filteredAndSortedTransactions = useMemo(() => {
    // Hanya filter transaksi yang benar-benar tidak memiliki ID sama sekali
    let result = transactions.filter(transaction => 
      transaction && transaction.id !== undefined
    );
    
    // Apply filter
    if (filterType !== 'all') {
      result = result.filter(transaction => {
        // First check if type is explicitly defined, then fall back to amount
        const isIncome = transaction.type === 'income' || 
                         (transaction.type === undefined && transaction.amount > 0);
        return (filterType === 'income' && isIncome) || (filterType === 'expense' && !isIncome);
      });
    }
    
    // Apply search
    if (searchTerm && searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(transaction => 
        transaction.title.toLowerCase().includes(lowerSearchTerm) ||
        getCategoryString(transaction.category).toLowerCase().includes(lowerSearchTerm) ||
        (transaction.description && transaction.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply sort
    result.sort((a, b) => {
      let aValue, bValue;
      
      // Get values based on sort field
      switch (sortField) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = getCategoryString(a.category).toLowerCase();
          bValue = getCategoryString(b.category).toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }
      
      // Sort logic
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }, [transactions, filterType, searchTerm, sortField, sortDirection, limit]);

  // Memoize the group transaction function to prevent recreation on every render
  const groupTransactions = useCallback((transactionsToGroup: Transaction[]) => {
    if (!groupByDate) return;
    
    const grouped: GroupedTransactions = {};
    
    transactionsToGroup.forEach(transaction => {
      const dateGroup = formatDateForGrouping(transaction.date);
      if (!grouped[dateGroup]) {
        grouped[dateGroup] = [];
      }
      grouped[dateGroup].push(transaction);
    });
    
    setGroupedTransactions(grouped);
  }, [groupByDate]);

  // Only update grouped transactions when necessary
  useEffect(() => {
    // Check if filteredAndSortedTransactions has actually changed before regrouping
    if (
      groupByDate && 
      JSON.stringify(prevFilteredTransactionsRef.current) !== JSON.stringify(filteredAndSortedTransactions)
    ) {
      groupTransactions(filteredAndSortedTransactions);
      prevFilteredTransactionsRef.current = filteredAndSortedTransactions;
    }
  }, [filteredAndSortedTransactions, groupByDate, groupTransactions]);
  
  // Format currency with appropriate locale - memoize this too
  const formatCurrency = useCallback((amount: number): string => {
    try {
      // Use period as thousand separator and comma as decimal separator (European/Indonesian style)
      const absAmount = Math.abs(amount);
      const currencyFormatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return (amount < 0 ? '-$' : '$') + currencyFormatter.format(absAmount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `${amount < 0 ? '-$' : '$'}${Math.abs(amount).toFixed(2)}`;
    }
  }, []);
  
  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  // Loading skeletons
  const renderSkeletons = () => {
    return Array(limit || 5).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex items-center space-x-4 py-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-3 w-[120px]" />
        </div>
        <Skeleton className="h-5 w-[80px]" />
      </div>
    ));
  };
  
  // Determine if the list has been filtered
  const isFiltered = searchTerm.trim() !== '' || filterType !== 'all';
  
  // Get array of sorted date keys for grouped transactions - memoize this calculation
  const sortedDateKeys = useMemo(() => 
    Object.keys(groupedTransactions).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    }), 
    [groupedTransactions, sortDirection]
  );
  
  // Memoized handler to toggle search input
  const handleSearchToggle = useCallback(() => {
    if (searchTerm) {
      setSearchTerm('');
    } else {
      setSearchTerm(' ');
      // Focus the search input when opened
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [searchTerm]);

  // Memoized handler to close search
  const handleSearchClose = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                {/* Search button - was missing */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn("h-8 w-8", searchTerm && "text-primary")}
                  onClick={handleSearchToggle}
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                {/* Close search button - only show when search is active */}
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSearchClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Filter dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-8 w-8", filterType !== 'all' && "text-primary")}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter Transactions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        className={filterType === 'all' ? "bg-muted" : ""}
                        onClick={() => setFilterType('all')}
                      >
                        All Transactions
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={filterType === 'income' ? "bg-muted" : ""}
                        onClick={() => setFilterType('income')}
                      >
                        Income Only
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={filterType === 'expense' ? "bg-muted" : ""}
                        onClick={() => setFilterType('expense')}
                      >
                        Expenses Only
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => handleSortChange('date')}>
                        Sort by Date {sortField === 'date' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange('amount')}>
                        Sort by Amount {sortField === 'amount' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Search bar - animated */}
          <AnimatePresence>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-3"
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Active filters display */}
          {isFiltered && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-muted-foreground">Filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: {searchTerm}
                  <button onClick={handleSearchClose} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterType !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Type: {filterType === 'income' ? 'Income' : 'Expenses'}
                  <button onClick={() => setFilterType('all')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(searchTerm || filterType !== 'all') && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}>
                  Clear All
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pb-3">
          {isLoading ? (
            <div className="space-y-4">
              {renderSkeletons()}
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">{emptyMessage}</p>
              {onViewAllTransactions && (
                <Button 
                  variant="outline" 
                  onClick={onViewAllTransactions}
                  className="mt-2"
                >
                  Go to Transactions
                </Button>
              )}
            </div>
          ) : compactMode ? (
            <AnimatePresence mode="sync">
              <div key="list-container" className="space-y-6">
                {sortedDateKeys.map((dateKey) => (
                  <div key={`date-group-${dateKey}`} className="space-y-3">
                    {/* Date header */}
                    <h3 className="text-base font-semibold text-foreground px-2 pt-1 border-b border-border/30 pb-1">
                      {dateKey}
                    </h3>
                    
                    {/* Transactions for this date */}
                    {groupedTransactions[dateKey].map((transaction) => (
                      <TransactionItem
                        key={`transaction-${transaction.id}`}
                        transaction={{
                          ...transaction,
                          formattedAmount: formatCurrency(transaction.amount)
                        }}
                        hideDate={true}
                        onEditTransaction={onEditTransaction}
                        onDeleteTransaction={onDeleteTransaction}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="sync">
              <div key="transactions-list" className="space-y-3">
                {filteredAndSortedTransactions.map((transaction) => (
                  <TransactionItem
                    key={`transaction-item-${transaction.id}`}
                    transaction={{
                      ...transaction,
                      formattedAmount: formatCurrency(transaction.amount)
                    }}
                    onEditTransaction={onEditTransaction}
                    onDeleteTransaction={onDeleteTransaction}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
        
        {/* CTA section */}
        {onViewAllTransactions && (
          <CardFooter className="pt-3 pb-4 border-t">
            <motion.div 
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2 text-base py-6"
                onClick={onViewAllTransactions}
              >
                View All Transactions
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default TransactionList; 