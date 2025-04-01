import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Key, Eye, EyeOff, CheckCircle, X, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// Animation variants for staggered animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  })
};

export function PasswordSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  // Validate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setValidation({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
      return;
    }
    
    const newValidation = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword)
    };
    
    setValidation(newValidation);
    
    // Calculate strength (0-100)
    const criteriaCount = Object.values(newValidation).filter(Boolean).length;
    setPasswordStrength(criteriaCount * 20);
    
    // Check if passwords match when both have values
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    }
  }, [newPassword, confirmPassword]);
  
  // Check if passwords match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [newPassword, confirmPassword]);
  
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 60) return "bg-orange-500";
    if (passwordStrength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 60) return "Fair";
    if (passwordStrength < 80) return "Good";
    return "Strong";
  };
  
  const handleUpdatePassword = () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (passwordStrength < 60) {
      toast.error("Please use a stronger password");
      return;
    }
    
    toast.success("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };
  
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      custom={1}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {!isEditing ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Change your password</h4>
                <p className="text-sm text-muted-foreground">
                  We recommend using a strong, unique password
                </p>
              </div>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                Change Password
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium flex justify-between">
                  <span>Current Password</span>
                  {currentPassword && (
                    <span className="text-green-500 text-xs flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> Required
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
                
                {newPassword && (
                  <div className="space-y-3 mt-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>Password strength: {getStrengthText()}</span>
                        <span className={passwordStrength >= 80 ? "text-green-500" : "text-muted-foreground"}>
                          {passwordStrength}%
                        </span>
                      </div>
                      <Progress value={passwordStrength} className={`h-1.5 ${getStrengthColor()}`} />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {validation.length ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <X className="h-3 w-3 text-red-500" />
                        }
                        <span className={validation.length ? "text-green-500" : "text-red-500"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {validation.uppercase ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <X className="h-3 w-3 text-red-500" />
                        }
                        <span className={validation.uppercase ? "text-green-500" : "text-red-500"}>
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {validation.lowercase ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <X className="h-3 w-3 text-red-500" />
                        }
                        <span className={validation.lowercase ? "text-green-500" : "text-red-500"}>
                          Lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {validation.number ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <X className="h-3 w-3 text-red-500" />
                        }
                        <span className={validation.number ? "text-green-500" : "text-red-500"}>
                          Number
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {validation.special ? 
                          <CheckCircle className="h-3 w-3 text-green-500" /> : 
                          <X className="h-3 w-3 text-red-500" />
                        }
                        <span className={validation.special ? "text-green-500" : "text-red-500"}>
                          Special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium flex justify-between">
                  <span>Confirm New Password</span>
                  {confirmPassword && (
                    passwordMatch ? 
                      <span className="text-green-500 text-xs flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> Passwords match
                      </span> :
                      <span className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> Passwords don't match
                      </span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
                {confirmPassword && !passwordMatch && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>
            </>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="border-t py-4 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelEdit} 
              className="mr-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || !passwordMatch || passwordStrength < 60}
            >
              Update Password
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

export default PasswordSection; 