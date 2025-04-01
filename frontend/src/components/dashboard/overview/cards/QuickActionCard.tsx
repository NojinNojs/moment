import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  icon: ReactNode;
  color?: string;
  onClick: () => void;
  tooltipText?: string;
  className?: string;
}

/**
 * QuickActionCard - An animated action button card for the dashboard
 * Enhanced with Framer Motion for delightful hover interactions
 */
export const QuickActionCard = ({
  title,
  icon,
  color = "default",
  onClick,
  tooltipText,
  className
}: QuickActionCardProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);
  
  // Base color map with gradients
  const colorMap: Record<string, { base: string, hover: string }> = {
    green: {
      base: isDarkMode 
        ? "bg-gradient-to-br from-green-800/30 via-green-900/20 to-green-900/10 text-green-300 border-green-800/50" 
        : "bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/20 text-green-700 border-green-200",
      hover: isDarkMode 
        ? "from-green-700/40 via-green-800/30 to-green-800/20" 
        : "from-green-100 via-green-50/80 to-green-200/40"
    },
    red: {
      base: isDarkMode 
        ? "bg-gradient-to-br from-red-800/30 via-red-900/20 to-red-900/10 text-red-300 border-red-800/50" 
        : "bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/20 text-red-700 border-red-200",
      hover: isDarkMode 
        ? "from-red-700/40 via-red-800/30 to-red-800/20" 
        : "from-red-100 via-red-50/80 to-red-200/40"
    },
    blue: {
      base: isDarkMode 
        ? "bg-gradient-to-br from-blue-800/30 via-blue-900/20 to-blue-900/10 text-blue-300 border-blue-800/50" 
        : "bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/20 text-blue-700 border-blue-200",
      hover: isDarkMode 
        ? "from-blue-700/40 via-blue-800/30 to-blue-800/20" 
        : "from-blue-100 via-blue-50/80 to-blue-200/40"
    },
    purple: {
      base: isDarkMode 
        ? "bg-gradient-to-br from-purple-800/30 via-purple-900/20 to-purple-900/10 text-purple-300 border-purple-800/50" 
        : "bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/20 text-purple-700 border-purple-200",
      hover: isDarkMode 
        ? "from-purple-700/40 via-purple-800/30 to-purple-800/20" 
        : "from-purple-100 via-purple-50/80 to-purple-200/40"
    },
    yellow: {
      base: isDarkMode 
        ? "bg-gradient-to-br from-yellow-800/30 via-yellow-900/20 to-yellow-900/10 text-yellow-300 border-yellow-800/50" 
        : "bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-200/20 text-yellow-700 border-yellow-200",
      hover: isDarkMode 
        ? "from-yellow-700/40 via-yellow-800/30 to-yellow-800/20" 
        : "from-yellow-100 via-yellow-50/80 to-yellow-200/40"
    },
    default: {
      base: "bg-gradient-to-br from-card/90 via-card/70 to-transparent text-card-foreground border-border",
      hover: "from-card/80 via-card/60 to-card/40"
    }
  };

  // Get valid color key
  const validColorKey = (color in colorMap) ? color : 'default';

  // Icon background colors with hover states
  const iconBgColors: Record<string, { base: string, hover: string }> = {
    green: {
      base: isDarkMode ? "bg-green-700/30 text-green-300" : "bg-green-100 text-green-700",
      hover: isDarkMode ? "bg-green-600/40" : "bg-green-200"
    },
    red: {
      base: isDarkMode ? "bg-red-700/30 text-red-300" : "bg-red-100 text-red-700",
      hover: isDarkMode ? "bg-red-600/40" : "bg-red-200"
    },
    blue: {
      base: isDarkMode ? "bg-blue-700/30 text-blue-300" : "bg-blue-100 text-blue-700",
      hover: isDarkMode ? "bg-blue-600/40" : "bg-blue-200"
    },
    purple: {
      base: isDarkMode ? "bg-purple-700/30 text-purple-300" : "bg-purple-100 text-purple-700",
      hover: isDarkMode ? "bg-purple-600/40" : "bg-purple-200"
    },
    yellow: {
      base: isDarkMode ? "bg-yellow-700/30 text-yellow-300" : "bg-yellow-100 text-yellow-700",
      hover: isDarkMode ? "bg-yellow-600/40" : "bg-yellow-200"
    },
    default: {
      base: "bg-primary/10 text-primary",
      hover: "bg-primary/20"
    }
  };

  const selectedColor = colorMap[validColorKey];
  const selectedIconBg = iconBgColors[validColorKey];
  
  // Card animation variants
  const cardVariants = {
    initial: { 
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      backgroundPosition: "0% 0%"
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      y: -5,
      backgroundPosition: "100% 100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
        backgroundPosition: {
          type: "tween",
          duration: 1.5,
          ease: "easeInOut"
        }
      }
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 10
      }
    }
  };
  
  // Icon animation variants
  const iconVariants = {
    initial: { 
      rotate: 0,
      scale: 1
    },
    hover: { 
      rotate: 5,
      scale: 1.15,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10,
        delay: 0.05
      }
    }
  };
  
  // Text animation variants
  const textVariants = {
    initial: { 
      y: 0,
      opacity: 0.9
    },
    hover: { 
      y: -2,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 20,
        delay: 0.1
      }
    }
  };

  const actionButton = (
    <motion.div
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={cardVariants}
      className="w-full relative overflow-hidden rounded-md"
    >
    <Button
      variant="outline"
      className={`min-h-[6rem] w-full p-4 flex flex-col gap-2 sm:gap-3 items-center justify-center border overflow-hidden ${selectedColor.base} bg-size-200 transition-colors duration-300`}
      onClick={onClick}
      style={{
        backgroundSize: "200% 200%"
      }}
    >
      <motion.div 
        className={`p-2 sm:p-3 rounded-full ${selectedIconBg.base} transition-colors`}
        style={{
          boxShadow: "0 0 0 0px rgba(0,0,0,0)"
        }}
        variants={iconVariants}
        whileHover={{
          boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'}`,
          className: `p-2 sm:p-3 rounded-full ${selectedIconBg.hover}`
        }}
      >
        {icon}
      </motion.div>
      
      <motion.div 
        className="w-full text-center"
        variants={textVariants}
      >
        <span className="text-xs sm:text-sm font-medium">{title}</span>
      </motion.div>
    </Button>
      
      {/* Gradient overlay that animates on hover */}
      <motion.div
        className={`absolute inset-0 opacity-0 bg-gradient-to-br ${selectedColor.hover} rounded-md pointer-events-none`}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className={cn(className)}>
              {actionButton}
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={5} className="text-sm">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className={cn(className)}>{actionButton}</div>;
};

export default QuickActionCard;
