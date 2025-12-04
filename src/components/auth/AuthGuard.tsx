'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@iconify/react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isRefreshing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if auth check is complete
  useEffect(() => {
    if (!isLoading && !isRefreshing) {
      setHasCheckedAuth(true);
    }
  }, [isLoading, isRefreshing]);

  // Handle authentication redirects
  useEffect(() => {
    // Only run redirect after auth check is complete
    if (!hasCheckedAuth || isLoading || isRefreshing) {
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      // Authenticated user on login page, redirect to events
      router.replace('/events');
    } else if (!isAuthenticated && !isPublicRoute) {
      // Unauthenticated user on protected route, redirect to login
      router.replace('/login');
    }
  }, [hasCheckedAuth, isLoading, isRefreshing, isAuthenticated, isPublicRoute, router, pathname]);

  // Show loading screen during auth check
  if (!hasCheckedAuth || isLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Show loading during redirect to prevent flash of wrong content
  if ((isAuthenticated && isPublicRoute) || (!isAuthenticated && !isPublicRoute)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated or on public route
  return <>{children}</>;
}
