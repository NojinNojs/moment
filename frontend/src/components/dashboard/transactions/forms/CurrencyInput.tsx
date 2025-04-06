import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

export interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  locale?: string;
  currencySymbol?: string;
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
 * - Prevents leading zeros
 * - Limits decimal places to two characters
 * - Allows seamless insertion of decimal point at the end of numbers
 * - Shows error state when needed
 * - Enhanced visual feedback with focus and hover animations
 * - Professional styling with consistent heights
 */
export function CurrencyInput({
  value = "",
  onChange = () => {},
  placeholder = "Enter amount",
  hasError = false,
  locale: localeProp,
  currencySymbol: currencySymbolProp,
  className,
  inputClassName,
  symbolClassName,
  id,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const previousValueRef = useRef<string>("");
  const cursorPositionRef = useRef<number | null>(null);
  const isDecimalJustAddedRef = useRef<boolean>(false);
  const wasAtEndRef = useRef<boolean>(false);

  // Get user currency settings
  const { currencySymbol, currencyLocale } = useCurrencyFormat();

  // Select the locale and currency symbol
  const locale = (localeProp || currencyLocale) as "en-US" | "id-ID";
  const symbol = currencySymbolProp || currencySymbol;

  // Extract separators based on locale
  const _decimalSeparator = locale === "id-ID" ? "," : ".";

  // Format display value with commas/periods
  const formatDisplayValue = useCallback(
    (value: string): string => {
      if (!value) return "";

      // Check if the value ends with a decimal separator
      const endsWithDecimal = value.endsWith(".");

      try {
        // Handle leading zeros - if value is just "0", keep it
        if (value === "0") return "0";

        // If value starts with "0" and has more digits, remove the leading zero
        if (value.length > 1 && value[0] === "0" && value[1] !== ".") {
          value = value.substring(1);
        }

        // Split into integer and decimal parts
        const parts = value.split(".");
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? parts[1] : "";

        // Limit decimal places to 2
        const limitedDecimalPart = decimalPart.substring(0, 2);

        // Format integer part with thousands separators
        let formattedInteger = "";
        if (integerPart === "") {
          formattedInteger = "0";
        } else {
          // Use a more reliable method to format the integer part with thousands separators
          const intValue = Number.parseInt(integerPart, 10);
          if (!isNaN(intValue)) {
            // Use Intl.NumberFormat for more reliable formatting
            formattedInteger = new Intl.NumberFormat(locale, {
              useGrouping: true,
              maximumFractionDigits: 0,
            }).format(intValue);
          } else {
            formattedInteger = integerPart; // Fallback
          }
        }

        // Combine parts based on whether there's a decimal part
        if (endsWithDecimal) {
          // If the original value ended with a decimal, preserve it
          return `${formattedInteger}${_decimalSeparator}`;
        } else if (limitedDecimalPart) {
          // If there's a decimal part, add it with the separator
          return `${formattedInteger}${_decimalSeparator}${limitedDecimalPart}`;
        } else {
          // Just return the integer part
          return formattedInteger;
        }
      } catch (error) {
        console.error("Error formatting value:", error);
        return value;
      }
    },
    [locale, _decimalSeparator],
  );

  // Update display value whenever the actual value changes
  useEffect(() => {
    if (value !== undefined) {
      const formatted = formatDisplayValue(value);
      setDisplayValue(formatted);
      previousValueRef.current = formatted;
    } else {
      setDisplayValue("");
      previousValueRef.current = "";
    }
  }, [value, formatDisplayValue]);

  // Handle focus on the container to focus the input element
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Convert display format to raw number
  const toRawNumber = useCallback(
    (displayFormat: string): string => {
      if (!displayFormat) return "";

      try {
        // For Indonesian locale (1.234,56)
        if (locale === "id-ID") {
          // Convert 1.234,56 to 1234.56
          return displayFormat.replace(/\./g, "").replace(/,/g, ".");
        }
        // For US locale (1,234.56)
        else {
          // Just remove commas
          return displayFormat.replace(/,/g, "");
        }
      } catch (error) {
        console.error("Error converting to raw number:", error);
        return displayFormat;
      }
    },
    [locale],
  );

  // Position cursor after decimal point
  const positionCursorAfterDecimal = useCallback(() => {
    if (!inputRef.current) return;

    const decimalPos = displayValue.indexOf(_decimalSeparator);
    if (decimalPos !== -1) {
      setTimeout(() => {
        inputRef.current?.setSelectionRange(decimalPos + 1, decimalPos + 1);
      }, 0);
    }
  }, [displayValue, _decimalSeparator]);

  // Calculate cursor position after formatting
  const calculateCursorPosition = useCallback(
    (oldValue: string, newValue: string, oldPosition: number, isAfterDecimal = false): number => {
      // Special case: if cursor was at the end before, keep it at the end
      if (wasAtEndRef.current) {
        return newValue.length;
      }
      
      // If positioning after decimal, find the decimal position
      if (isAfterDecimal) {
        const decimalPos = newValue.indexOf(_decimalSeparator);
        if (decimalPos !== -1) {
          return decimalPos + 1;
        }
      }

      // If at the end of the input, stay at the end
      if (oldPosition >= oldValue.length) {
        return newValue.length;
      }

      // If original position was within 2 characters of end, assume intent is to stay at end
      if (oldPosition >= oldValue.length - 2) {
        return newValue.length;
      }

      // Count digits before cursor in old value (excluding separators)
      let oldDigitsBeforeCursor = 0;
      for (let i = 0; i < oldPosition; i++) {
        if (/\d/.test(oldValue[i])) {
          oldDigitsBeforeCursor++;
        }
      }

      // Find position in new value with the same number of digits
      let newPos = 0;
      let digitCount = 0;

      for (let i = 0; i < newValue.length; i++) {
        if (digitCount >= oldDigitsBeforeCursor) {
          newPos = i;
          break;
        }

        if (/\d/.test(newValue[i])) {
          digitCount++;
        }
      }

      // If we didn't find a position, use the end of the string
      if (digitCount < oldDigitsBeforeCursor) {
        newPos = newValue.length;
      }

      return newPos;
    },
    [_decimalSeparator],
  );

  // Handle changes to the input value
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Save cursor position
    const cursorPos = e.target.selectionStart || 0;
      cursorPositionRef.current = cursorPos;
      
      // Check if cursor was at the end
      wasAtEndRef.current = cursorPos === e.target.value.length;

    const inputValue = e.target.value;
    
      // Allow empty input
      if (inputValue === "") {
        // Check if onChange is a function before calling it
        if (typeof onChange === "function") {
      onChange("");
        }
        return;
      }

      try {
        // Normalize the value - remove formatting characters
        let normalizedValue = toRawNumber(inputValue);

        // Check if a decimal point was just added at the end
        const previousRawValue = toRawNumber(previousValueRef.current);
        const isDecimalAdded =
          normalizedValue.endsWith(".") &&
          !previousRawValue.endsWith(".") &&
          cursorPositionRef.current === inputValue.length;

        // Set flag for decimal just added
        isDecimalJustAddedRef.current = isDecimalAdded;

        // Handle multiple decimal points - keep only the first
        if (normalizedValue.indexOf(".") !== normalizedValue.lastIndexOf(".")) {
          const parts = normalizedValue.split(".");
          normalizedValue = parts[0] + "." + parts.slice(1).join("");
        }

        // Handle leading zeros
        if (normalizedValue.length > 1 && normalizedValue[0] === "0" && normalizedValue[1] !== ".") {
          normalizedValue = normalizedValue.substring(1);
        }

        // Validate: only allow digits and one decimal point
        if (!/^[\d.]*$/.test(normalizedValue)) {
          return;
        }

        // Limit decimal places to 2
        if (normalizedValue.includes(".")) {
          const parts = normalizedValue.split(".");
          if (parts[1].length > 2) {
            normalizedValue = parts[0] + "." + parts[1].substring(0, 2);
          }
        }

        // Update the value - check if onChange is a function before calling it
        if (typeof onChange === "function") {
          onChange(normalizedValue);
        }

        // Format the new value for display
        const formattedValue = formatDisplayValue(normalizedValue);

        // Handle cursor positioning
        setTimeout(() => {
          if (inputRef.current && cursorPositionRef.current !== null) {
            let newPosition;

            if (isDecimalAdded) {
              // Position after decimal point
              newPosition = formattedValue.indexOf(_decimalSeparator) + 1;
            } else if (isDecimalJustAddedRef.current) {
              // If we're typing after a decimal was just added
              positionCursorAfterDecimal();
              // Reset the flag after handling
              isDecimalJustAddedRef.current = false;
              return;
            } else if (wasAtEndRef.current) {
              // If cursor was at the end, keep it at the end
              newPosition = formattedValue.length;
            } else {
              // Calculate new cursor position
              newPosition = calculateCursorPosition(previousValueRef.current, formattedValue, cursorPositionRef.current);
            }

            // Set the new cursor position
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);

        // Update previous value
        previousValueRef.current = formattedValue;
      } catch (error) {
        console.error("Error in handleInputChange:", error);
      }
    },
    [onChange, toRawNumber, formatDisplayValue, calculateCursorPosition, positionCursorAfterDecimal, _decimalSeparator],
  );

  // Handle key down - Direct approach for decimal points
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow all navigation keys and Ctrl combinations
      const allowedKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Tab",
        "Escape",
        "Enter",
        "Backspace",
        "Delete",
      ];
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        return;
      }

      try {
        // Special handling for decimal point key
        if (e.key === "." || e.key === ",") {
          e.preventDefault(); // Prevent default to handle it ourselves

          // If there's already a decimal, just move cursor after it
          if (displayValue.includes(_decimalSeparator)) {
            const decimalPos = displayValue.indexOf(_decimalSeparator);
            if (decimalPos !== -1) {
              inputRef.current?.setSelectionRange(decimalPos + 1, decimalPos + 1);
            }
      return;
    }
    
          // Get cursor position
          const cursorPos = e.currentTarget.selectionStart || 0;
          
          // Update the wasAtEnd reference
          wasAtEndRef.current = cursorPos === displayValue.length;

          // Get raw value without formatting
          const rawValue = toRawNumber(displayValue);

          // If cursor is at the end, add decimal at the end
          if (cursorPos >= displayValue.length) {
            const newValue = rawValue + ".";

            // Set flag for decimal just added
            isDecimalJustAddedRef.current = true;

            // Check if onChange is a function before calling it
            if (typeof onChange === "function") {
              onChange(newValue);
            }

            // Set cursor after decimal - use a slightly longer timeout to ensure formatting completes
            setTimeout(() => {
              if (inputRef.current) {
                const newFormatted = formatDisplayValue(newValue);
                const newDecimalPos = newFormatted.indexOf(_decimalSeparator);
                if (newDecimalPos !== -1) {
                  inputRef.current.setSelectionRange(newDecimalPos + 1, newDecimalPos + 1);
                }
              }
            }, 10);
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
          const newValue = rawValue.substring(0, insertPos) + "." + rawValue.substring(insertPos);

          // Set flag for decimal just added
          isDecimalJustAddedRef.current = true;

          // Check if onChange is a function before calling it
          if (typeof onChange === "function") {
            onChange(newValue);
          }

          // Position cursor after the decimal - use a slightly longer timeout
          setTimeout(() => {
      if (inputRef.current) {
              const newFormatted = formatDisplayValue(newValue);
              const newDecimalPos = newFormatted.indexOf(_decimalSeparator);
              if (newDecimalPos !== -1) {
                inputRef.current.setSelectionRange(newDecimalPos + 1, newDecimalPos + 1);
              }
            }
          }, 10);
          return;
        }

        // Update wasAtEnd reference for normal key presses
        const cursorPos = e.currentTarget.selectionStart || 0;
        wasAtEndRef.current = cursorPos === displayValue.length;

        // Prevent leading zeros
        if (e.key === "0" && displayValue === "0") {
          e.preventDefault();
          return;
        }

        // If the first character is '0' and trying to add a number, replace the '0'
        if (
          /^\d$/.test(e.key) &&
          displayValue === "0" &&
          (e.currentTarget.selectionStart === 1 || e.currentTarget.selectionEnd === 1)
        ) {
          e.preventDefault();

          // Check if onChange is a function before calling it
          if (typeof onChange === "function") {
            onChange(e.key);
          }
          return;
        }

        // Check if we're at the decimal limit
        if (/^\d$/.test(e.key) && displayValue.includes(_decimalSeparator)) {
          const parts = displayValue.split(_decimalSeparator);
          if (parts.length > 1 && parts[1].length >= 2) {
            // Get cursor position
            const cursorPos = e.currentTarget.selectionStart || 0;
            const decimalPos = displayValue.indexOf(_decimalSeparator);

            // Only prevent if cursor is in the decimal part
            if (cursorPos > decimalPos && cursorPos <= displayValue.length) {
              e.preventDefault();
              return;
            }
          }
        }

        // Special handling for typing after decimal was just added
        if (/^\d$/.test(e.key) && isDecimalJustAddedRef.current) {
          // Get the current raw value
          const rawValue = toRawNumber(displayValue);

          // If the raw value ends with a decimal point, append the digit
          if (rawValue.endsWith(".")) {
            e.preventDefault();

            const newValue = rawValue + e.key;

            // Check if onChange is a function before calling it
            if (typeof onChange === "function") {
              onChange(newValue);
            }

            // Position cursor after the new digit
            setTimeout(() => {
              if (inputRef.current) {
                const formatted = formatDisplayValue(newValue);
                const decimalPos = formatted.indexOf(_decimalSeparator);
                if (decimalPos !== -1) {
                  inputRef.current.setSelectionRange(decimalPos + 2, decimalPos + 2);
                }
              }
            }, 10);
            return;
          }
        }

        // Only allow digits
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      } catch (error) {
        console.error("Error in handleKeyDown:", error);
        // If there's an error, just prevent the default action
        e.preventDefault();
      }
    },
    [displayValue, onChange, _decimalSeparator, toRawNumber, formatDisplayValue],
  );

  // Reset the decimal flag when focus changes
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    isDecimalJustAddedRef.current = false;
    wasAtEndRef.current = false;

    // Format the value on blur to ensure it's properly formatted
    if (value) {
      try {
        // Check if the value is a valid number
        const num = Number.parseFloat(value);
        if (!isNaN(num)) {
          // Format the value
          const formatted = formatDisplayValue(value);
          setDisplayValue(formatted);
          previousValueRef.current = formatted;
        }
      } catch (error) {
        console.error("Error formatting on blur:", error);
      }
    }
  }, [value, formatDisplayValue]);

  // Handle paste events to filter non-numeric characters
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");

      // Update wasAtEnd reference for paste operation
      const cursorPos = e.currentTarget.selectionStart || 0;
      wasAtEndRef.current = cursorPos === displayValue.length;

      // Filter out non-numeric characters except decimal point
      const filteredText = pastedText.replace(/[^\d.]/g, "");

      // Process the filtered text
      if (filteredText) {
        // Get current value
        const currentRawValue = toRawNumber(displayValue);

        // Get cursor position
        const cursorPos = inputRef.current?.selectionStart || 0;
        const selectionEnd = inputRef.current?.selectionEnd || cursorPos;

        // Create new value with pasted text inserted at cursor
        const newValue =
          currentRawValue.substring(0, cursorPos) + filteredText + currentRawValue.substring(selectionEnd);

        // Normalize the new value
        let normalizedValue = newValue;

        // Handle multiple decimal points - keep only the first
        if (normalizedValue.indexOf(".") !== normalizedValue.lastIndexOf(".")) {
          const parts = normalizedValue.split(".");
          normalizedValue = parts[0] + "." + parts.slice(1).join("");
        }

        // Handle leading zeros
        if (normalizedValue.length > 1 && normalizedValue[0] === "0" && normalizedValue[1] !== ".") {
          normalizedValue = normalizedValue.substring(1);
        }

        // Limit decimal places to 2
        if (normalizedValue.includes(".")) {
          const parts = normalizedValue.split(".");
          if (parts[1].length > 2) {
            normalizedValue = parts[0] + "." + parts[1].substring(0, 2);
          }
        }

        // Update the value
        if (typeof onChange === "function") {
          onChange(normalizedValue);
        }

        // Set cursor position after the pasted text
        setTimeout(() => {
          if (inputRef.current) {
            const formatted = formatDisplayValue(normalizedValue);
            // If pasting at end, keep cursor at end
            if (wasAtEndRef.current) {
              inputRef.current.setSelectionRange(formatted.length, formatted.length);
            } else {
              const newCursorPos = calculateCursorPosition(displayValue, formatted, cursorPos + filteredText.length);
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }
        }, 10);
      }
    },
    [displayValue, onChange, toRawNumber, formatDisplayValue, calculateCursorPosition],
  );
  
  return (
    <div
      className={cn(
        "flex rounded-md overflow-hidden shadow-sm",
        hasError
          ? "ring-2 ring-destructive"
          : isFocused
            ? "ring-2 ring-primary/20"
            : "hover:ring-1 hover:ring-primary/10",
        "transition-all duration-200",
        className,
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
          isFocused ? "border-primary" : isHovered ? "border-primary/30" : "border-input",
          symbolClassName,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-200",
            isFocused ? "text-primary scale-105" : isHovered ? "text-primary/70" : "text-muted-foreground",
          )}
        >
          {symbol || <DollarSign className="h-4 w-4" />}
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
        onFocus={handleFocus}
        onBlur={handleBlur}
          onPaste={handlePaste}
          className={cn(
            "w-full border border-input h-11 outline-none px-3 font-medium text-[16px] bg-background",
            "border-l-0",
            "transition-colors duration-200",
            "placeholder:text-muted-foreground/60",
            isFocused ? "border-primary" : isHovered ? "border-primary/30" : "border-input",
            inputClassName,
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