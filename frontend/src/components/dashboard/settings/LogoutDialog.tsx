import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, ShieldAlert } from "lucide-react";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export function LogoutDialog({ open, onOpenChange, onLogout }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg border-none gap-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-red-500/90 to-red-600/90 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
          <div className="absolute right-12 bottom-0 w-16 h-16 rounded-full bg-white/10 blur-md" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Sign Out</h2>
              <p className="text-sm text-white/80 mt-0.5">You're about to leave your account</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {/* Main message */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to sign out from your account? You'll need to login again to access your financial data.
            </p>
            
            {/* Warning box */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Before you go</p>
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-400/80">Any unsaved changes will be lost and you'll be redirected to the login page.</p>
              </div>
            </div>
          </div>
          
          {/* Buttons with hover animations */}
          <div className="flex flex-col space-y-2 mt-6">
            <Button 
              onClick={onLogout}
              className="relative group overflow-hidden h-10"
              variant="destructive"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Yes, sign me out</span>
              </span>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="h-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel, keep me signed in
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LogoutDialog; 