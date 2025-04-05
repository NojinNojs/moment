import { Calendar, ArrowRight, Receipt, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import useCurrencyFormat from '@/hooks/useCurrencyFormat';

interface Bill {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  isPaid?: boolean;
  category?: string;
}

interface UpcomingBillsCardProps {
  bills: Bill[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * UpcomingBillsCard - An enhanced component to display upcoming bills
 * Features:
 * - Visual indicators for upcoming due dates
 * - Progress bar showing days until due
 * - Animated card interactions
 * - Status badges for bill status
 * - Enhanced mobile and desktop experience
 */
export const UpcomingBillsCard = ({
  bills,
  title = "Upcoming Bills",
  description = "Bills due in the next 30 days",
  viewAllHref = "/dashboard/bills",
  emptyMessage = "No upcoming bills",
  className
}: UpcomingBillsCardProps) => {
  const [animateItems, setAnimateItems] = useState(false);
  const { formatCurrency } = useCurrencyFormat();
  
  // Trigger staggered animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateItems(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Get days until due date
  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Format due date with relative indicator
  const formatDueDate = (dueDate: string): { text: string, urgent: boolean, overdue: boolean } => {
    const daysUntil = getDaysUntilDue(dueDate);
    
    if (daysUntil < 0) {
      return { 
        text: `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`, 
        urgent: false, 
        overdue: true 
      };
    }
    
    if (daysUntil === 0) {
      return { text: 'Due today', urgent: true, overdue: false };
    }
    
    if (daysUntil === 1) {
      return { text: 'Due tomorrow', urgent: true, overdue: false };
    }
    
    if (daysUntil <= 3) {
      return { text: `Due in ${daysUntil} days`, urgent: true, overdue: false };
    }
    
    // Format the date for display (Oct 15)
    const date = new Date(dueDate);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return { 
      text: `Due ${formattedDate}`, 
      urgent: false, 
      overdue: false 
    };
  };
  
  // Calculate progress percentage for due date
  const getDueDateProgress = (dueDate: string): number => {
    const daysUntil = getDaysUntilDue(dueDate);
    
    if (daysUntil < 0) return 100; // Overdue
    if (daysUntil === 0) return 90; // Due today
    if (daysUntil <= 3) return 75; // Due soon
    if (daysUntil <= 7) return 50; // Due this week
    if (daysUntil <= 14) return 30; // Due in two weeks
    return 15; // Due later
  };
  
  // Sort bills by due date (closest first)
  const sortedBills = [...bills].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold text-card-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        <Link to={viewAllHref}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-sm text-primary"
          >
            <span className="hidden sm:inline">View All</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="pb-3">
        {sortedBills.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Receipt className="h-10 w-10 text-muted-foreground/50" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate={animateItems ? "show" : "hidden"}
          >
            {sortedBills.map((bill) => {
              const dueInfo = formatDueDate(bill.dueDate);
              const progressValue = getDueDateProgress(bill.dueDate);
              
              return (
                <motion.div
                  key={bill.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "border rounded-xl p-4 bg-card/50 transition-all",
                    "hover:shadow-md hover:bg-card",
                    dueInfo.overdue ? "border-destructive/30" : 
                    dueInfo.urgent ? "border-warning/30" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-full flex-shrink-0",
                        dueInfo.overdue ? "bg-destructive/10 text-destructive" :
                        dueInfo.urgent ? "bg-warning/10 text-warning" : 
                        "bg-muted text-muted-foreground"
                      )}>
                        {dueInfo.overdue ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : dueInfo.urgent ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Receipt className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-card-foreground line-clamp-1">
                          {bill.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {bill.category || "Bill"}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant={
                      dueInfo.overdue ? "destructive" : 
                      dueInfo.urgent ? "outline" : "secondary"
                    } className="ml-auto flex-shrink-0">
                      {dueInfo.text}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary/30">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          dueInfo.overdue ? "bg-destructive" : 
                          dueInfo.urgent ? "bg-warning" : "bg-primary"
                        )}
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(bill.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="font-bold text-card-foreground">
                      {formatCurrency(bill.amount)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-border pt-3">
        <Link to={viewAllHref} className="w-full">
          <Button 
            className="w-full" 
            variant="outline"
          >
            Manage All Bills
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default UpcomingBillsCard; 