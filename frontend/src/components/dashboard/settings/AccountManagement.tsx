import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface AccountManagementProps {
  onLogout: () => void;
}

export function AccountManagement({ onLogout }: AccountManagementProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      custom={5}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border-red-100 dark:border-red-900/40">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-red-600 dark:text-red-400">Account Management</CardTitle>
              <CardDescription>
                Manage your account access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="space-y-1 mb-4 sm:mb-0">
              <h4 className="font-medium">Logout from your account</h4>
              <p className="text-sm text-muted-foreground">
                End your current session on this device
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AccountManagement; 