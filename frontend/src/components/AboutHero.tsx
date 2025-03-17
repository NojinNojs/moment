import { motion } from "framer-motion";

/**
 * Props interface for the AboutHero component
 * @property {string} title - The main title to display
 * @property {string} description - The descriptive text under the title
 * @property {string} [highlightedText] - Optional text to highlight in primary color
 */
interface AboutHeroProps {
  title: string;
  description: string;
  highlightedText?: string;
}

/**
 * AboutHero Component
 * 
 * A hero section component typically used at the top of pages, especially the About page.
 * Features animated entrance with staggered animations for title and description.
 * 
 * @param {AboutHeroProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const AboutHero = ({ title, description, highlightedText }: AboutHeroProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-16 max-w-3xl mx-auto"
    >
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
      >
        {title} {highlightedText && <span className="text-primary">{highlightedText}</span>}
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="text-lg text-muted-foreground mb-8"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default AboutHero; 