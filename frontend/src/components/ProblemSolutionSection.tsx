import { motion } from "framer-motion";
import { LineChart, Code } from "lucide-react";

/**
 * Props for the ProblemSolutionSection component
 * 
 * @property {string} title - The main section title
 * @property {string} problemTitle - Title for the problem card
 * @property {string[]} problemDescription - Array of paragraphs describing the problem
 * @property {string} solutionTitle - Title for the solution card
 * @property {string[]} solutionDescription - Array of paragraphs describing the solution
 * @property {React.ReactNode} [problemIcon] - Optional custom icon for the problem card
 * @property {React.ReactNode} [solutionIcon] - Optional custom icon for the solution card
 */
interface ProblemSolutionProps {
  title: string;
  problemTitle: string;
  problemDescription: string[];
  solutionTitle: string;
  solutionDescription: string[];
  problemIcon?: React.ReactNode;
  solutionIcon?: React.ReactNode;
}

/**
 * ProblemSolutionSection Component
 * 
 * A section that displays a problem alongside its solution in a two-column layout.
 * On mobile, it stacks vertically. Each side has its own icon, title, and description.
 * 
 * Uses Framer Motion for scroll-triggered animations.
 * 
 * @param {ProblemSolutionProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const ProblemSolutionSection = ({
  title,
  problemTitle,
  problemDescription,
  solutionTitle,
  solutionDescription,
  problemIcon = <LineChart className="w-8 h-8 text-red-500" />,
  solutionIcon = <Code className="w-8 h-8 text-green-500" />
}: ProblemSolutionProps) => {
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
      className="mb-24"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-12">{title}</motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Problem Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            {problemIcon}
          </div>
          <h3 className="text-2xl font-semibold mb-4">{problemTitle}</h3>
          {problemDescription.map((paragraph, index) => (
            <p key={index} className="text-muted-foreground mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </motion.div>

        {/* Solution Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            {solutionIcon}
          </div>
          <h3 className="text-2xl font-semibold mb-4">{solutionTitle}</h3>
          {solutionDescription.map((paragraph, index) => (
            <p key={index} className="text-muted-foreground mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProblemSolutionSection; 