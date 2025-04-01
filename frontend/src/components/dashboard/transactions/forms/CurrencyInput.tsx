import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  id?: string;
  hasError?: boolean;
}

/**
 * CurrencyInput - A customized input component for handling currency values
 * Features:
 * - Maintains focus while typing
 * - Shows dollar sign
 * - Handles decimal input properly
 * - Shows error state when needed
 * - Enhanced visual feedback with focus animations
 */
export const CurrencyInput = ({
  value,
  onChange,
  className = "",
  placeholder = "$0.00",
  id,
  hasError = false,
}: CurrencyInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Handle input change in a way that preserves focus and cursor position
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    // Get current cursor position
    const cursorPos = e.target.selectionStart || 0;
    const inputValue = e.target.value;
    
    // Check if empty
    if (!inputValue) {
      onChange("");
      return;
    }
    
    // Check if user is deleting or adding $ sign
    if (inputValue === "$") {
      onChange("");
      return;
    }
    
    // Extract just the numbers and decimal
    let numericValue = inputValue.replace(/[^\d.]/g, "");
    
    // Handle multiple decimal points
    const decimalPoints = numericValue.split('.').length - 1;
    if (decimalPoints > 1) {
      const parts = numericValue.split('.');
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Update parent value
    onChange(numericValue);
    
    // Calculate the correct cursor position
    // If user added something after dollar sign, make sure cursor stays in correct place
    requestAnimationFrame(() => {
      if (inputRef.current) {
        // Set proper cursor position, accounting for $ sign
        let newCursorPos = cursorPos;
        
        // If the user just added the $ sign, adjust cursor
        if (inputValue[0] === '$' && cursorPos === 1) {
          newCursorPos = 1;
        } 
        // If user is typing in the middle
        else if (cursorPos > 0) {
          // Adjust for the $ sign if not already accounted for
          if (inputValue[0] !== '$' && value.length > 0) {
            newCursorPos = cursorPos + 1;
          }
        }
        
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Currency highlight animation variant
  const highlightVariants = {
    unfocused: { 
      x: 0,
      color: "rgb(107, 114, 128)",
      fontWeight: 400
    },
    focused: { 
      x: 0,
      color: value ? "rgb(79, 159, 61)" : "rgb(107, 114, 128)",
      fontWeight: 500,
      transition: { duration: 0.2 } 
    }
  };
  
  return (
    <div className={`relative ${hasError ? 'text-red-500' : ''}`}>
      <motion.span 
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
        variants={highlightVariants}
        initial="unfocused"
        animate={isFocused ? "focused" : "unfocused"}
      >
        $
      </motion.span>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        className={`${className} pl-7 ring-offset-background transition-shadow ${
          hasError 
            ? 'border-red-500 focus-visible:ring-red-500' 
            : isFocused 
              ? 'border-primary shadow-sm shadow-primary/10' 
              : ''
        }`}
        placeholder={placeholder.replace('$', '')}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputMode="decimal"
      />
    </div>
  );
};

export default CurrencyInput; 