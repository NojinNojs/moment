// Core Components
import { TransactionActions } from "./core/TransactionActions";
import { TransactionDetails } from "./core/TransactionDetails";
import { TransactionHistory } from "./core/TransactionHistory";

// List Components
import { TransactionItem } from "./list/TransactionItem";
import { TransactionList } from "./list/TransactionList";
import type { Transaction } from "./list/TransactionItem";

// Overview Components
import { TransactionOverview } from "./overview/TransactionOverview";
import { RecentTransactionCard } from "./overview/RecentTransactionCard";

// Form Components
import TransactionForm from "./forms/TransactionForm";
import TransactionFilter from "./forms/TransactionFilter";
import DateRangePicker from "./forms/DateRangePicker";
import CurrencyInput from "./forms/CurrencyInput";

// Modal Components
import AddTransactionDialog from "./modals/AddTransactionDialog";
import AddTransactionDrawer from "./modals/AddTransactionDrawer";
import EditTransactionDialog from "./modals/EditTransactionDialog";
import EditTransactionDrawer from "./modals/EditTransactionDrawer";
import ResponsiveTransactionModal from "./modals/ResponsiveTransactionModal";
import DeleteTransactionDialog from "./modals/DeleteTransactionDialog";

// Type definitions
export type TransactionMode = 'add' | 'edit';
export interface TransactionFormData {
  amount: string;
  title: string;
  category: string;
  description: string;
  date: string;
  account: string;
}
export interface TransactionFormErrors {
  amount?: string;
  title?: string;
  category?: string;
  description?: string;
  account?: string;
  date?: string;
}

// Utils
import { TransactionUIComponents } from "./utils/TransactionModalContent";

/**
 * Transactions Module
 * 
 * A comprehensive set of components for managing financial transactions.
 * Organized into categories for easier maintenance and imports.
 */

// Re-export by category for organization
export const Core = {
  TransactionActions,
  TransactionDetails,
  TransactionHistory
};

export const List = {
  TransactionItem,
  TransactionList
};

export const Overview = {
  TransactionOverview,
  RecentTransactionCard
};

export const Forms = {
  TransactionForm,
  TransactionFilter,
  DateRangePicker,
  CurrencyInput
};

export const Modals = {
  AddTransactionDialog,
  AddTransactionDrawer,
  EditTransactionDialog,
  EditTransactionDrawer,
  DeleteTransactionDialog,
  ResponsiveTransactionModal
};

export const Utils = {
  TransactionUIComponents
};

// Flat exports for backward compatibility
export {
  // Core
  TransactionActions,
  TransactionDetails,
  TransactionHistory,
  
  // List
  TransactionItem,
  TransactionList,
  
  // Overview
  TransactionOverview,
  RecentTransactionCard,
  
  // Forms
  TransactionForm,
  TransactionFilter,
  DateRangePicker,
  CurrencyInput,
  
  // Modals
  AddTransactionDialog,
  AddTransactionDrawer,
  EditTransactionDialog,
  EditTransactionDrawer,
  DeleteTransactionDialog,
  ResponsiveTransactionModal,
  
  // Aliases for backward compatibility
  ResponsiveTransactionModal as TransactionModal,
};

// Re-export types
export type {
  Transaction
};