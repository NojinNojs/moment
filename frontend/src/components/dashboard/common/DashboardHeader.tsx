import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGetUserInitials } from '@/hooks/useGetUserInitials';
import { useAuth } from '@/contexts/auth-utils';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * DashboardHeader - A enhanced header component for dashboard pages
 * Features:
 * - Page title with optional description
 * - Optional icon display
 * - Consistent styling across dashboard
 * - Better typography and spacing
 */
export const DashboardHeader = ({
  title,
  description,
  icon,
  className
}: DashboardHeaderProps) => {
  const { user } = useAuth();
  const userInitials = useGetUserInitials();
  
  return (
    <div className={cn("mb-8 flex items-start", className)}>
      {icon && (
        <div className="mr-4 mt-1">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1.5 text-base">
            {description || `Welcome back, ${user?.name || userInitials}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader; 