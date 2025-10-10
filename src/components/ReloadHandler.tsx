'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface ReloadHandlerProps {
  children: React.ReactNode;
}

export function ReloadHandler({ children }: ReloadHandlerProps) {
  const pathname = usePathname();
  const { isLoading, isRefreshing } = useAuthStore();
  const isLoginPage = pathname === '/login';

  // Don't show loading overlay on login page or if not loading
  const showLoading = (isLoading || isRefreshing) && !isLoginPage;

  return (
    <>
      {children}
      {showLoading && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-content-secondary text-lg">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
}
