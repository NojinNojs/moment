import { motion } from "framer-motion";
import TeamMember, { TeamMemberType } from "./TeamMember";

interface TeamSectionProps {
  title: string;
  description?: string;
  teamMembers: TeamMemberType[];
}

const TeamSection = ({ title, description, teamMembers }: TeamSectionProps) => {
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
      <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-4">{title}</motion.h2>
      {description && (
        <motion.p variants={itemVariants} className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {description}
        </motion.p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {teamMembers.map((member, index) => (
          <TeamMember key={index} member={member} />
        ))}
      </div>
    </motion.div>
  );
};

export default TeamSection; 