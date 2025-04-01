import { ReactNode, useState } from "react";
import { SidebarContext, SidebarContextProps } from "./SidebarContext";

/**
 * Props for the SidebarProvider component
 */
interface SidebarProviderProps {
  /** React children */
  children: ReactNode;
  /** Whether to animate sidebar transitions */
  animate?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Controlled setter for open state */
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Provider component for the sidebar context
 * Can be used in controlled or uncontrolled mode
 */
export const SidebarProvider = ({ 
  children,
  animate = true,
  open: openProp,
  setOpen: setOpenProp
}: SidebarProviderProps) => {
  // Internal state for uncontrolled mode
  const [openState, setOpenState] = useState(false);
  
  // Use provided props if available, otherwise use internal state
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp || setOpenState;
  
  // Create context value
  const contextValue: SidebarContextProps = {
    open,
    setOpen,
    animate
  };
  
  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}; 