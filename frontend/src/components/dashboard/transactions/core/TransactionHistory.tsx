import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Check,
  ArrowDownUp,
  PiggyBank,
  CreditCard,
  Hash,
  ChevronRight,
  ChevronLeft,
  X,
  FileX,
  FilterX,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Transaction, TransactionItem } from "../list/TransactionItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define CategoryObject interface
interface CategoryObject {
  _id?: string;
  id?: string | number;
  name: string;
  type?: string;
  color?: string;
}

// Animation variants
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Transaction type options
const typeOptions = [
  { label: "All types", value: "all", icon: <Filter className="h-4 w-4" /> },
  { label: "Income only", value: "income", icon: <PiggyBank className="h-4 w-4" /> },
  { label: "Expenses only", value: "expense", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Transfers only", value: "transfer", icon: <ArrowDownUp className="h-4 w-4" /> },
];

// Sort options
const sortOptions = [
  { label: "Newest first", value: "date-desc" },
  { label: "Oldest first", value: "date-asc" },
  { label: "Highest amount", value: "amount-desc" },
  { label: "Lowest amount", value: "amount-asc" },
  { label: "A to Z", value: "title-asc" },
  { label: "Z to A", value: "title-desc" },
];

interface TransactionHistoryProps {
  transactions: Transaction[];
  onEditTransaction: (id: number) => void;
  onDeleteTransaction: (id: number) => void;
  title?: string;
  showFilters?: boolean;
  className?: string;
  onAddTransaction?: (type: 'income' | 'expense') => void;
  highlightedTransactionId?: string | null;
}

// Add type guard function to check category type
const getCategoryString = (category: string | CategoryObject | undefined): string => {
  if (typeof category === 'object' && category !== null) {
    return category.name || '';
  }
  return category || '';
};

// Add a function to get a string key from category option
const getCategoryKey = (category: string | CategoryObject): string => {
  if (typeof category === 'object' && category !== null) {
    return category.id?.toString() || category._id?.toString() || category.name || 'category';
  }
  return category;
};

// Add a display function for category
const getCategoryDisplay = (category: string | CategoryObject): string => {
  if (typeof category === 'object' && category !== null) {
    return category.name || 'Uncategorized';
  }
  return category;
};

export function TransactionHistory({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  title = "Transaction History",
  showFilters = true,
  className,
  onAddTransaction,
  highlightedTransactionId = null
}: TransactionHistoryProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollLeftIndicator, setShowScrollLeftIndicator] = useState(false);
  const [showScrollRightIndicator, setShowScrollRightIndicator] = useState(true);
  
  // We need to use uncontrolled components to fix the bugs
  // This will just track what was opened last for our own reference
  const [lastOpenedMenu, setLastOpenedMenu] = useState<string | null>(null);

  // Force updates for proper rendering
  const [forceUpdate, setForceUpdate] = useState(0);
  const forceRender = useCallback(() => {
    setForceUpdate(v => v + 1);
  }, []);

  // Handler for all dropdown menu interactions
  const handleMenuAction = useCallback((menu: string, action: 'open' | 'close' | 'select') => {
    if (action === 'open') {
      setLastOpenedMenu(menu);
    }
    else if (action === 'close' || action === 'select') {
      setLastOpenedMenu(null);
      // Force a re-render to make sure everything is updated
      setTimeout(() => {
        forceRender();
      }, 50);
    }
  }, [forceRender]);

  // Handler for changing filter type
  const handleFilterTypeChange = useCallback((value: string) => {
    setTypeFilter(value);
    handleMenuAction('type', 'select');
  }, [handleMenuAction]);

  // Handler for changing sort
  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value);
    handleMenuAction('sort', 'select');
  }, [handleMenuAction]);

  // Handler for changing category filters
  const handleFilterCategoryChange = useCallback((category: string) => {
    setCategoryFilters((prev) => {
      const newFilters = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      return newFilters;
    });
  }, []);

  // Update active filters summary
  useEffect(() => {
    const filters = [];
    if (searchQuery) filters.push("Search");
    if (typeFilter !== "all") filters.push("Type");
    if (categoryFilters.length > 0) filters.push("Categories");
    if (sortBy !== "date-desc") filters.push("Sort");
    setActiveFilters(filters);
  }, [searchQuery, typeFilter, categoryFilters, sortBy]);

  // Update scroll indicators
  useEffect(() => {
    const handleScroll = () => {
      if (!filterScrollRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
      setShowScrollLeftIndicator(scrollLeft > 10);
      setShowScrollRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scrollEl = filterScrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Click outside handler to force close any open menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lastOpenedMenu && 
          !(e.target as HTMLElement).closest('[data-state="open"]') && 
          !(e.target as HTMLElement).closest('[role="dialog"]') &&
          !(e.target as HTMLElement).closest('[role="menu"]')) {
        setLastOpenedMenu(null);
        forceRender();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [lastOpenedMenu, forceRender]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, typeFilter, categoryFilters]);

  // Filter the transactions based on the search query and filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Filter out deleted transactions
    filtered = filtered.filter(transaction => !transaction.isDeleted);
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(query) || 
        (typeof t.category === 'string' && t.category?.toLowerCase().includes(query)) ||
        (typeof t.category === 'object' && t.category?.name?.toLowerCase().includes(query)) ||
        t.description?.toLowerCase().includes(query) ||
        (t.fromAsset && t.fromAsset.toString().toLowerCase().includes(query)) ||
        (t.toAsset && t.toAsset.toString().toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'transfer') {
        // Filter for asset transfers
        filtered = filtered.filter(t => t.transferType === 'transfer');
      } else {
        // Filter for income/expense
        filtered = filtered.filter(t => t.type === typeFilter && t.transferType !== 'transfer');
      }
    }
    
    // Apply category filter if enabled
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(t => {
        const categoryStr = getCategoryString(t.category);
        return categoryFilters.includes(categoryStr);
      });
    }
    
    // Apply sort
    const [sortField, sortDirection] = sortBy.split('-');
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'title') {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        return sortDirection === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      }
      return 0;
    });
    
    return filtered;
  }, [transactions, searchQuery, typeFilter, categoryFilters, sortBy]);

  // Scroll filter bar
  const scrollFilterBar = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      filterScrollRef.current.scrollLeft += scrollAmount;
    }
  };

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const categorySet = new Set(transactions.map((t) => t.category));
    return Array.from(categorySet);
  }, [transactions]);

  // Handler function for search query change
  const handleSearchQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    []
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("date-desc");
    setTypeFilter("all");
    setCategoryFilters([]);
    setCurrentPage(1);
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const formattedDate = format(date, "EEEE, MMMM d, yyyy");

      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }

      groups[formattedDate].push(transaction);
    });

    return groups;
  }, [filteredTransactions]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Calculate pagination for the grouped transaction view
  const paginatedGroupedTransactions = useMemo(() => {
    const result: { [key: string]: Transaction[] } = {};
    let counter = 0;

    for (const [date, transactions] of Object.entries(groupedTransactions)) {
      for (const transaction of transactions) {
        if (
          counter >= (currentPage - 1) * itemsPerPage &&
          counter < currentPage * itemsPerPage
        ) {
          if (!result[date]) {
            result[date] = [];
          }
          result[date].push(transaction);
        }
        counter++;
      }
    }

    return result;
  }, [groupedTransactions, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Effect to scroll to highlighted transaction when component mounts
  useEffect(() => {
    if (highlightedTransactionId) {
      setTimeout(() => {
        const element = document.getElementById(`transaction-${highlightedTransactionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [highlightedTransactionId, filteredTransactions]);

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            {filteredTransactions.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
              </Badge>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {/* Desktop view - Consolidated search and filters in one row */}
              <div className="hidden lg:flex items-center gap-2 w-full">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    className="pl-9 h-10"
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                  />
                </div>
                
                {/* Type filter dropdown */}
                <DropdownMenu key={`type-desktop-${forceUpdate}`}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center whitespace-nowrap h-10"
                      onClick={() => handleMenuAction('type', 'open')}
                    >
                      {typeOptions.find(t => t.value === typeFilter)?.icon}
                      <span className="ml-1">{typeOptions.find(t => t.value === typeFilter)?.label}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[200px] z-50"
                    align="start"
                    onEscapeKeyDown={() => handleMenuAction('type', 'close')}
                    onInteractOutside={() => handleMenuAction('type', 'close')}
                    onCloseAutoFocus={() => handleMenuAction('type', 'close')}
                  >
                    <div className="p-4 pb-2">
                      <h4 className="font-medium text-sm">Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Select a type to filter
                      </p>
                    </div>
                    <DropdownMenuRadioGroup 
                      value={typeFilter} 
                      onValueChange={handleFilterTypeChange}
                    >
                      {typeOptions.map(option => (
                        <DropdownMenuRadioItem 
                          key={option.value} 
                          value={option.value}
                          className="flex items-center"
                        >
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Category filter (multi-select) */}
                <Popover key={`category-desktop-${forceUpdate}`}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center whitespace-nowrap h-10"
                      onClick={() => handleMenuAction('category', 'open')}
                    >
                      <Hash className="mr-1 h-4 w-4" />
                      Categories
                      {categoryFilters.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 bg-primary/20 text-primary h-5 min-w-5 px-1"
                        >
                          {categoryFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[250px] p-0 z-50" 
                    align="end"
                    onEscapeKeyDown={() => handleMenuAction('category', 'close')}
                    onInteractOutside={() => handleMenuAction('category', 'close')}
                    onCloseAutoFocus={() => handleMenuAction('category', 'close')}
                  >
                    <div className="p-4 pb-2">
                      <h4 className="font-medium text-sm">Categories</h4>
                      <p className="text-sm text-muted-foreground">
                        Select multiple categories to filter
                      </p>
                    </div>
                    <ScrollArea className="h-[200px] px-4">
                      <div className="space-y-2 py-2">
                        {categories.map((option) => (
                          <div
                            key={getCategoryKey(option)}
                            className="flex items-center"
                          >
                            <Button
                              variant={
                                categoryFilters.includes(typeof option === 'object' ? option.name || '' : option)
                                  ? "secondary"
                                  : "ghost"
                              }
                              size="sm"
                              className="justify-start w-full text-left font-normal"
                              onClick={() => handleFilterCategoryChange(typeof option === 'object' ? option.name || '' : option)}
                            >
                              {categoryFilters.includes(typeof option === 'object' ? option.name || '' : option) ? (
                                <Check className="mr-2 h-4 w-4" />
                              ) : (
                                <div className="w-4 h-4 mr-2 border rounded" />
                              )}
                              {getCategoryDisplay(option)}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="p-4 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setCategoryFilters([]);
                          handleMenuAction('category', 'select');
                        }}
                      >
                        Clear Categories
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Sort button */}
                <DropdownMenu key={`sort-desktop-${forceUpdate}`}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center whitespace-nowrap"
                      onClick={() => handleMenuAction('sort', 'open')}
                    >
                      <ArrowDownUp className="mr-1 h-4 w-4" />
                      Sort
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-[200px] z-50"
                    onEscapeKeyDown={() => handleMenuAction('sort', 'close')}
                    onInteractOutside={() => handleMenuAction('sort', 'close')}
                    onCloseAutoFocus={() => handleMenuAction('sort', 'close')}
                  >
                    <DropdownMenuRadioGroup
                      value={sortBy}
                      onValueChange={handleSortByChange}
                    >
                      {sortOptions.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Items per page */}
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="h-10 w-[130px] whitespace-nowrap">
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Clear filters button */}
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground whitespace-nowrap h-10"
                    onClick={clearFilters}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>
              
              {/* Mobile view - keep existing design */}
              <div className="lg:hidden">
                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    className="pl-9 h-10"
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                  />
                </div>

                {/* Horizontal scrollable filter buttons with indicators */}
                <div className="relative w-full mt-3">
                  {/* Left scroll indicator */}
                  {showScrollLeftIndicator && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-background/80 backdrop-blur shadow-sm rounded-full"
                        onClick={() => scrollFilterBar('left')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Right scroll indicator */}
                  {showScrollRightIndicator && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-background/80 backdrop-blur shadow-sm rounded-full"
                        onClick={() => scrollFilterBar('right')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div 
                    className="flex items-center overflow-x-auto scrollbar-hide py-1 px-2" 
                    ref={filterScrollRef}
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {/* Type filter dropdown - Added for Mobile */}
                    <DropdownMenu key={`type-mobile-${forceUpdate}`}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center whitespace-nowrap mr-2"
                          onClick={() => handleMenuAction('type-mobile', 'open')}
                        >
                          {typeOptions.find(t => t.value === typeFilter)?.icon}
                          <span className="ml-1">
                            {typeFilter === 'all' ? 'Type' : typeOptions.find(t => t.value === typeFilter)?.label}
                          </span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-[200px] z-50"
                        align="start"
                        onEscapeKeyDown={() => handleMenuAction('type-mobile', 'close')}
                        onInteractOutside={() => handleMenuAction('type-mobile', 'close')}
                        onCloseAutoFocus={() => handleMenuAction('type-mobile', 'close')}
                      >
                        <div className="p-4 pb-2">
                          <h4 className="font-medium text-sm">Type</h4>
                          <p className="text-sm text-muted-foreground">
                            Select a type to filter
                          </p>
                        </div>
                        <DropdownMenuRadioGroup 
                          value={typeFilter} 
                          onValueChange={handleFilterTypeChange}
                        >
                          {typeOptions.map(option => (
                            <DropdownMenuRadioItem 
                              key={option.value} 
                              value={option.value}
                              className="flex items-center"
                            >
                              <span className="mr-2">{option.icon}</span>
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Sort button */}
                    <DropdownMenu key={`sort-mobile-${forceUpdate}`}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center whitespace-nowrap"
                          onClick={() => handleMenuAction('sort-mobile', 'open')}
                        >
                          <ArrowDownUp className="mr-1 h-4 w-4" />
                          Sort
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-[200px] z-50"
                        onEscapeKeyDown={() => handleMenuAction('sort-mobile', 'close')}
                        onInteractOutside={() => handleMenuAction('sort-mobile', 'close')}
                        onCloseAutoFocus={() => handleMenuAction('sort-mobile', 'close')}
                      >
                        <DropdownMenuRadioGroup
                          value={sortBy}
                          onValueChange={handleSortByChange}
                        >
                          {sortOptions.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Category filter (multi-select) */}
                    <Popover key={`category-mobile-${forceUpdate}`}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2 flex items-center whitespace-nowrap"
                          onClick={() => handleMenuAction('category-mobile', 'open')}
                        >
                          <Hash className="mr-1 h-4 w-4" />
                          Categories
                          {categoryFilters.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 bg-primary/20 text-primary h-5 min-w-5 px-1"
                            >
                              {categoryFilters.length}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[250px] p-0 z-50" 
                        align="end"
                        onEscapeKeyDown={() => handleMenuAction('category-mobile', 'close')}
                        onInteractOutside={() => handleMenuAction('category-mobile', 'close')}
                        onCloseAutoFocus={() => handleMenuAction('category-mobile', 'close')}
                      >
                        <div className="p-4 pb-2">
                          <h4 className="font-medium text-sm">Categories</h4>
                          <p className="text-sm text-muted-foreground">
                            Select multiple categories to filter
                          </p>
                        </div>
                        <ScrollArea className="h-[200px] px-4">
                          <div className="space-y-2 py-2">
                            {categories.map((option) => (
                              <div
                                key={getCategoryKey(option)}
                                className="flex items-center"
                              >
                                <Button
                                  variant={
                                    categoryFilters.includes(typeof option === 'object' ? option.name || '' : option)
                                      ? "secondary"
                                      : "ghost"
                                  }
                                  size="sm"
                                  className="justify-start w-full text-left font-normal"
                                  onClick={() => handleFilterCategoryChange(typeof option === 'object' ? option.name || '' : option)}
                                >
                                  {categoryFilters.includes(typeof option === 'object' ? option.name || '' : option) ? (
                                    <Check className="mr-2 h-4 w-4" />
                                  ) : (
                                    <div className="w-4 h-4 mr-2 border rounded" />
                                  )}
                                  {getCategoryDisplay(option)}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <Separator />
                        <div className="p-4 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setCategoryFilters([]);
                              handleMenuAction('category-mobile', 'select');
                            }}
                          >
                            Clear Categories
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Items per page */}
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="h-9 w-[130px] ml-2 whitespace-nowrap">
                        <SelectValue placeholder="Items per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Clear filters button */}
                    {activeFilters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-muted-foreground whitespace-nowrap"
                        onClick={clearFilters}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected categories display */}
        {categoryFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-muted-foreground">Selected categories:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {categoryFilters.map((category) => (
                <Badge 
                  key={category} 
                  variant="secondary" 
                  className="bg-primary/10 flex items-center gap-1"
                >
                  {category}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 hover:bg-primary/20" 
                    onClick={() => handleFilterCategoryChange(category)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setCategoryFilters([])}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Summary (only show if there are active filters) */}
        {activeFilters.length > 0 && categoryFilters.length === 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <span>Active filters:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="outline" className="bg-muted/50">
                  {filter}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted/50 p-6 mb-4">
              <FileX className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              {activeFilters.length > 0 
                ? "Try adjusting your filters to see more results."
                : "Add your first transaction by clicking 'Add Income' or 'Add Expense' above."}
            </p>
            {activeFilters.length > 0 ? (
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={clearFilters}
              >
                <FilterX className="h-4 w-4" />
                Clear All Filters
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="gap-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                  onClick={() => onAddTransaction?.('income')}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Income
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                  onClick={() => onAddTransaction?.('expense')}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={staggerContainer}
          >
            <AnimatePresence mode="sync">
              {/* Transactions Grouped by Date */}
              {Object.entries(paginatedGroupedTransactions).map(
                ([date, transactions]) => (
                  <motion.div
                    key={`date-group-${date}`}
                    variants={fadeIn}
                    className="mb-6 last:mb-0"
                  >
                    {/* Date Header */}
                    <div className="mb-2 sticky top-0 bg-background z-10 py-2 border-b">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {date}
                      </h3>
                    </div>

                    {/* Transactions for this date */}
                    <div className="space-y-2">
                      {transactions.map((transaction) => {
                        // Check if this transaction should be highlighted
                        const isHighlighted = highlightedTransactionId && 
                          (transaction._id === highlightedTransactionId || 
                          transaction.id.toString() === highlightedTransactionId);
                        
                        // Create an ID for DOM reference and scrolling
                        const transactionElementId = `transaction-${transaction._id || transaction.id}`;
                        
                        return (
                          <motion.div
                            key={transaction.id}
                            variants={slideUp}
                            layout
                            className={cn(
                              isHighlighted ? "highlight-transaction" : "",
                              "relative bg-card hover:bg-muted/50 rounded-lg transition-colors"
                            )}
                            id={transactionElementId}
                          >
                            <TransactionItem
                              hideDate={true}
                              transaction={transaction}
                              onEditTransaction={onEditTransaction}
                              onDeleteTransaction={onDeleteTransaction}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length
                  )}{" "}
                  of {filteredTransactions.length}
                </div>
                <div className="flex items-center gap-1 justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="hidden md:flex items-center">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page =
                        currentPage <= 3
                          ? i + 1
                          : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;

                      if (page <= 0 || page > totalPages) return null;

                      return (
                        <Button
                          key={`page-${page}`}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-9 h-9 mx-0.5"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="md:hidden flex items-center">
                    <span className="text-sm mx-2">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default TransactionHistory;
