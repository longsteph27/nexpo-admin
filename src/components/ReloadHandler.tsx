'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';

interface ReloadHandlerProps {
  children: React.ReactNode;
}

export function ReloadHandler({ children }: ReloadHandlerProps) {
  const { isLoading, isRefreshing } = useAuthStore();

  // Show loading only during authentication process
  const showLoading = isLoading || isRefreshing;

  return (
    <>
      {children}
      {showLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Authenticating...</span>
          </div>
        </div>
      )}
    </>
  );
}
