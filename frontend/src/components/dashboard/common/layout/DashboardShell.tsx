import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardShell - A layout component for dashboard content
 * Features:
 * - Consistent padding and spacing
 * - Title and optional subtitle
 * - Flexible content area with minimum height
 * - Subtle animations for content
 */
export default function DashboardShell({
  title,
  subtitle,
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn("flex flex-col min-h-full", className)}>
      <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">
              {subtitle}
            </p>
          )}
        </motion.div>
        
        <motion.div 
          className="min-h-[calc(100vh-14rem)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 