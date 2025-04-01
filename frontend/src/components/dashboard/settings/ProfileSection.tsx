import { motion } from "framer-motion";
import { User as UserIcon, Save } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserType } from "@/contexts/auth-utils";
import { Input } from "@/components/ui/input";

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

// Profile Component
interface ProfileSectionProps {
  user: UserType | null;
  onSave: () => void;
  editMode: boolean;
}

export function ProfileSection({ user, onSave, editMode }: ProfileSectionProps) {
  return (
    <motion.div 
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      custom={0}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your basic information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-xl">
                {user?.name?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
              <Input
                id="fullName"
                type="text"
                disabled={!editMode}
                className={!editMode ? "bg-muted" : ""}
                defaultValue={user?.name || ""}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <Input
                id="email"
                type="email"
                disabled
                className="bg-muted cursor-not-allowed"
                value={user?.email || ""}
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
        </CardContent>
        {editMode && (
          <CardFooter className="border-t py-4">
            <Button 
              onClick={onSave} 
              className="ml-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

export default ProfileSection; 