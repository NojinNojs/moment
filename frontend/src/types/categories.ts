export type CategoryType = 'income' | 'expense';

export interface Category {
  _id?: string;          // MongoDB ID
  id?: string;           // Frontend ID
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
  isDeleted?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
} 