"use client";
import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  Receipt,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Create a context for the sidebar state
export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};

export function DashboardSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  // Get the context values from parent if provided
  const context = useContext(SidebarContext);
  // Use local state if no context is provided
  const [localOpen, setLocalOpen] = useState(false);
  
  // Use context values if available, otherwise use local state
  const open = context?.open ?? localOpen;
  const setOpen = context?.setOpen ?? setLocalOpen;
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Ref for detecting clicks outside of the user menu
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Financial",
      icon: Wallet,
      children: [
        { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
        { name: "Assets", href: "/dashboard/assets", icon: Building2 },
      ],
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const toggleExpand = (itemName: string) => {
    setExpandedItem(expandedItem === itemName ? null : itemName);
  };

  return (
    <>
      <motion.div 
        className="hidden lg:flex h-screen flex-col fixed left-0 top-0 bottom-0 border-r border-border bg-card z-30"
        initial={{ width: "5rem" }}
        animate={{
          width: open ? "18rem" : "5rem",
        }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.1, 0.25, 1.0] // Cubic bezier for smoother motion
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          setOpen(false);
          setShowUserMenu(false); // Close user menu when sidebar is no longer hovered
        }}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 min-w-6 rounded-md bg-primary" />
            <motion.span
              animate={{
                opacity: open ? 1 : 0,
                width: open ? "auto" : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="whitespace-nowrap overflow-hidden"
            >
              Moment
            </motion.span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-hidden py-4 px-3">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              if (item.children) {
                const isActive = item.children.some(child => 
                  location.pathname === child.href
                );
                
                return (
                  <div key={item.name} className="rounded-md overflow-hidden">
                    <button 
                      onClick={() => toggleExpand(item.name)}
                      className={cn(
                        "flex items-center justify-between w-full p-2 rounded-md text-sm font-medium",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center overflow-hidden">
                        <item.icon className="h-5 w-5 min-w-5 mr-3" />
                        <motion.span
                          animate={{
                            opacity: open ? 1 : 0,
                            width: open ? "auto" : 0,
                          }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="truncate overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      </div>
                      {open && (
                        <motion.div
                          animate={{ 
                            rotate: expandedItem === item.name ? 180 : 0 
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {open && expandedItem === item.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 pl-9 pt-1">
                            {item.children.map((child) => {
                              const isChildActive = location.pathname === child.href;
                              return (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  className={cn(
                                    "flex items-center rounded-md py-2 px-2 text-sm",
                                    isChildActive
                                      ? "bg-accent text-accent-foreground font-medium"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  <child.icon className="mr-3 h-4 w-4" />
                                  <span className="truncate">{child.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-md p-2 text-sm font-medium",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 min-w-5 mr-3" />
                  <motion.span
                    animate={{
                      opacity: open ? 1 : 0,
                      width: open ? "auto" : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="truncate overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-4">
          <div className="relative" ref={userMenuRef}>
            <div 
              className={cn(
                "flex items-center gap-3 overflow-hidden cursor-pointer rounded-md p-1.5 transition-colors duration-200",
                showUserMenu ? "bg-accent" : "hover:bg-accent/50"
              )}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar className="h-8 w-8 min-w-8 border border-border">
                <AvatarFallback className="bg-primary/10">
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {open && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden flex-1"
                >
                  <div className="pr-6">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <motion.div 
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    animate={{ rotate: showUserMenu ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </motion.div>
              )}
            </div>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute z-50 bg-popover rounded-md shadow-lg overflow-hidden border border-border",
                    open 
                      ? "w-full bottom-full mb-1" // If sidebar is open, show above avatar
                      : "left-full ml-2 -translate-y-1/2 top-1/2" // If sidebar is collapsed, show to the right
                  )}
                >
                  <div className="p-1.5">
                    <Link 
                      to="/profile"
                      className="flex items-center gap-2 w-full p-2 text-sm rounded-md hover:bg-accent"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutDialog(true);
                      }}
                      className="flex items-center gap-2 w-full p-2 text-sm rounded-md hover:bg-accent text-left"
                    >
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout from your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
