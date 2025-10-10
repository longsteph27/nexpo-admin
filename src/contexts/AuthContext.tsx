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
    isRefreshing,
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
  const hasCheckedAuthRef = useRef(false);
  const isLoginPage = pathname === '/login';

  // Initialize authentication on mount - ONLY ONCE
  useEffect(() => {
    console.log('[AuthContext] Init check - isLoginPage:', isLoginPage, 'hasInitialized:', hasInitializedRef.current);
    if (!hasInitializedRef.current && !isLoginPage) {
      hasInitializedRef.current = true;
      console.log('[AuthContext] Starting checkAuth...');
      checkAuth().then(() => {
        hasCheckedAuthRef.current = true;
        console.log('[AuthContext] checkAuth completed');
      });
    }
  }, [checkAuth, isLoginPage]);

  // Handle authentication state - only redirect after initial auth check is done
  useEffect(() => {
    // Don't redirect if:
    // 1. Still loading/refreshing
    // 2. Already on login page
    // 3. Haven't completed initial auth check yet (avoid race condition with stale isAuthenticated)
    if (isLoading || isRefreshing || isLoginPage || !hasCheckedAuthRef.current) {
      return;
    }
    
    // Only redirect to login if not authenticated after auth check is complete
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isRefreshing, isLoginPage, router]);

  // Handle tenant changes
  const handleTenantChange = useCallback((tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    router.push('/events');
  }, [setSelectedTenant, router]);

  console.log('[AuthContext] State:', { 
    isAuthenticated, 
    isLoading, 
    isRefreshing,
    hasCheckedAuth: hasCheckedAuthRef.current,
    user: user?.email,
    selectedTenant: selectedTenant?.id,
    tenantsCount: tenants.length
  });

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

  // Show loading screen only during initial auth check
  if ((isLoading || isRefreshing) && !isLoginPage && !hasCheckedAuthRef.current) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-content-secondary text-lg">Loading...</p>
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
