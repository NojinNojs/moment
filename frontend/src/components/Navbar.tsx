import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Menu, X, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/contexts/auth-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  
  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    setShowLogoutDialog(false)
    logout()
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
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
            {isAuthenticated && (
              <NavLink to="/dashboard" label="Dashboard" isActive={isActive("/dashboard")} />
            )}
          </div>

          {/* Auth buttons or user menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-full">
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random`} />
                      <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user?.name}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild>
                    <Link to="/register">Register</Link>
                  </Button>
                </motion.div>
              </>
            )}
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
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-5 pb-6 flex flex-col gap-4"
            >
              <MobileNavLink to="/" label="Home" isActive={isActive("/")} onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/about" label="About" isActive={isActive("/about")} onClick={() => setIsMenuOpen(false)} />
              
              {isAuthenticated ? (
                <>
                  <MobileNavLink 
                    to="/dashboard" 
                    label="Dashboard" 
                    isActive={isActive("/dashboard")} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <MobileNavLink 
                    to="/settings" 
                    label="Settings" 
                    isActive={isActive("/settings")} 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random`} />
                        <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full mt-2" 
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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