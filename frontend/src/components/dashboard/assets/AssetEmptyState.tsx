import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleDollarSign, PlusCircle } from "lucide-react";

interface AssetEmptyStateProps {
  onAddClick: () => void;
}

export function AssetEmptyState({ onAddClick }: AssetEmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md mx-auto border shadow-sm">
        <CardContent className="pt-6 pb-8 px-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CircleDollarSign className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">No Assets Yet</h3>
          <p className="text-center text-muted-foreground mb-6 max-w-xs">
            You haven't added any assets to track yet. Add your first asset to start managing your finances.
          </p>
          
          <Button 
            onClick={onAddClick}
            size="lg" 
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Your First Asset
          </Button>
        </CardContent>
      </Card>
      
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <span className="font-semibold text-blue-600 dark:text-blue-400">1</span>
          </div>
          <h4 className="font-medium mb-1">Add Your Assets</h4>
          <p className="text-sm text-muted-foreground">
            Add bank accounts, cash, wallets and emergency funds to track
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
            <span className="font-semibold text-green-600 dark:text-green-400">2</span>
          </div>
          <h4 className="font-medium mb-1">Organize by Category</h4>
          <p className="text-sm text-muted-foreground">
            Keep your assets organized by categories for better management
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <span className="font-semibold text-purple-600 dark:text-purple-400">3</span>
          </div>
          <h4 className="font-medium mb-1">Track Your Wealth</h4>
          <p className="text-sm text-muted-foreground">
            Monitor your overall financial health and wealth accumulation
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
} 