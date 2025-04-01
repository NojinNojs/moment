import { useEffect, useState } from "react";
import { Filter, X, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "./DateRangePicker";

interface TransactionFilterProps {
  onFilterChange: (filters: TransactionFilterState) => void;
  categories: string[];
  totalItems: number;
  className?: string;
}

export interface TransactionFilterState {
  search: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
  transactionType: "all" | "income" | "expense";
  selectedCategories: string[];
  startDate?: Date;
  endDate?: Date;
  itemsPerPage: number;
}

/**
 * TransactionFilter - Advanced filtering component for transaction lists
 * Includes searchbar, sorting options, type filtering, category filtering, date filtering, and items per page selection
 */
export function TransactionFilter({
  onFilterChange,
  categories,
  totalItems,
  className,
}: TransactionFilterProps) {
  // Filter state
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "",
    sortBy: "date",
    sortDirection: "desc",
    transactionType: "all",
    selectedCategories: [],
    startDate: undefined,
    endDate: undefined,
    itemsPerPage: 25,
  });

  // Active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.sortBy !== "date" || filters.sortDirection !== "desc") count++;
    if (filters.transactionType !== "all") count++;
    if (filters.selectedCategories.length > 0) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.itemsPerPage !== 25) count++;
    return count;
  };

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setFilters((prev) => {
      const newSelectedCategories = prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category];
      return { ...prev, selectedCategories: newSelectedCategories };
    });
  };

  // Handle sort click
  const handleSortClick = (field: string) => {
    setFilters((prev) => {
      if (prev.sortBy === field) {
        // Toggle direction
        return {
          ...prev,
          sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
        };
      } else {
        // New field
        return {
          ...prev,
          sortBy: field,
          sortDirection: "desc", // Default to descending for new field
        };
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      sortBy: "date",
      sortDirection: "desc",
      transactionType: "all",
      selectedCategories: [],
      startDate: undefined,
      endDate: undefined,
      itemsPerPage: 25,
    });
  };

  // Get badge text for sort
  const getSortBadgeText = () => {
    const direction = filters.sortDirection === "asc" ? "Oldest" : "Newest";
    
    switch (filters.sortBy) {
      case "date":
        return `${direction} First`;
      case "amount":
        return `${filters.sortDirection === "asc" ? "Smallest" : "Largest"} Amount`;
      case "title":
        return `Title: ${filters.sortDirection === "asc" ? "A-Z" : "Z-A"}`;
      case "category":
        return `Category: ${filters.sortDirection === "asc" ? "A-Z" : "Z-A"}`;
      default:
        return "Sort";
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-9 pr-4 h-10 w-full"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1.5">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => setFilters({ ...filters, transactionType: "all" })}
              >
                <span>All Transactions</span>
                {filters.transactionType === "all" && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => setFilters({ ...filters, transactionType: "income" })}
              >
                <span>Income Only</span>
                {filters.transactionType === "income" && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => setFilters({ ...filters, transactionType: "expense" })}
              >
                <span>Expenses Only</span>
                {filters.transactionType === "expense" && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => handleSortClick("date")}
              >
                <span>Date</span>
                {filters.sortBy === "date" && (
                  filters.sortDirection === "asc" 
                    ? <ArrowUpDown className="h-4 w-4" />
                    : <ArrowUpDown className="h-4 w-4 rotate-180" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => handleSortClick("amount")}
              >
                <span>Amount</span>
                {filters.sortBy === "amount" && (
                  filters.sortDirection === "asc" 
                    ? <ArrowUpDown className="h-4 w-4" />
                    : <ArrowUpDown className="h-4 w-4 rotate-180" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => handleSortClick("title")}
              >
                <span>Title</span>
                {filters.sortBy === "title" && (
                  filters.sortDirection === "asc" 
                    ? <ArrowUpDown className="h-4 w-4" />
                    : <ArrowUpDown className="h-4 w-4 rotate-180" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={() => handleSortClick("category")}
              >
                <span>Category</span>
                {filters.sortBy === "category" && (
                  filters.sortDirection === "asc" 
                    ? <ArrowUpDown className="h-4 w-4" />
                    : <ArrowUpDown className="h-4 w-4 rotate-180" />
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Items Per Page</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[10, 25, 50, 100].map((count) => (
                <DropdownMenuItem
                  key={count}
                  className="flex items-center justify-between"
                  onClick={() => setFilters({ ...filters, itemsPerPage: count })}
                >
                  <span>{count} items</span>
                  {filters.itemsPerPage === count && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center justify-center text-destructive focus:text-destructive"
                onClick={clearFilters}
              >
                Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1.5">
                <Filter className="h-4 w-4" />
                <span>Categories</span>
                {filters.selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filters.selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.length > 0 ? (
                categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={filters.selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
              )}
              {filters.selectedCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center justify-center text-destructive focus:text-destructive"
                    onClick={() => setFilters({ ...filters, selectedCategories: [] })}
                  >
                    Clear Categories
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Second row with DateRangePicker and active filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
          onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
          className="w-full sm:w-60"
        />

        {/* Active Filters */}
        <div className="flex-1 flex flex-wrap gap-2 items-center mt-2 sm:mt-0">
          {getActiveFilterCount() > 0 && (
            <>
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {filters.transactionType !== "all" && (
                <Badge variant="outline" className="gap-1">
                  {filters.transactionType === "income" ? "Income" : "Expenses"}
                  <button
                    onClick={() => setFilters({ ...filters, transactionType: "all" })}
                    className="ml-1 rounded-full hover:bg-secondary p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {(filters.sortBy !== "date" || filters.sortDirection !== "desc") && (
                <Badge variant="outline" className="gap-1">
                  {getSortBadgeText()}
                </Badge>
              )}
              
              {filters.selectedCategories.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  {filters.selectedCategories.length} Categories
                  <button
                    onClick={() => setFilters({ ...filters, selectedCategories: [] })}
                    className="ml-1 rounded-full hover:bg-secondary p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {(filters.startDate || filters.endDate) && (
                <Badge variant="outline" className="gap-1">
                  Date Range
                  <button
                    onClick={() => setFilters({ ...filters, startDate: undefined, endDate: undefined })}
                    className="ml-1 rounded-full hover:bg-secondary p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </>
          )}
          
          {/* Results count */}
          <div className="ml-auto text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? "transaction" : "transactions"} found
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionFilter; 