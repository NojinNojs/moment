// Define the transaction types
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

// Transaction interface for API usage
export interface Transaction {
  _id?: string;       // MongoDB ID
  id?: number | string;       // Frontend ID
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  description?: string;
  account?: string;
  status?: TransactionStatus;
  paymentMethod?: string;
  recipientOrSender?: string;
  tags?: string[];
  formattedAmount?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: string;     // User ID reference
}

// Interface for creating a new transaction
export interface CreateTransactionDto {
  amount: number | string;
  type: TransactionType;
  category: string;
  title?: string;
  description?: string;
  date?: string;
  account?: string;
}

// Interface for updating a transaction
export interface UpdateTransactionDto {
  amount?: number | string;
  type?: TransactionType;
  category?: string;
  title?: string;
  description?: string;
  date?: string;
  account?: string;
} 