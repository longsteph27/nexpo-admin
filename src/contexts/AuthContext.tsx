'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import type { User, Tenant } from '@/lib/directus';
import { useAppContextStore } from '@/store/appContext';

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

  // Initialize authentication on mount - ONLY ONCE
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log('[AuthContext] Starting checkAuth...');
      checkAuth();
    }
  }, [checkAuth]);

  // Keep tenantId in app context store in sync
  const { setTenantId } = useAppContextStore();
  useEffect(() => {
    setTenantId(selectedTenant?.id ?? null);
  }, [selectedTenant, setTenantId]);

  // Handle tenant changes
  const handleTenantChange = useCallback((tenant: Tenant | null) => {
    setSelectedTenant(tenant);
  }, [setSelectedTenant]);

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
