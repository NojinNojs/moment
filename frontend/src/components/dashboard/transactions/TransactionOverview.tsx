import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

// Import the StatCard component
import { StatCard } from "@/components/dashboard/overview";

interface TransactionOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeTrend?: {
    value: number;
    isPositive: boolean;
  };
  expensesTrend?: {
    value: number;
    isPositive: boolean;
  };
  netTrend?: {
    value: number;
    isPositive: boolean;
  };
  showAssetBalance?: boolean;
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
  showAssetBalance = true
}: TransactionOverviewProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatCard
              title="Income"
              value={`$${totalIncome.toLocaleString()}`}
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
              value={`$${totalExpenses.toLocaleString()}`}
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
              value={`$${netAmount.toLocaleString()}`}
              icon={Wallet}
              color="green"
              period={showAssetBalance ? "Across all assets" : "Income - Expenses"}
              trend={netTrend}
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
} 