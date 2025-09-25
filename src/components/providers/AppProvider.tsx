'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

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

  if (shouldUseAppLayout) {
    return (
      <AppLayout>
        {children}
      </AppLayout>
    );
  }

  // For login and other non-dashboard pages, render children directly
  return <>{children}</>;
}
