import React, { createContext, useContext } from "react";

// Type definitions for sidebar context
export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}

// Create the context with undefined default value
export const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

/**
 * Hook to use the sidebar context
 * @returns Sidebar context value
 * @throws Error if used outside of SidebarProvider
 */
export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}; 