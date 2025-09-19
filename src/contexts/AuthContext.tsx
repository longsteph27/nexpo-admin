'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User } from '@/lib/directus';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext - Checking authentication...');
      
      // Use our API route that calls Directus /user/me
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('AuthContext - No valid session found');
          setUser(null);
          setIsAuthenticated(false);
          // Don't redirect here - let the page handle it
          return;
        }
        throw new Error('Authentication check failed');
      }

      const data = await response.json();
      console.log('AuthContext - User data:', data.data);
      setUser(data.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('AuthContext - Authentication failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Use the new API route instead of direct Directus call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Check auth to get user data
      await checkAuth();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to clear cookies manually
  const clearCookies = () => {
    const cookiesToClear = [
      'directus_session_token',
      'directus_refresh_token',
      'directus_access_token',
      'session',
      'auth_token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear any local storage/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies manually as backup
      clearCookies();
      
      // Use the new API route instead of direct Directus call
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Always proceed with logout regardless of response
      console.log('Logout API called');
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      // Force redirect to login screen
      window.location.replace('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear local state even on error
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear storage on error too
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies manually on error
      clearCookies();
      
      // Force redirect to login screen even if logout API fails
      window.location.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthContext - Initializing, calling checkAuth...');
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
