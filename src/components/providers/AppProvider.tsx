'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { queryClient } from '@/lib/queryClient';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if the current route should use the app layout (all protected routes)
  const shouldUseAppLayout = !isPublicRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          {shouldUseAppLayout ? (
            <AppLayout>
              {children}
            </AppLayout>
          ) : (
            children
          )}
        </AuthGuard>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
