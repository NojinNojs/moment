import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define trend info type
export interface TrendInfo {
  value: number;
  isPositive: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: "blue" | "green" | "purple" | "cyan" | "amber" | "pink" | "red" | "yellow";
  trend?: TrendInfo;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  period?: string;
  percentage?: number;
  isComingSoon?: boolean;
  formatter?: (value: number) => string;
  isPreview?: boolean;
}

/**
 * StatCard - Financial statistics card component optimized for fintech applications
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  period,
  percentage,
  isComingSoon,
  formatter,
  isPreview
}: StatCardProps) {
  // Card background gradients
  const cardBackgrounds = {
    blue: "bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/20 dark:from-blue-800/30 dark:via-blue-900/20 dark:to-blue-900/10",
    green: "bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/20 dark:from-green-800/30 dark:via-green-900/20 dark:to-green-900/10",
    purple: "bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/20 dark:from-purple-800/30 dark:via-purple-900/20 dark:to-purple-900/10",
    cyan: "bg-gradient-to-br from-cyan-50 via-cyan-100/50 to-cyan-200/20 dark:from-cyan-800/30 dark:via-cyan-900/20 dark:to-cyan-900/10",
    amber: "bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-200/20 dark:from-amber-800/30 dark:via-amber-900/20 dark:to-amber-900/10",
    pink: "bg-gradient-to-br from-pink-50 via-pink-100/50 to-pink-200/20 dark:from-pink-800/30 dark:via-pink-900/20 dark:to-pink-900/10",
    red: "bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/20 dark:from-red-800/30 dark:via-red-900/20 dark:to-red-900/10",
    yellow: "bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-200/20 dark:from-yellow-800/30 dark:via-yellow-900/20 dark:to-yellow-900/10"
  };

  // Border colors
  const borderColors = {
    blue: "border-blue-200 dark:border-blue-800/50",
    green: "border-green-200 dark:border-green-800/50", 
    purple: "border-purple-200 dark:border-purple-800/50",
    cyan: "border-cyan-200 dark:border-cyan-800/50",
    amber: "border-amber-200 dark:border-amber-800/50", 
    pink: "border-pink-200 dark:border-pink-800/50",
    red: "border-red-200 dark:border-red-800/50",
    yellow: "border-yellow-200 dark:border-yellow-800/50"
  };

  // Text colors
  const textColors = {
    blue: "text-blue-700 dark:text-blue-300",
    green: "text-green-700 dark:text-green-300",
    purple: "text-purple-700 dark:text-purple-300",
    cyan: "text-cyan-700 dark:text-cyan-300",
    amber: "text-amber-700 dark:text-amber-300", 
    pink: "text-pink-700 dark:text-pink-300",
    red: "text-red-700 dark:text-red-300",
    yellow: "text-yellow-700 dark:text-yellow-300"
  };

  // Icon background
  const iconBgClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-300",
    red: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300"
  };

  // Trend indicator colors
  const trendColors = {
    positive: "bg-green-100/60 text-green-700 dark:bg-green-700/20 dark:text-green-300",
    negative: "bg-red-100/60 text-red-700 dark:bg-red-700/20 dark:text-red-300"
  };

  // Format the value if it's a number and formatter is provided
  const displayValue = typeof value === 'number' && formatter 
    ? formatter(value < 0 ? 0 : value)
    : typeof value === 'number' 
      ? (value < 0 ? "0" : value.toString())
      : value.toString();

  // Create trend info from percentage if provided
  const trendInfo = percentage ? {
    value: Math.abs(percentage),
    isPositive: percentage > 0
  } : trend;

  // Get tooltip text based on trend
  const getTrendTooltip = (trend: TrendInfo) => {
    const baseText = trend.isPositive 
      ? "Increased by" 
      : "Decreased by";
    
    const periodText = period || "last 30 days";
    
    return `${baseText} ${trend.value}% compared to the ${periodText}`;
  };
  
  // Animation for preview mode
  const previewAnimation = isPreview ? {
    animate: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 0 0 0 rgba(34, 197, 94, 0)",
        "0 0 0 4px rgba(34, 197, 94, 0.3)",
        "0 0 0 0 rgba(34, 197, 94, 0)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  } : {};

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.98 }}
      {...previewAnimation}
    >
      <Card 
        className={cn(
          "border overflow-hidden h-full", 
          borderColors[color],
          cardBackgrounds[color],
          isPreview && "preview-mode"
        )}
      >
        <div className="grid grid-rows-[auto_1fr_auto] h-full p-3 sm:p-4 pb-2 sm:pb-3 
        gap-1 sm:gap-2">
          {/* Header with title and trend */}
          <div className="flex items-center justify-between">
            {/* Title with icon */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {Icon && (
                <motion.div 
                  className={cn("p-1 sm:p-1.5 rounded-full", iconBgClasses[color])}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </motion.div>
              )}
              <h3 className="text-xs sm:text-sm font-medium text-foreground tracking-wide leading-tight">{title}</h3>
            </div>

            {/* Show trend in header with tooltip - smaller on mobile */}
            {trendInfo && !isPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className={cn(
                        "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium",
                        trendInfo.isPositive ? trendColors.positive : trendColors.negative
                      )}
                    >
                      {trendInfo.isPositive ? "+" : ""}{trendInfo.value}%
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] sm:text-xs p-1.5 sm:p-2 max-w-[150px] text-center">
                    {getTrendTooltip(trendInfo)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Preview indicator */}
            {isPreview && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] rounded-full">
                Preview
              </span>
            )}
          </div>
          
          {/* Main financial value - better spacing for mobile */}
          <div className="flex flex-col items-center justify-center my-auto">
            <motion.div 
              className={cn(
                "text-xl sm:text-2xl md:text-3xl font-bold text-center mt-0.5 sm:mt-1 leading-tight", 
                textColors[color],
                isComingSoon && "opacity-70"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {displayValue}
            </motion.div>
            
            {/* Subtitle or period - smaller on mobile */}
            {(subtitle || period) && (
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                {subtitle || period || "Last 30 days"}
              </p>
            )}
            
            {/* Coming Soon tag */}
            {isComingSoon && (
              <div className="mt-1 px-2 py-0.5 bg-foreground/10 rounded-full text-[10px] text-muted-foreground">
                Coming Soon
              </div>
            )}
          </div>
          
          {/* Bottom decorative line */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div 
              className={cn("h-1 rounded-full w-1/3", textColors[color])}
              initial={{ width: '0%', opacity: 0 }}
              animate={{ width: '40%', opacity: 0.2 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

export default StatCard; 