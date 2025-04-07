import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Wallet, Coffee, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useCurrencyFormat } from '@/contexts/CurrencyContext';

interface CurrencyExampleCardProps {
  className?: string;
}

export function CurrencyExampleCard({ className }: CurrencyExampleCardProps) {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const { currencyCode, currencySymbol, currencyLocale } = useCurrencyFormat();

  const formatAmount = (amount: number): string => {
    try {
      return new Intl.NumberFormat(currencyLocale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
  };

  // Example transaction data
  const transactionExamples = {
    expense: {
      icon: <ShoppingCart className="h-10 w-10 p-2 rounded-full bg-red-900/20 text-red-400" />,
      title: 'Shopping Spree',
      category: 'Shopping',
      account: 'Main Card',
      amount: 1234567.89,
      color: 'from-red-500/10 to-red-900/5',
      iconBg: 'bg-red-900/20 text-red-400',
      amountColor: 'text-red-400'
    },
    income: {
      icon: <Wallet className="h-10 w-10 p-2 rounded-full bg-emerald-900/20 text-emerald-400" />,
      title: 'Salary Deposit',
      category: 'Income',
      account: 'Savings',
      amount: 9876543.21,
      color: 'from-emerald-500/10 to-emerald-900/5',
      iconBg: 'bg-emerald-900/20 text-emerald-400',
      amountColor: 'text-emerald-400'
    }
  };

  const currentExample = transactionExamples[transactionType];

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction Preview</h3>
        <div className="flex rounded-full bg-neutral-100 dark:bg-neutral-800 p-1">
          <Toggle
            pressed={transactionType === 'expense'}
            onPressedChange={() => setTransactionType('expense')}
            className={`relative px-3 text-xs font-medium transition-all rounded-full ${
              transactionType === 'expense' 
                ? 'bg-white dark:bg-neutral-700 text-red-500 shadow-sm' 
                : 'text-neutral-500'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 mr-1 inline" />
            Expense
          </Toggle>
          <Toggle
            pressed={transactionType === 'income'}
            onPressedChange={() => setTransactionType('income')}
            className={`relative px-3 text-xs font-medium transition-all rounded-full ${
              transactionType === 'income' 
                ? 'bg-white dark:bg-neutral-700 text-emerald-500 shadow-sm' 
                : 'text-neutral-500'
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5 mr-1 inline" />
            Income
          </Toggle>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={`relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br ${currentExample.color} dark:bg-neutral-800/50 backdrop-blur-sm aspect-[2.2/1] p-5 shadow-md`}
      >
        {/* Decorative Elements */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 dark:from-white/10 to-transparent" />
        <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-tl from-white/5 dark:from-white/5 to-transparent" />
        
        <div className="relative flex h-full gap-4">
          {/* Left side - Icon */}
          <div className="flex items-center">
            {currentExample.icon}
          </div>
          
          {/* Middle - Transaction Details */}
          <div className="flex flex-col justify-center flex-1">
            <h3 className="font-bold text-lg dark:text-white">{currentExample.title}</h3>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              <span className="inline-flex items-center gap-1">
                <Coffee className="h-3.5 w-3.5" /> {currentExample.category}
              </span>
              <span className="inline-flex items-center gap-1 ml-4">
                <CreditCard className="h-3.5 w-3.5" /> {currentExample.account}
              </span>
            </div>
          </div>
          
          {/* Right - Amount */}
          <div className="flex items-center">
            <div className={`font-bold ${currentExample.amountColor}`}>
              <div className="text-lg mb-1">{currencySymbol} {formatAmount(currentExample.amount)}</div>
              <div className="text-xs text-right opacity-70">{currencyCode}</div>
            </div>
          </div>
        </div>

        {/* Chip decoration */}
        <div className="absolute left-10 top-0 w-12 h-2 bg-gradient-to-r from-amber-300/70 to-amber-400/70 dark:from-amber-500/40 dark:to-amber-600/40 rounded-b-lg" />
      </motion.div>

      <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        <p className="text-center opacity-75">
          This is how your transactions will appear with {currencyCode} currency
        </p>
      </div>
    </div>
  );
} 