import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import { formatAmountWithCommas } from "@/lib/utils";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  locale?: 'en-US' | 'id-ID';
  currencySymbol?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  symbolClassName?: string;
  id?: string;
}

/**
 * CurrencyInput - A customized input component for handling currency values
 * Features:
 * - Maintains focus while typing
 * - Shows currency symbol in a visually separated box
 * - Real-time formatting with thousands separators
 * - Handles decimal input properly for both US and Indonesian formats
 * - Shows error state when needed
 * - Enhanced visual feedback with focus and hover animations
 * - Professional styling with consistent heights
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = "Enter amount",
  hasError = false,
  locale = 'en-US',
  currencySymbol,
  className,
  inputClassName,
  symbolClassName,
  id,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  
  // Get the correct decimal separator based on locale
  const decimalSeparator = locale === 'id-ID' ? ',' : '.';
  
  // Update display value whenever the actual value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatAmountWithCommas(value, locale));
    } else {
      setDisplayValue("");
    }
  }, [value, locale]);
  
  // Handle focus on the container to focus the input element
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);
  
  // Wrap the toRawNumber function in useCallback to fix exhaustive-deps warnings
  const toRawNumber = useCallback((displayFormat: string): string => {
    if (!displayFormat) return '';
    
    // For Indonesian locale (1.234,56)
    if (locale === 'id-ID') {
      // Convert 1.234,56 to 1234.56
      return displayFormat.replace(/\./g, '').replace(/,/g, '.');
    } 
    // For US locale (1,234.56)
    else {
      // Just remove commas
      return displayFormat.replace(/,/g, '');
    }
  }, [locale]);
  
  // Remove the handleLeadingZeros function from dependencies in handleInputChange
  const handleLeadingZeros = useCallback((value: string): string => {
    if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
      return value.substring(1);
    }
    return value;
  }, []);
  
  // Handle changes to the input value - Completely simplified
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty input
      if (inputValue === "") {
        onChange("");
        return;
      }
      
      // Normalize the value - remove formatting characters
      let normalizedValue = toRawNumber(inputValue);
      
      // Handle multiple decimal points - keep only the first
      if (normalizedValue.indexOf('.') !== normalizedValue.lastIndexOf('.')) {
        const parts = normalizedValue.split('.');
        normalizedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Handle leading zeros
      normalizedValue = handleLeadingZeros(normalizedValue);
      
      // Validate: only allow digits and one decimal point
      if (!/^[\d.]*$/.test(normalizedValue)) {
        return;
      }
      
      // Update the value
      onChange(normalizedValue);
    },
    [onChange, toRawNumber, handleLeadingZeros]
  );
  
  // Handle key down - Direct approach for decimal points
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow all navigation keys and Ctrl combinations
    const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete'];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    
    // CRITICAL FIX: Special direct handling for decimal point key
    if (e.key === '.' || e.key === ',') {
      e.preventDefault(); // Prevent default to handle it ourselves
      
      // If there's already a decimal, just move cursor after it
      if (displayValue.includes('.') || displayValue.includes(',')) {
        const decimalPos = displayValue.indexOf('.') !== -1 
          ? displayValue.indexOf('.') 
          : displayValue.indexOf(',');
          
        if (decimalPos !== -1) {
          inputRef.current?.setSelectionRange(decimalPos + 1, decimalPos + 1);
        }
        return;
      }
      
      // Get cursor position
      const cursorPos = e.currentTarget.selectionStart || 0;
      
      // Get raw value without formatting
      const rawValue = toRawNumber(displayValue);
      
      // If cursor is at the end, add decimal at the end
      if (cursorPos >= displayValue.length) {
        const newValue = rawValue + '.';
        onChange(newValue);
        
        // Set cursor after decimal
        setTimeout(() => {
          const newFormatted = formatAmountWithCommas(newValue, locale);
          const newDecimalPos = newFormatted.indexOf(decimalSeparator);
          inputRef.current?.setSelectionRange(newDecimalPos + 1, newDecimalPos + 1);
        }, 0);
        return;
      }
      
      // For decimal in the middle, count digits up to cursor
      let digitCount = 0;
      for (let i = 0; i < displayValue.length && i < cursorPos; i++) {
        if (/\d/.test(displayValue[i])) {
          digitCount++;
        }
      }
      
      // Find where to insert decimal in raw value
      let insertPos = 0;
      let countedDigits = 0;
      
      for (let i = 0; i < rawValue.length; i++) {
        if (/\d/.test(rawValue[i])) {
          countedDigits++;
          if (countedDigits === digitCount) {
            insertPos = i + 1;
            break;
          }
        }
      }
      
      // Create new value with decimal inserted at the right position
      const newValue = rawValue.substring(0, insertPos) + '.' + rawValue.substring(insertPos);
      onChange(newValue);
      
      // Position cursor after the decimal
      setTimeout(() => {
        const newFormatted = formatAmountWithCommas(newValue, locale);
        const newDecimalPos = newFormatted.indexOf(decimalSeparator);
        if (newDecimalPos !== -1) {
          inputRef.current?.setSelectionRange(newDecimalPos + 1, newDecimalPos + 1);
        }
      }, 0);
      return;
    }
    
    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, [displayValue, onChange, locale, decimalSeparator, toRawNumber, inputRef]);
  
  return (
    <div
      className={cn(
        "flex rounded-md overflow-hidden shadow-sm",
        hasError ? "ring-2 ring-destructive" : 
          isFocused ? "ring-2 ring-primary/20" : 
          "hover:ring-1 hover:ring-primary/10",
        "transition-all duration-200",
        className
      )}
      onClick={handleContainerClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Currency symbol container */}
      <div
        className={cn(
          "flex items-center justify-center h-11 w-12 border transition-all duration-200",
          "bg-muted/60 backdrop-blur-sm",
          isFocused ? "border-primary" : 
            isHovered ? "border-primary/30" : "border-input",
          symbolClassName
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            isFocused ? "text-primary scale-105" : 
              isHovered ? "text-primary/70" : "text-muted-foreground"
          )}
        >
          {currencySymbol || <DollarSign className="h-4 w-4" />}
        </div>
      </div>
      
      {/* Input field */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full border border-input h-11 outline-none px-3 font-medium text-[16px] bg-background",
            "border-l-0",
            "transition-colors duration-200",
            "placeholder:text-muted-foreground/60",
            isFocused ? "border-primary" : 
              isHovered ? "border-primary/30" : "border-input",
            inputClassName
          )}
          placeholder={placeholder}
          autoComplete="off"
          inputMode="decimal"
        />
      </div>
    </div>
  );
}

export default CurrencyInput; 