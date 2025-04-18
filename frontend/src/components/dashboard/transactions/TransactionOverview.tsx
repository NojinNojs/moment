import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard/overview/cards/StatCard";
import { TrendInfo } from "@/components/dashboard/overview/cards/StatCard";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

export interface TransactionOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeTrend?: TrendInfo;
  expensesTrend?: TrendInfo;
  netTrend?: TrendInfo;
  showAssetBalance?: boolean;
  isPreviewMode?: boolean;
}

/**
 * TransactionOverview - Component to display financial summary for transactions
 */
export function TransactionOverview({
  totalIncome,
  totalExpenses,
  netAmount,
  incomeTrend,
  expensesTrend,
  netTrend,
  showAssetBalance = true,
  isPreviewMode = false
}: TransactionOverviewProps) {
  const { formatCurrency } = useCurrencyFormat();
  
  // CRITICAL FIX: Ensure netAmount is never negative for display
  const safeNetAmount = netAmount < 0 ? 0 : netAmount;
  
  return (
    <Card className="mb-6 TransactionOverview">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatCard
              title="Income"
              value={totalIncome}
              formatter={formatCurrency}
              icon={ArrowUpRight}
              color="blue"
              period="Current month"
              trend={incomeTrend}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatCard
              title="Expenses"
              value={totalExpenses}
              formatter={formatCurrency}
              icon={ArrowDownRight}
              color="red"
              period="Current month"
              trend={expensesTrend}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatCard
              title={showAssetBalance ? "Total Balance" : "Net Amount"}
              value={safeNetAmount}
              formatter={formatCurrency}
              icon={Wallet}
              color="green"
              period={showAssetBalance ? "Across all assets" : "Income - Expenses"}
              trend={netTrend}
              isPreview={isPreviewMode}
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
} 