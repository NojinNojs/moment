import { useState } from "react";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/auth-utils";
import { DashboardHeader } from "@/components/dashboard";
import {
  ProfileSection,
  PasswordSection,
  AccountManagement,
  LogoutDialog,
  CurrencySettings,
} from "@/components/dashboard/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

// Main Settings Component
export default function Settings() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { user, logout } = useAuth();

  const handleSaveProfile = () => {
    setShowSuccessAlert(true);
    setEditMode(false);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <div className="py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <DashboardHeader
            title="Settings"
            description="Manage your account preferences and settings"
            icon={<SettingsIcon className="h-8 w-8 text-primary opacity-85" />}
          />
        </motion.div>

        {/* Success Alert */}
        <AnimatePresence>
          {showSuccessAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  Success!
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Your changes have been saved successfully.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Profile Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Profile Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your personal information and preferences
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      variant={editMode ? "destructive" : "default"}
                      className={`gap-2 ${
                        editMode
                          ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          : "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
                      }`}
                    >
                      {editMode ? "Cancel Edit" : "Edit Profile"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {editMode
                      ? "Cancel editing profile"
                      : "Click to edit your profile"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ProfileSection
              user={user}
              onSave={handleSaveProfile}
              editMode={editMode}
            />
          </motion.div>

          {/* Currency Settings Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Currency Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Set your preferred currency for the application
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50"
              >
                Global
              </Badge>
            </div>
            <CurrencySettings defaultCurrency="USD" />
          </motion.div>

          {/* Security Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Security Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account security and authentication
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50"
              >
                Recommended
              </Badge>
            </div>
            <div className="space-y-6">
              <PasswordSection />
            </div>
          </motion.div>

          {/* Account Management Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Account Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account access and data
                </p>
              </div>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <AccountManagement onLogout={() => setShowLogoutDialog(true)} />
          </motion.div>
        </motion.div>
      </div>

      {/* Logout Dialog */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onLogout={handleLogout}
      />
    </div>
  );
}
