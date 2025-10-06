'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  checkAuth: () => Promise<void>;
  checkAuthOnReload: () => Promise<void>;
  
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
    checkAuthOnReload,
    setSelectedTenant,
    clearError,
  } = useAuthStore();

  const hasInitializedRef = useRef(false);

  // Initialize authentication on mount - ONLY ONCE
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Always call checkAuth - it will handle reload detection internally
      console.log('🔄 Initializing authentication...');
      checkAuth();
    }
  }, [checkAuth]);

  // Handle browser refresh/reload events (no additional checkAuth calls)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Browser refresh/reload detected');
    };

    // Listen for page refresh/reload (no additional auth checks)
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle authentication state changes - only redirect to login if not loading and not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only redirect to login if we're not on the login page
      if (window.location.pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle tenant changes
  const handleTenantChange = useCallback((tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    // Redirect to home admin when tenant changes
    router.push('/');
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
    checkAuth,
    checkAuthOnReload,
    
    // Tenant management
    setSelectedTenant: handleTenantChange,
    
    // Error handling
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <ReloadHandler>
        {children}
      </ReloadHandler>
    </AuthContext.Provider>
  );
}


// Hook for authentication state
export function useAuthState() {
  const { isAuthenticated, isLoading, user, tenants, selectedTenant, error } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    tenants,
    selectedTenant,
    error,
  };
}

// Hook for authentication actions
export function useAuthActions() {
  const { login, logout, checkAuth, checkAuthOnReload, clearError } = useAuth();
  
  return {
    login,
    logout,
    checkAuth,
    checkAuthOnReload,
    clearError,
  };
}
