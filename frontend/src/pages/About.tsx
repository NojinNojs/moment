import { motion } from "framer-motion";
import { Code, Wallet, LineChart, ShieldCheck, Brain, Sprout } from "lucide-react";
import AboutHero from "@/components/AboutHero";
import AboutStory from "@/components/AboutStory";
import ValuesSection from "@/components/ValuesSection";
import ProblemSolutionSection from "@/components/ProblemSolutionSection";
import TeamSection from "@/components/TeamSection";
import { TeamMemberType } from "@/components/TeamMember";

const About = () => {
  const teamMembers: TeamMemberType[] = [
    { 
      name: "Zev Hadid Santoso", 
      role: "Machine Learning", 
      emoji: "🧠", 
      abbr: "Z",
      github: "https://github.com/ZevHadid",
      linkedin: null
    },
    { 
      name: "Uno Belmiro Ileng", 
      role: "Frontend/Backend", 
      emoji: "💻", 
      abbr: "U",
      github: null,
      linkedin: null
    },
    { 
      name: "Jonah Setiawan", 
      role: "Frontend/Backend", 
      emoji: "🌐", 
      abbr: "J",
      github: null,
      linkedin: null
    },
    { 
      name: "Raffi Aqsan", 
      role: "Frontend/Backend", 
      emoji: "⚙️", 
      abbr: "A",
      github: "https://github.com/NojinNojs",
      linkedin: "https://linkedin.com/in/raffiaqsan"
    },
    { 
      name: "Christian J. Sayono", 
      role: "Machine Learning", 
      emoji: "📊", 
      abbr: "C",
      github: "https://github.com/tienen1707",
      linkedin: null
    },
    { 
      name: "Michelle Angelina", 
      role: "Frontend/Backend", 
      emoji: "🎨", 
      abbr: "A",
      github: null,
      linkedin: null
    }
  ];

  const ourValues = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Security First",
      description: "Your financial data is sensitive. We employ robust security measures to ensure your information is always protected."
    },
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Smart Insights",
      description: "We transform financial management by providing personalized insights that help you make better decisions and improve your financial habits."
    },
    {
      icon: <Sprout className="w-8 h-8 text-primary" />,
      title: "Continuous Growth",
      description: "We're committed to constantly improving our platform based on user feedback and technological advancements in financial management tools."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-16 md:py-24"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <AboutHero 
          title="About"
          highlightedText="Moment"
          description="Simplifying financial management for everyone. Our platform helps you take control of your finances with ease and build better financial habits."
        />

        {/* Our Story Section */}
        <AboutStory 
          title="Our Story"
          paragraphs={[
            "Moment was born from a simple observation: managing personal finances shouldn't be complicated. Many individuals still struggle with maintaining healthy financial habits due to the complexity of tracking income and expenses.",
            "Our team, ZUJACA, developed this comprehensive financial management platform to help users gain control over their finances. What started as a simple expense tracker has evolved into a smart solution that automatically categorizes transactions, making financial management more accessible to everyone."
          ]}
          icon={<Wallet className="w-16 h-16 text-primary" />}
        />

        {/* Our Values Section */}
        <ValuesSection 
          title="Our Values"
          values={ourValues}
        />

        {/* Problem & Solution Section */}
        <ProblemSolutionSection 
          title="The Problem We Solve"
          problemTitle="The Challenge"
          problemDescription={[
            "Many individuals struggle with maintaining healthy financial habits due to the complexity of tracking income and expenses. Manual record-keeping feels cumbersome and time-consuming.",
            "Existing financial tools often lack automation features, requiring users to categorize transactions manually, making the process inefficient and leading to poor financial decision-making."
          ]}
          solutionTitle="Our Solution"
          solutionDescription={[
            "Moment uses smart categorization to automatically organize expenses based on transaction descriptions, simplifying financial tracking significantly.",
            "Our intuitive dashboard provides a comprehensive overview of your financial status, helping you develop healthier financial habits and make smarter, more systematic financial decisions."
          ]}
          problemIcon={<LineChart className="w-8 h-8 text-red-500" />}
          solutionIcon={<Code className="w-8 h-8 text-green-500" />}
        />

        {/* Team Section */}
        <TeamSection 
          title="Meet Team ZUJACA"
          description="Our name ZUJACA comes from the first letters of each team member's name: Zev, Uno, Jonah, Aqsan, Christian, and Angel."
          teamMembers={teamMembers}
        />
      </div>
    </motion.div>
  );
};

export default About;