import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "../../contexts/SidebarProvider";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { BottomBar, DashboardSidebar } from "../../components/dashboard";

// Import all dashboard pages
import Overview from "./Overview";
import Reports from "./Reports";
import Savings from "./Savings";
import Assets from "./Assets";
import Bills from "./Bills";
import Transactions from "./Transactions";
import Settings from "./Settings";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <MainContent />
        <BottomBar />
      </div>
    </SidebarProvider>
  );
}

// Separated content component to use sidebar context
function MainContent() {
  const { open } = useSidebarContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Style for content based on sidebar state
  const contentStyle = {
    marginLeft: isMobile ? 0 : (open ? "18rem" : "5rem"),
    width: isMobile ? "100%" : (open ? "calc(100% - 18rem)" : "calc(100% - 5rem)"),
    transition: "margin 0.3s, width 0.3s",
    paddingBottom: isMobile ? "4rem" : "0", // Add padding for mobile to account for bottom bar
  };
  
  return (
    <main style={contentStyle} className="min-h-screen">
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/transactions" element={<Transactions />} />
        {/* Redirect to dashboard if path doesn't match */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
} 