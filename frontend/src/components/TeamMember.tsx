import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Interface representing a team member's data
 * 
 * @property {string} name - Team member's full name
 * @property {string} role - Team member's role or position
 * @property {string} [emoji] - Optional emoji representing their role
 * @property {string} abbr - Abbreviation or initial used in the avatar
 * @property {string|null} [github] - Optional GitHub profile URL
 * @property {string|null} [linkedin] - Optional LinkedIn profile URL
 */
export interface TeamMemberType {
  name: string;
  role: string;
  emoji?: string;
  abbr: string;
  github?: string | null;
  linkedin?: string | null;
}

/**
 * Props for the TeamMember component
 * 
 * @property {TeamMemberType} member - The team member data to display
 */
interface TeamMemberProps {
  member: TeamMemberType;
}

/**
 * TeamMember Component
 * 
 * Displays information about a team member including their name, role,
 * and social links (GitHub, LinkedIn) if available.
 * 
 * Uses Framer Motion for animation effects that trigger when the component
 * comes into view.
 * 
 * @param {TeamMemberProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const TeamMember = ({ member }: TeamMemberProps) => {
  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 100 },
        },
      }}
      className="bg-card rounded-xl p-6 text-center"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-xl font-bold text-primary">{member.abbr}</span>
      </div>
      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
      <p className="text-muted-foreground mb-4">{member.role}</p>
      <div className="flex justify-center gap-3">
        {member.github && (
          <Button variant="outline" size="sm" asChild>
            <a href={member.github} target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </a>
          </Button>
        )}
        {member.linkedin && (
          <Button variant="outline" size="sm" asChild>
            <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default TeamMember; 