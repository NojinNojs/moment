import {
  CreditCard,
  PieChart,
  Zap,
  Clock,
  Scissors,
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <CreditCard className="h-12 w-12 text-primary" />,
    title: "Smart Transaction Tracking",
    description:
      "Easily record your income and expenses with our intuitive interface.",
  },
  {
    icon: <Zap className="h-12 w-12 text-primary" />,
    title: "AI-Powered Categorization",
    description:
      "Our machine learning algorithm automatically categorizes your transactions.",
  },
  {
    icon: <PieChart className="h-12 w-12 text-primary" />,
    title: "Insightful Dashboard",
    description:
      "Get a clear overview of your financial health with easy-to-understand charts.",
  },
  {
    icon: <Clock className="h-12 w-12 text-primary" />,
    title: "Real-time Updates",
    description:
      "See your financial position update instantly as you add transactions.",
  },
  {
    icon: <Scissors className="h-12 w-12 text-primary" />,
    title: "Custom Categories",
    description: "Create your own spending categories to match your lifestyle.",
  },
  {
    icon: <FileCheck className="h-12 w-12 text-primary" />,
    title: "Secure Cloud Storage",
    description:
      "Your financial data is encrypted and securely stored in the cloud.",
  },
];

const FeaturesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
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
    <section id="features" className="py-24 bg-muted">
      <div className="container max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
        <motion.div 
          className="text-center mb-20 space-y-5 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Discover how Moment makes managing your finances easier than ever
            before
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-colors shadow-sm hover:shadow-lg"
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full mb-2">{feature.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
