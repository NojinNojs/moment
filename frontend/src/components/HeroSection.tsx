import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-14 md:gap-12 lg:gap-16">
          <motion.div 
            className="flex-1 space-y-8 text-center md:text-left max-w-xl mx-auto md:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Manage your money with <span className="text-primary">Moment</span>
            </h1>
            <p className="text-lg text-muted-foreground mx-auto md:mx-0 max-w-lg">
              Take control of your finances with our easy-to-use money management
              platform. Track expenses, understand your spending patterns, and develop
              healthier financial habits for a secure future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                className="gap-2 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/register">
                  Get Started <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1 flex justify-center mt-10 md:mt-0 w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-full max-w-md overflow-visible">
              <motion.div 
                className="relative aspect-square rounded-3xl bg-gradient-to-br from-primary to-accent p-1.5 shadow-xl"
                whileHover={{ 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  transform: "translateY(-8px)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-card rounded-2xl overflow-hidden border border-primary/20">
                  <div className="relative h-full w-full p-4 sm:p-6 md:p-7 flex flex-col">
                    <div className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
                      <span className="mr-2">Financial Overview</span>
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Income</span>
                      <span className="font-semibold">$4,250.00</span>
                    </div>
                    <div className="flex justify-between mb-5">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-semibold">$2,840.00</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3.5 sm:p-4 mb-4 border border-primary/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Balance</span>
                        <motion.span 
                          className="font-bold text-primary"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          $1,410.00
                        </motion.span>
                      </div>
                      <div className="w-full h-2.5 bg-background rounded-full overflow-hidden">
                        <motion.div
                          className="bg-primary h-full"
                          initial={{ width: 0 }}
                          animate={{ width: "58%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        ></motion.div>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="text-sm text-muted-foreground mb-3 flex items-center justify-between">
                        <span>Recent Transactions</span>
                        <Button 
                          variant="link" 
                          size="sm"
                          className="p-0 h-auto text-xs text-primary"
                          asChild
                        >
                          <Link to="/login">View All</Link>
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <motion.div 
                          className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-accent flex items-center justify-center shadow-sm">
                              🍔
                            </div>
                            <span>Food</span>
                          </div>
                          <span className="text-red-500">-$24.50</span>
                        </motion.div>
                        <motion.div 
                          className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-accent flex items-center justify-center shadow-sm">
                              🚗
                            </div>
                            <span>Transport</span>
                          </div>
                          <span className="text-red-500">-$32.75</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
