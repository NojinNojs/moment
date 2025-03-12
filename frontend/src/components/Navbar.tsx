import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion } from "framer-motion"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  
  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b border-muted py-5 sticky top-0 bg-background/80 backdrop-blur-sm z-50"
    >
      <div className="container max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link to="/">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-primary">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"
                  fill="currentColor"
                />
              </svg>
            </Link>
            <span className="text-xl font-bold">Moment</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-10">
            <NavLink to="/" label="Home" isActive={isActive("/")} />
            <NavLink to="/about" label="About" isActive={isActive("/about")} />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline">Login</Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button>Register</Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-5 pb-6 flex flex-col gap-4"
          >
            <MobileNavLink to="/" label="Home" isActive={isActive("/")} onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink to="/about" label="About" isActive={isActive("/about")} onClick={() => setIsMenuOpen(false)} />
            
            <div className="flex flex-col gap-3 mt-4">
              <Button variant="outline" className="w-full">Login</Button>
              <Button className="w-full">Register</Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

// Desktop Navigation Link
const NavLink = ({ to, label, isActive }: { to: string; label: string; isActive: boolean }) => (
  <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
    <Link 
      to={to} 
      className={`relative font-medium transition-colors ${
        isActive 
          ? "text-primary" 
          : "text-foreground hover:text-primary"
      }`}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  </motion.div>
);

// Mobile Navigation Link
const MobileNavLink = ({ 
  to, 
  label, 
  isActive,
  onClick 
}: { 
  to: string; 
  label: string; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <Link 
    to={to} 
    className={`py-3 px-4 rounded-md text-center ${
      isActive 
        ? "bg-primary/10 text-primary font-medium" 
        : "text-foreground hover:text-primary hover:bg-muted transition-colors"
    }`}
    onClick={onClick}
  >
    {label}
  </Link>
);

export default Navbar;