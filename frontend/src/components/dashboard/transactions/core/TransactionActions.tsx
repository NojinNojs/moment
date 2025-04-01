import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { QuickActionCard } from "@/components/dashboard/overview/cards/QuickActionCard";
import { cn } from "@/lib/utils";

// Animation variant
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

interface TransactionActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  className?: string;
}

export function TransactionActions({
  onAddIncome,
  onAddExpense,
  className
}: TransactionActionsProps) {
  return (
    <motion.div 
      className={cn(
        "mb-8",  
        className
      )}
      {...slideUp}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <QuickActionCard
          title="Add Income"
          icon={<ArrowUpRight className="h-5 w-5" />}
          color="green"
          onClick={onAddIncome}
          tooltipText="Record a new income transaction"
        />

        <QuickActionCard
          title="Add Expense"
          icon={<ArrowDownRight className="h-5 w-5" />}
          color="red"
          onClick={onAddExpense}
          tooltipText="Record a new expense transaction"
        />
      </div>
    </motion.div>
  );
}

export default TransactionActions; 