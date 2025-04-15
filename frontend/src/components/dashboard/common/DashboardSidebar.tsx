"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Landmark,
  LineChart,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  PiggyBank,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebarContext } from '@/contexts/SidebarContext';
import { LogoutDialog } from "@/components/dashboard/settings/LogoutDialog";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const context = useSidebarContext();
  const [localOpen, setLocalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use context or local state
  const open = context?.open ?? localOpen;
  const setOpen = context?.setOpen ?? setLocalOpen;
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Handle hover state and open/close sidebar with better responsiveness
  const handleMouseEnter = () => {
    setIsHovered(true);
    setOpen(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    // Only close if user menu is not open to prevent unwanted closing
    if (!showUserMenu) {
      setOpen(false);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      
      // Close sidebar if clicked outside and not hovered
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        !isHovered
      ) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHovered, setOpen]);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  type NavigationChild = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };

  type NavigationItem = {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: NavigationChild[];
  };

  const navigationItems = useMemo<NavigationItem[]>(() => [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Financial Management",
      icon: Wallet,
      children: [
        {
          name: "Assets",
          href: "/dashboard/assets",
          icon: Landmark,
        },
        {
          name: "Transactions",
          href: "/dashboard/transactions",
          icon: CreditCard,
        },
        {
          name: "Savings",
          href: "/dashboard/savings",
          icon: PiggyBank,
        },
        {
          name: "Bills",
          href: "/dashboard/bills",
          icon: CreditCard,
        },
      ]
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: LineChart,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ], []);

  // Check the current path and expand the dropdown if we're on a child route
  useEffect(() => {
    navigationItems.forEach(item => {
      if (
        (item.href && location.pathname === item.href) ||
        (item.children && item.children.some(child => location.pathname === child.href))
      ) {
        setExpandedItem(item.name);
      }
    });
  }, [location.pathname, navigationItems]);

  const toggleExpand = (itemName: string) => {
    setExpandedItem(expandedItem === itemName ? null : itemName);
  };

  // Enhanced text animation variants for smoother transitions
  const textVariants = {
    hidden: { 
      opacity: 0, 
      width: 0,
      x: -5,
      display: "none",
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1.0],
        opacity: { duration: 0.1 },
        display: { delay: 0.1 }
      }
    },
    visible: { 
      opacity: 1, 
      width: "auto",
      x: 0,
      display: "inline-block",
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1.0],
        opacity: { duration: 0.2, delay: 0.05 },
        display: { delay: 0 }
      }
    },
    hover: { 
      x: 4, 
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      } 
    }
  };
  
  // Determine if a nav item is active based on the current location
  const isNavItemActive = (href: string | undefined) => {
    if (!href) return false;
    return location.pathname === href || location.pathname === `${href}/`;
  };
  
  // Determine if a child item is active
  const isChildActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };
  
  // Determine if parent item with children should be highlighted
  const isParentActive = (children: NavigationChild[] | undefined) => {
    if (!children) return false;
    return children.some(child => isChildActive(child.href));
  };

  return (
    <>
      <motion.div 
        ref={sidebarRef}
        className="hidden lg:flex h-screen flex-col fixed left-0 top-0 bottom-0 border-r border-border bg-card z-40"
        initial={{ width: "5rem" }}
        animate={{
          width: open ? "18rem" : "5rem",
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.25, 0.1, 0.25, 1.0]
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <motion.img 
              src="/favicon.svg" 
              alt="Moment Logo" 
              className="h-6 w-6 min-w-6 rounded-md"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
            <motion.span
              variants={textVariants}
              initial="hidden"
              animate={open ? "visible" : "hidden"}
              className="whitespace-nowrap overflow-hidden"
            >
              Moment
            </motion.span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-hidden py-4 px-3">
          <nav className="space-y-1">
            {navigationItems.map((item: NavigationItem) => {
              if (item.children && item.children.length > 0) {
                const isActive = isParentActive(item.children);
                
                return (
                  <div key={item.name} className="rounded-md overflow-hidden">
                    <button 
                      onClick={() => toggleExpand(item.name)}
                      className={cn(
                        "flex items-center justify-between w-full p-2 rounded-md text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center overflow-hidden">
                        <item.icon className="h-5 w-5 min-w-5 mr-3" />
                        <motion.span
                          variants={textVariants}
                          initial="hidden"
                          animate={open ? "visible" : "hidden"}
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
                          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 pl-9 pt-1">
                            {item.children.map((child) => {
                              const isChildItemActive = isChildActive(child.href);
                              return (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  className={cn(
                                    "flex items-center rounded-md py-2 px-2 text-sm group/sidebar transition-colors duration-200",
                                    isChildItemActive
                                      ? "bg-accent text-accent-foreground font-medium"
                                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                                  )}
                                >
                                  <child.icon className="mr-3 h-4 w-4" />
                                  <motion.span 
                                    initial="visible"
                                    whileHover="hover"
                                    variants={textVariants}
                                    className="truncate"
                                  >
                                    {child.name}
                                  </motion.span>
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

              const isActive = isNavItemActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href || "#"}
                  className={cn(
                    "flex items-center rounded-md p-2 text-sm font-medium group/sidebar transition-colors duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 min-w-5 mr-3" />
                  <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate={open ? "visible" : "hidden"}
                    whileHover="hover"
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
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
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
                      ? "w-full bottom-full mb-1"
                      : "left-full ml-2 -translate-y-1/2 top-1/2"
                  )}
                >
                  <div className="p-1.5">
                    <Link 
                      to="/profile"
                      className="flex items-center gap-2 w-full p-2 text-sm rounded-md hover:bg-accent"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
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

      <LogoutDialog 
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onLogout={handleLogout}
      />
    </>
  );
}
