import { useState, useEffect } from "react";

// Media query breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Hook to match a media query
 * @param query Media query string to match
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // For SSR, default to false during initial render
    // This prevents hydration mismatch
    if (typeof window === "undefined") return;
    
    const media = window.matchMedia(query);
    
    // Set initial state
    setMatches(media.matches);
    
    // Create listener function to update state
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener for changes
    media.addEventListener("change", listener);
    
    // Clean up
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);
  
  return matches;
}

/**
 * Hook to check if the current viewport is mobile
 * @param breakpoint Breakpoint to consider as the threshold for mobile (default: md)
 * @returns Boolean indicating if the current viewport is mobile
 */
export function useIsMobile(breakpoint: keyof typeof BREAKPOINTS = "md"): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

/**
 * Hook to check if the current viewport is at least a specific breakpoint
 * @param breakpoint Breakpoint to check (sm, md, lg, xl, 2xl)
 * @returns Boolean indicating if the viewport is at least the specified breakpoint
 */
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
} 