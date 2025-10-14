'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import type { User, Tenant } from '@/lib/directus';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
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
  // Check auth for ALL routes to ensure proper redirect behavior
  useEffect(() => {
    console.log('[AuthContext] Init check - hasInitialized:', hasInitializedRef.current);
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log('[AuthContext] Starting checkAuth...');
      checkAuth().finally(() => {
        // Mark auth check as completed regardless of success/failure
        // The auth state will handle redirects based on isAuthenticated flag
        hasCheckedAuthRef.current = true;
        console.log('[AuthContext] checkAuth completed');
      });
    }
  }, [checkAuth]);

  // Handle authentication state - only redirect after initial auth check is done
  useEffect(() => {
    // Don't redirect if:
    // 1. Still loading/refreshing
    // 2. Haven't completed initial auth check yet (avoid race condition with stale isAuthenticated)
    if (isLoading || isRefreshing || !hasCheckedAuthRef.current) {
      return;
    }
    
    // Redirect logic based on authentication state and current page
    if (isAuthenticated && isLoginPage) {
      // If authenticated and on login page, redirect to events
      console.log('[AuthContext] Authenticated user on login page, redirecting to /events');
      router.replace('/events');
    } else if (!isAuthenticated && !isLoginPage) {
      // If not authenticated and not on login page, redirect to login
      console.log('[AuthContext] Unauthenticated user on protected route, redirecting to /login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isRefreshing, isLoginPage, router]);

  // Handle tenant changes
  const handleTenantChange = useCallback((tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    router.push('/events');
  }, [setSelectedTenant, router]);

  // Log state only on key changes (not every render)
  useEffect(() => {
    if (hasCheckedAuthRef.current) {
      console.log('[AuthContext] Auth state updated:', { 
        isAuthenticated, 
        isLoading, 
        user: user?.email,
        selectedTenant: selectedTenant?.name
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user?.email, selectedTenant?.id]);

  const contextValue: AuthContextType = {
    // Authentication state
    isAuthenticated,
    isLoading,
    isRefreshing,
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

  // No loading screen here - AppLayout handles all loading states
  // This prevents multiple loading screens from appearing

  return (
    <AuthContext.Provider value={contextValue}>
      {/* <ReloadHandler> */}
        {children}
      {/* </ReloadHandler> */}
    </AuthContext.Provider>
  );
}
