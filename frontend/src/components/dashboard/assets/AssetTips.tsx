import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lightbulb, AlertCircle, TrendingUp } from "lucide-react";

export function AssetTips() {
  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  const tips = [
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      title: "Diversify Your Assets",
      description: "Keep a healthy mix of liquid and investment assets for both security and growth."
    },
    {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      title: "Emergency Fund",
      description: "Aim to keep 3-6 months of expenses in an emergency fund for unexpected situations."
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Track Regularly",
      description: "Review your assets monthly to stay on top of your financial situation."
    }
  ];

  return (
    <motion.div
      className="w-full mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Tips & Advice</h2>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tips.map((tip, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
              <CardHeader className="pb-2 flex flex-row items-center space-y-0 gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {tip.icon}
                </div>
                <CardTitle className="text-base">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{tip.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
} 