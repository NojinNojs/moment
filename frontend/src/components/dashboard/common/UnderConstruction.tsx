import { Construction, Hammer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnderConstructionProps {
  title?: string;
  description?: string;
  className?: string;
  minimal?: boolean;
}

export function UnderConstruction({
  title = "Under Construction",
  description = "This feature is currently under development. Check back soon!",
  className,
  minimal = false
}: UnderConstructionProps) {
  if (minimal) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-4 text-center space-y-2",
        "bg-muted/30 border border-dashed rounded-lg",
        className
      )}>
        <Construction className="h-5 w-5 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Coming Soon</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-6",
        "bg-muted/30 border border-dashed rounded-lg text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className="relative mb-6"
      >
        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl" />
        <div className="relative bg-primary/10 p-4 rounded-full">
          <Construction className="h-12 w-12 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">{description}</p>
      </motion.div>

      <motion.div
        className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Hammer className="h-4 w-4" />
        <span>We're working hard to bring you this feature</span>
      </motion.div>
    </motion.div>
  );
} 