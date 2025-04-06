import React, { useState, useMemo, useCallback } from "react";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/auth-utils";
import { DashboardHeader } from "@/components/dashboard";
import {
  ProfileSection,
  PasswordSection,
  AccountManagement,
  LogoutDialog,
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
import { useCurrencyFormat } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { CurrencyExampleCard } from "@/components/dashboard/example/CurrencyExampleCard";

// Interface for currency options
interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

// Props interface for CurrencyOptionsGrid
interface CurrencyOptionsGridProps {
  options: CurrencyOption[];
  currentCode: string;
  onChange: (code: string) => void;
  isLoading: boolean;
}

// Static Alert component (no animation)
const SuccessAlert = React.memo(() => (
  <div className="mb-6">
    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50">
      <CheckCircle2 className="h-4 w-4 text-green-500" />
      <AlertTitle className="text-green-800 dark:text-green-300">
        Success!
      </AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-400">
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  </div>
));

SuccessAlert.displayName = 'SuccessAlert';

// Memoized currency options component to prevent unnecessary re-renders
const CurrencyOptionsGrid = React.memo(({ 
  options, 
  currentCode, 
  onChange, 
  isLoading 
}: CurrencyOptionsGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {options.map(currency => (
        <Button
          key={currency.code}
          variant={currentCode === currency.code ? "default" : "outline"}
          onClick={() => onChange(currency.code)}
          disabled={isLoading || currentCode === currency.code}
          className={`justify-start text-left h-auto py-3 px-4 ${
            currentCode === currency.code 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted/50'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="text-lg font-medium">{currency.symbol}</div>
            <div>
              <div className="font-medium">{currency.code}</div>
              <div className="text-xs opacity-70">{currency.name}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
});

CurrencyOptionsGrid.displayName = 'CurrencyOptionsGrid';

// Profile Section Header (memoized)
const ProfileSectionHeader = React.memo(({ editMode, onEditToggle }: { editMode: boolean; onEditToggle: () => void }) => (
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
            onClick={onEditToggle}
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
));

ProfileSectionHeader.displayName = 'ProfileSectionHeader';

// Main Settings Component
export default function Settings() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { user, logout } = useAuth();
  const { currencyCode, setCurrency, isLoadingCurrency } = useCurrencyFormat();

  // Memoized currency options to prevent re-renders
  const currencyOptions = useMemo(() => [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ], []);

  const handleSaveProfile = useCallback(() => {
    setShowSuccessAlert(true);
    setEditMode(false);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setShowLogoutDialog(false);
  }, [logout]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

  // For currency selection - wrapped in useCallback to prevent unnecessary re-creation
  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    if (newCurrency === currencyCode) return; // Skip if already selected
    
    try {
      await setCurrency(newCurrency);
      toast.success(`Currency changed to ${newCurrency}`);
    } catch (error) {
      console.error('Error changing currency:', error);
      toast.error('Failed to update currency settings');
    }
  }, [currencyCode, setCurrency]);

  // Simple DOM without animations for better performance
  return (
    <div className="py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Header - Static without animation */}
        <div className="mb-8">
          <DashboardHeader
            title="Settings"
            description="Manage your account preferences and settings"
            icon={<SettingsIcon className="h-8 w-8 text-primary opacity-85" />}
          />
        </div>

        {/* Success Alert - Static */}
        {showSuccessAlert && <SuccessAlert />}

        {/* Settings Content - No animations */}
        <div className="space-y-8">
          {/* Profile Section */}
          <div>
            <ProfileSectionHeader 
              editMode={editMode} 
              onEditToggle={toggleEditMode} 
            />
            <ProfileSection
              user={user}
              onSave={handleSaveProfile}
              editMode={editMode}
            />
          </div>

          {/* Currency settings */}
          <div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">Currency</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred currency for displaying amounts
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50"
                >
                  {currencyCode}
                </Badge>
              </div>

              {/* Transaction Example Card - Selalu tampil */}
              <div className="flex justify-center w-full my-6">
                <CurrencyExampleCard />
              </div>

              <CurrencyOptionsGrid 
                options={currencyOptions}
                currentCode={currencyCode}
                onChange={handleCurrencyChange}
                isLoading={isLoadingCurrency}
              />
            </div>
          </div>

          {/* Security Section */}
          <div>
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
          </div>

          {/* Account Management Section */}
          <div>
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
          </div>
        </div>
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
