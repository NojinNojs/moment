import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-utils';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Komponen untuk halaman yang memerlukan autentikasi
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Ketika masih loading, bisa tampilkan loading spinner
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Jika tidak terotentikasi, redirect ke login dengan menyimpan intended URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Jika sudah terotentikasi, tampilkan konten
  return <>{children}</>;
}

// Komponen untuk halaman yang hanya bisa diakses oleh user yang belum login
export function AuthRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Ketika masih loading, bisa tampilkan loading spinner
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Jika sudah terotentikasi, redirect ke dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika belum terotentikasi, tampilkan konten
  return <>{children}</>;
} 