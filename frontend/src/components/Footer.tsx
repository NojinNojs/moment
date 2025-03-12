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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-primary"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
                  fill="currentColor"
                />
              </svg>
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
