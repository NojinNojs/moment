import { motion } from "framer-motion";
import ValueCard from "./ValueCard";

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ValuesSectionProps {
  title: string;
  values: Value[];
}

const ValuesSection = ({ title, values }: ValuesSectionProps) => {
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="mb-24"
    >
      <motion.h2 
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 },
          },
        }} 
        className="text-3xl font-bold text-center mb-12"
      >
        {title}
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {values.map((value, index) => (
          <ValueCard 
            key={index} 
            icon={value.icon} 
            title={value.title} 
            description={value.description}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ValuesSection; 