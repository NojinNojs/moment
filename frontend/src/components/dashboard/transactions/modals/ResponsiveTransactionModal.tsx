import { useEffect, useState } from "react";
import AddTransactionDialog from "./AddTransactionDialog";
import AddTransactionDrawer from "./AddTransactionDrawer";
import EditTransactionDialog from "./EditTransactionDialog";
import EditTransactionDrawer from "./EditTransactionDrawer";

export interface TransactionModalProps {
  mode: 'add' | 'edit';
  type: 'income' | 'expense';
  isOpen: boolean;
  transactionAmount: string;
  transactionTitle?: string;
  transactionCategory: string;
  transactionDescription: string;
  transactionDate: string;
  transactionAccount?: string;
  formErrors: {
    amount?: string;
    title?: string;
    category?: string;
    account?: string;
  };
  onClose: () => void;
  onSubmit: () => void;
  onAmountChange: (value: string) => void;
  onTitleChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAccountChange?: (value: string) => void;
  useAutoCategory?: boolean;
  onAutoCategorizationChange?: (value: boolean) => void;
  accounts?: { id?: string; _id?: string; name: string; type: string; balance?: number; }[];
  isLoadingAccounts?: boolean;
  isSubmitting?: boolean;
}

/**
 * ResponsiveTransactionModal - Wrapper component that chooses between dialog or drawer
 * based on screen size. Selects the appropriate component for adding or editing transactions.
 * Features:
 * - Responsive - detects mobile vs desktop automatically
 * - Supports both add and edit modes
 * - Handles all necessary props routing to the appropriate component
 * - Adjusts content styling based on device capabilities
 * - Optimizes display for different screen sizes
 */
export function ResponsiveTransactionModal({
  mode,
  type,
  isOpen,
  transactionAmount,
  transactionTitle = "",
  transactionCategory,
  transactionDescription,
  transactionDate,
  transactionAccount = "",
  formErrors,
  onClose,
  onSubmit,
  onAmountChange,
  onTitleChange = () => {},
  onCategoryChange,
  onDescriptionChange,
  onDateChange,
  onAccountChange = () => {},
  useAutoCategory = true,
  onAutoCategorizationChange = () => {},
  accounts = [],
  isLoadingAccounts = false,
  isSubmitting = false
}: TransactionModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check if device is mobile and if it has touch capabilities
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check for touch capabilities
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Initial check
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Common props for all components with optimizations for mobile
  const commonProps = {
    type,
    isOpen,
    transactionAmount,
    transactionTitle,
    transactionCategory,
    transactionDescription,
    transactionDate,
    transactionAccount,
    formErrors,
    onClose,
    onSubmit,
    onAmountChange,
    onTitleChange,
    onCategoryChange,
    onDescriptionChange,
    onDateChange,
    onAccountChange,
    useAutoCategory,
    onAutoCategorizationChange,
    accounts,
    isLoadingAccounts,
    isSubmitting
  };

  // Additional optimizations for touch devices
  useEffect(() => {
    if (isOpen && isMobile) {
      // On mobile, prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add bottom padding for iOS safe area if needed
      if (isTouchDevice) {
        const safeAreaBottom = window.getComputedStyle(document.documentElement)
          .getPropertyValue('--safe-area-inset-bottom')
          .trim();
          
        if (safeAreaBottom && safeAreaBottom !== '0px') {
          document.body.style.paddingBottom = safeAreaBottom;
        }
      }
    }
    
    return () => {
      // Reset styles when component unmounts or modal closes
      if (isOpen) {
        document.body.style.overflow = '';
        document.body.style.paddingBottom = '';
      }
    };
  }, [isOpen, isMobile, isTouchDevice]);

  // Render the appropriate component based on mode and screen size
  if (mode === 'add') {
    return isMobile 
      ? <AddTransactionDrawer {...commonProps} /> 
      : <AddTransactionDialog {...commonProps} />;
  } else {
    // Edit mode
    return isMobile 
      ? <EditTransactionDrawer {...commonProps} /> 
      : <EditTransactionDialog {...commonProps} />;
  }
}

export default ResponsiveTransactionModal; 