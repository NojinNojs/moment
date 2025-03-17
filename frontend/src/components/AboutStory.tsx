import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface AboutStoryProps {
  title: string;
  paragraphs: string[];
  icon?: React.ReactNode;
}

const AboutStory = ({ title, paragraphs, icon = <Wallet className="w-16 h-16 text-primary" /> }: AboutStoryProps) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24"
    >
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </motion.div>
      <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-1">
        <div className="bg-card rounded-2xl h-full aspect-video flex items-center justify-center">
          <div className="flex items-center justify-center">
            {icon}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutStory; 