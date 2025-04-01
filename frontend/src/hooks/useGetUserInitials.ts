import { useAuth } from '@/contexts/auth-utils';

/**
 * Hook to get user initials from user's name
 * @returns String of user initials or default placeholder
 */
export const useGetUserInitials = (): string => {
  const { user } = useAuth();
  
  if (!user || !user.name) {
    return 'U';
  }
  
  // Split name and get initials from first and last parts
  const nameParts = user.name.split(' ');
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  const firstInitial = nameParts[0].charAt(0);
  const lastInitial = nameParts[nameParts.length - 1].charAt(0);
  
  return `${firstInitial}${lastInitial}`.toUpperCase();
}; 