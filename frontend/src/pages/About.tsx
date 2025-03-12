import { motion } from "framer-motion";
import { Code, Wallet, LineChart, ShieldCheck, Brain, Sprout, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  // Animation variants for staggered animations
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

  const teamMembers = [
    { 
      name: "Zev Hadid Santoso", 
      role: "Machine Learning", 
      emoji: "🧠", 
      abbr: "Z",
      github: null,
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
      github: null,
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-16 md:py-24"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section */}
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
            About <span className="text-primary">Moment</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Simplifying financial management for everyone. Our AI-powered platform helps you take control of your finances with ease and intelligence.
          </motion.p>
        </motion.div>

        {/* Our Story Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24"
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-3xl font-bold">Our Story</h2>
            <p className="text-muted-foreground">
              Moment was born from a simple observation: managing personal finances shouldn't be complicated. Many individuals still struggle with maintaining healthy financial habits due to the complexity of tracking income and expenses.
            </p>
            <p className="text-muted-foreground">
              Our team, ZUJACA, developed this comprehensive financial management platform powered by artificial intelligence to help users gain control over their finances. What started as a simple expense tracker has evolved into a smart solution that automatically categorizes transactions, making financial management more accessible to everyone.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-1">
            <div className="bg-card rounded-2xl h-full aspect-video flex items-center justify-center">
              <div className="flex items-center justify-center">
                <Wallet className="w-16 h-16 text-primary" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Our Values Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-24"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-12">Our Values</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Security First</h3>
              <p className="text-muted-foreground">Your financial data is sensitive. We employ robust security measures to ensure your information is always protected.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Intelligent Insights</h3>
              <p className="text-muted-foreground">We leverage the power of Machine Learning to transform financial management, providing personalized insights that help you make better decisions.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Continuous Growth</h3>
              <p className="text-muted-foreground">We're committed to constantly improving our platform based on user feedback and technological advancements in fintech and machine learning.</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Problem & Solution Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-24"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-12">The Problem We Solve</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div variants={itemVariants} className="bg-card rounded-xl p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">The Challenge</h3>
              <p className="text-muted-foreground mb-4">
                Many individuals struggle with maintaining healthy financial habits due to the complexity of tracking income and expenses. Manual record-keeping feels cumbersome and time-consuming.
              </p>
              <p className="text-muted-foreground">
                Existing financial tools often lack automation features, requiring users to categorize transactions manually, making the process inefficient and leading to poor financial decision-making.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-card rounded-xl p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Our Solution</h3>
              <p className="text-muted-foreground mb-4">
                Moment leverages Machine Learning to automatically categorize expenses based on transaction descriptions, simplifying financial tracking significantly.
              </p>
              <p className="text-muted-foreground">
                Our intuitive dashboard provides a comprehensive overview of your financial status, helping you develop healthier financial habits and make smarter, more systematic financial decisions.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-24"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center mb-4">Meet Team ZUJACA</motion.h2>
          <motion.p variants={itemVariants} className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our name ZUJACA comes from the first letters of each team member's name: Zev, Uno, Jonah, Aqsan, Christian, and Angel.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                variants={itemVariants} 
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
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default About;