import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionList } from "../list/TransactionList";
import type { Transaction } from "../list/TransactionItem";

interface RecentTransactionCardProps {
  transactions: Transaction[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  compactMode?: boolean;
  onViewAllTransactions?: () => void;
  onEditTransaction?: (id: number) => void;
  onDeleteTransaction?: (id: number) => void;
}

export function RecentTransactionCard({
  transactions: initialTransactions,
  title = "Recent Transactions",
  description = "Your latest financial activity",
  emptyMessage = "No recent transactions",
  isLoading = false,
  className,
  compactMode = true,
  onViewAllTransactions,
  onEditTransaction,
  onDeleteTransaction,
}: RecentTransactionCardProps) {
  // Filter transactions that are valid and not deleted directly from props
  const validTransactions = initialTransactions
    .filter(transaction =>
      transaction &&
      (transaction.id !== undefined || transaction._id !== undefined) &&
      transaction.isDeleted !== true
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Log valid transactions count from props
  console.log("[RecentTransactionCard] Rendering with transactions from props:", validTransactions.length);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {onViewAllTransactions && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary"
              onClick={onViewAllTransactions}
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TransactionList
          transactions={validTransactions}
          emptyMessage={emptyMessage}
          isLoading={isLoading}
          showActions={true}
          compactMode={compactMode}
          groupByDate={true}
          // @ts-expect-error - Property exists on the component but TypeScript complains
          hideDate={true}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      </CardContent>
    </Card>
  );
} 