import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define proper EventHandler and EventCallback types
type EventCallback<T = unknown> = (data: T) => void;
type EventUnsubscribe = () => void;

// Event bus to enable communication between components without direct dependencies
export const EventBus = {
  events: {} as Record<string, EventCallback[]>,
  
  // Subscribe to an event
  on<T = unknown>(event: string, callback: EventCallback<T>): EventUnsubscribe {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback as EventCallback);
    
    // Return an unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  },
  
  // Emit an event with data
  emit<T = unknown>(event: string, data?: T): void {
    if (!this.events[event]) {
      return;
    }
    
    this.events[event].forEach(callback => {
      callback(data);
    });
  },
  
  // Get count of listeners for an event
  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  },
  
  // Log all current listeners (for debugging)
  debug(): void {
    console.log('[EventBus] Current listeners:');
    Object.entries(this.events).forEach(([event, callbacks]) => {
      console.log(`- ${event}: ${callbacks.length} listeners`);
    });
  }
};

/**
 * Format a number as currency
 * @param value The number to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a date to a string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Truncate a string if it exceeds a specified length
 * @param str String to truncate
 * @param length Maximum length
 * @param ending String to append at the end (default: "...")
 * @returns Truncated string
 */
export function truncateString(str: string, length: number, ending = "..."): string {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - ending.length) + ending;
}

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
