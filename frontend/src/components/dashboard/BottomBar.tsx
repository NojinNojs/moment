import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  Receipt,
  ChevronUp,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationChildItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: NavigationChildItem[];
}

// Base navigation items for mobile
const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { 
    name: "Financial", 
    icon: Wallet,
    children: [
      { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
      { name: "Assets", href: "/dashboard/assets", icon: Building2 },
    ]
  },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function BottomBar() {
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleSubmenu = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  const isChildActive = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.href);
    }
    return false;
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <nav className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const isActive = 
            (item.href && location.pathname === item.href) || 
            (item.href && item.href !== "/dashboard" && location.pathname.startsWith(item.href)) || 
            isChildActive(item);
          
          const hasChildren = !!item.children;
          
          return (
            <div key={item.name} className="relative">
              {hasChildren ? (
                <button 
                  onClick={() => toggleSubmenu(item.name)}
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center py-1",
                    (isActive || expandedItem === item.name)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        (isActive || expandedItem === item.name)
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    {expandedItem === item.name && (
                      <ChevronUp 
                        className="text-primary absolute -top-1 -right-1 h-3 w-3" 
                      />
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              ) : (
                <Link
                  to={item.href || "#"}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 h-full",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              )}
              
              {/* Submenu for items with children */}
              <AnimatePresence>
                {hasChildren && expandedItem === item.name && item.children && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-16 left-0 right-0 mx-auto w-48 bg-popover rounded-t-lg shadow-lg overflow-hidden border border-border"
                  >
                    <div className="p-1 flex flex-col">
                      {item.children.map((child) => {
                        const isChildItemActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                              isChildItemActive
                                ? "bg-accent text-accent-foreground"
                                : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            onClick={() => setExpandedItem(null)}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </div>
  );
} 