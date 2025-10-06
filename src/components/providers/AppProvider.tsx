'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { queryClient } from '@/lib/queryClient';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const pathname = usePathname();

  // Check if the current route should use the app layout (dashboard routes)
  const shouldUseAppLayout = pathname.startsWith('/dashboard') || 
                            pathname.startsWith('/events') ||
                            pathname.startsWith('/workspace') || 
                            pathname.startsWith('/matching');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {shouldUseAppLayout ? (
          <AppLayout>
            {children}
          </AppLayout>
        ) : (
          children
        )}
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
