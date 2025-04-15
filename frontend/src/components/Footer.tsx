import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

const Footer = () => {
  const socialIcons = [
    {
      icon: <Github size={20} />,
      href: "https://github.com/NojinNojs/moment",
      label: "Github",
    },
  ];

  return (
    <footer className="border-t border-muted py-12">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-6xl mx-auto">
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center gap-2">
              <motion.img
                src="/favicon.svg"
                alt="Moment Logo"
                className="h-8 w-8 text-primary rounded-md"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              />
              <span className="text-xl font-bold">Moment</span>
            </Link>
            <p className="text-muted-foreground text-center md:text-left">
              Simplify your financial journey with our AI-powered money
              management app.
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              {socialIcons.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="bg-muted p-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  whileHover={{ y: -5, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-muted text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Moment. All rights reserved.</p>
          <p className="mt-2 text-sm">Developed by ZUJACA Team</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
