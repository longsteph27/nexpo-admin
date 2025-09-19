'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute - useEffect triggered:', { isLoading, isAuthenticated, pathname: window.location.pathname });
    if (!isLoading && !isAuthenticated) {
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        console.log('ProtectedRoute - Redirecting to login page');
        router.push('/');
      } else {
        console.log('ProtectedRoute - Already on login page, no redirect needed');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexpo-blue mx-auto mb-4"></div>
          <p className="text-nexpo-gray">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
