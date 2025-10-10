'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { ReloadHandler } from '@/components/ReloadHandler';
import type { User, Tenant } from '@/lib/directus';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Tenant management
  setSelectedTenant: (tenant: Tenant | null) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isLoading,
    user,
    tenants,
    selectedTenant,
    error,
    login,
    logout,
    checkAuth,
    setSelectedTenant,
    clearError,
  } = useAuthStore();

  const hasInitializedRef = useRef(false);
  const isLoginPage = pathname === '/login';

  // Initialize authentication on mount - ONLY ONCE
  useEffect(() => {
    if (!hasInitializedRef.current && !isLoginPage) {
      hasInitializedRef.current = true;
      checkAuth();
    }
  }, [checkAuth, isLoginPage]);

  // Handle authentication state - only redirect when needed
  useEffect(() => {
    // Don't redirect if still loading or already on login page
    if (isLoading || isLoginPage) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Handle tenant changes
  const handleTenantChange = useCallback((tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    router.push('/events');
  }, [setSelectedTenant, router]);

  const contextValue: AuthContextType = {
    // Authentication state
    isAuthenticated,
    isLoading,
    user,
    tenants,
    selectedTenant,
    
    // Authentication actions
    login,
    logout,
    
    // Tenant management
    setSelectedTenant: handleTenantChange,
    
    // Error handling
    error,
    clearError,
  };

  // Show loading screen with white background
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <ReloadHandler>
        {children}
      </ReloadHandler>
    </AuthContext.Provider>
  );
}
