import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, Activity } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-utils";
import { BottomBar, DashboardSidebar } from "@/components/dashboard";
import { SidebarContext } from "@/components/dashboard/DashboardSidebar";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // Initialize with default state - will be controlled by the sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Check screen size for responsive layout
  useLayoutEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="min-h-screen bg-background pb-16 lg:pb-0">
        <DashboardSidebar />
        {/* Use className for base styles and inline style for dynamic padding */}
        <main 
          className="transition-all duration-300"
          style={{
            paddingLeft: isLargeScreen ? (sidebarOpen ? "18rem" : "5rem") : "0"
          }}
        >
          <div className="py-6 lg:py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <div className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">Profile</CardTitle>
                      <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">{user.name}</p>
                          <p className="text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/profile")}>
                        Edit Profile
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">Settings</CardTitle>
                      <CardDescription>Manage your preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Settings className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">Account Settings</p>
                          <p className="text-muted-foreground">Privacy, security, notifications</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/settings")}>
                        View Settings
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">Activity</CardTitle>
                      <CardDescription>Your recent activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">Recent Actions</p>
                          <p className="text-muted-foreground">Login: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        View All Activity
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomBar />
      </div>
    </SidebarContext.Provider>
  );
} 