import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { directusHelpers, directus, initializeDirectusWithTokens, refreshWithToken, type User, type Tenant, type Permission } from '@/lib/directus';
import { tokenManager } from '@/lib/tokenManager';

// Types for Directus authentication responses
interface DirectusAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires?: number;
  expires_in?: number;
}

// Environment configuration
const AUTH_MODE = (process.env.NEXT_PUBLIC_DIRECTUS_AUTH_MODE as 'json' | 'session') || 'json';
const IS_SESSION_MODE = AUTH_MODE === 'session';

interface AuthState {
  user: User | null;
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  permissions: Permission;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  checkAuthOnReload: () => Promise<void>;
  setSelectedTenant: (tenant: Tenant | null) => void;
  loadPermissions: () => Promise<void>;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  getTokens: () => { accessToken: string | null; refreshToken: string | null };
  initializeFromStoredTokens: () => Promise<void>;
  clearAuthData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenants: [],
      selectedTenant: null,
      permissions: {},
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isRefreshing: false,
      accessToken: null,
      refreshToken: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await directusHelpers.login(email, password);
          
          if (result.success) {
            // Handle different authentication modes
            if (IS_SESSION_MODE) {
              // In session mode, Directus handles tokens via cookies
              // No need to store tokens in our state
              set({ accessToken: null, refreshToken: null });
            } else {
              // In JSON mode, extract and store tokens
              const loginData = result.data as DirectusAuthResponse;
              const accessToken = loginData.access_token || null;
              const refreshToken = loginData.refresh_token || null;
              
              // Save tokens to store and update token manager
              get().setTokens(accessToken, refreshToken);
            }
            
            // Get current user info with tenants after successful login
            // No need to refresh token as login already provides fresh tokens
            const userResult = await directusHelpers.getCurrentUser();
            
            if (userResult.success) {
              const user = userResult.data;
              const tenants = user?.tenants ? user.tenants.map(t => t.tenants_id) : [];
              const firstTenant = tenants.length > 0 ? tenants[0] : null;
              
              // Load permissions
              const permissionsResult = await directusHelpers.getUserPermissions();
              const permissions = permissionsResult.success ? permissionsResult.data : {};
              
              set({
                user: user as User,
                tenants,
                selectedTenant: firstTenant,
                permissions,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                isRefreshing: false,
              });
              return true;
            } else {
              set({
                isLoading: false,
                error: userResult.error || 'Failed to get user info',
              });
              return false;
            }
          } else {
            set({
              isLoading: false,
              error: result.error || 'Login failed',
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await directusHelpers.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            tenants: [],
            selectedTenant: null,
            permissions: {},
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isRefreshing: false,
            accessToken: null,
            refreshToken: null,
          });
          // Clear token manager
          tokenManager.setAccessToken(null);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Helper function to clear all auth data
      clearAuthData: () => {
        set({
          user: null,
          tenants: [],
          selectedTenant: null,
          permissions: {},
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
          accessToken: null,
          refreshToken: null,
        });
        // Clear token manager
        tokenManager.setAccessToken(null);
      },

      setSelectedTenant: (tenant: Tenant | null) => {
        set({ selectedTenant: tenant });
      },

      loadPermissions: async () => {
        try {
          const permissionsResult = await directusHelpers.getUserPermissions();
          if (permissionsResult.success) {
            set({ permissions: permissionsResult.data });
          }
        } catch (error) {
          console.error('Failed to load permissions:', error);
        }
      },

      setTokens: (accessToken: string | null, refreshToken: string | null) => {
        set({ accessToken, refreshToken });
        // Also update the token manager
        tokenManager.setAccessToken(accessToken);
      },

      getTokens: () => {
        const { accessToken, refreshToken } = get();
        return { accessToken, refreshToken };
      },

      initializeFromStoredTokens: async () => {
        const { accessToken, refreshToken, isRefreshing } = get();
        
        // Don't initialize if already refreshing
        if (isRefreshing) {
          return;
        }

        try {
          if (IS_SESSION_MODE) {
            // In session mode, Directus handles authentication via cookies
            // Just try to get current user to validate session
            const userResult = await directusHelpers.getCurrentUser();
            
            if (userResult.success && userResult.data) {
              const user = userResult.data;
              const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
              const { selectedTenant } = get();
              
              // Keep selected tenant if still valid, otherwise select first
              const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                                 (tenants.length > 0 ? tenants[0] : null);
              
              set({
                user: user as User,
                tenants,
                selectedTenant: validTenant,
                isAuthenticated: true,
                isLoading: false,
                isRefreshing: false,
              });
            } else {
              // Session is invalid, clear auth state
              set({
                user: null,
                tenants: [],
                selectedTenant: null,
                permissions: {},
                isAuthenticated: false,
                isLoading: false,
                isRefreshing: false,
                accessToken: null,
                refreshToken: null,
              });
            }
          } else {
            // In JSON mode, use stored tokens
            if (!accessToken || !refreshToken) {
              return;
            }

            // Initialize Directus with stored tokens
            const initialized = await initializeDirectusWithTokens(accessToken, refreshToken);
            
            if (initialized) {
              // Try to get current user to validate tokens
              const userResult = await directusHelpers.getCurrentUser();
              
              if (userResult.success && userResult.data) {
                const user = userResult.data;
                const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
                const { selectedTenant } = get();
                
                // Keep selected tenant if still valid, otherwise select first
                const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                                   (tenants.length > 0 ? tenants[0] : null);
                
                set({
                  user: user as User,
                  tenants,
                  selectedTenant: validTenant,
                  isAuthenticated: true,
                  isLoading: false,
                  isRefreshing: false,
                });
              } else {
                // Tokens are invalid, clear auth state
                set({
                  user: null,
                  tenants: [],
                  selectedTenant: null,
                  permissions: {},
                  isAuthenticated: false,
                  isLoading: false,
                  isRefreshing: false,
                  accessToken: null,
                  refreshToken: null,
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to initialize from stored tokens:', error);
              // Clear invalid tokens
              get().clearAuthData();
        }
      },

      checkAuth: async () => {
        const { isRefreshing, accessToken, refreshToken } = get();
        
        // Prevent multiple simultaneous refresh calls
        if (isRefreshing) {
          return;
        }

        // Check if this is a page reload
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const isReload = (performance.navigation as { type?: number })?.type === 1 || 
                         (navigationEntries[0] as { type?: string })?.type === 'reload';

        if (IS_SESSION_MODE) {
          // In session mode, just try to get current user
          // Directus SDK handles session refresh automatically
          set({ isLoading: true, isRefreshing: true });
          
          try {
            const userResult = await directusHelpers.getCurrentUser();
            
            if (userResult.success && userResult.data) {
              const user = userResult.data;
              const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
              const { selectedTenant } = get();
              
              // Keep selected tenant if still valid, otherwise select first
              const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                                 (tenants.length > 0 ? tenants[0] : null);
              
              set({
                user: user as User,
                tenants,
                selectedTenant: validTenant,
                isAuthenticated: true,
                isLoading: false,
                isRefreshing: false,
              });
            } else {
              // No valid user, clear auth state
              set({
                user: null,
                tenants: [],
                selectedTenant: null,
                permissions: {},
                isAuthenticated: false,
                isLoading: false,
                isRefreshing: false,
                accessToken: null,
                refreshToken: null,
              });
            }
          } catch {
            // Session check failed, clear auth state
            set({
              user: null,
              tenants: [],
              selectedTenant: null,
              permissions: {},
              isAuthenticated: false,
              isLoading: false,
              isRefreshing: false,
              accessToken: null,
              refreshToken: null,
            });
          }
        } else {
          // JSON mode - check if we have tokens
          if (!refreshToken) {
            // No refresh token, clear auth state and let AuthContext redirect to login
            get().clearAuthData();
            return;
          }

          // On reload, always call refresh API first
          if (isReload) {
            set({ isLoading: true, isRefreshing: true });
            
            try {
              console.log('🔄 Page reload detected, refreshing token...');
              
              // Use refresh token to get new access token
              const refreshResult = await refreshWithToken(refreshToken);
              
              // Extract refreshed tokens
              const refreshData = refreshResult as DirectusAuthResponse;
              const newAccessToken = refreshData.access_token || null;
              const newRefreshToken = refreshData.refresh_token || null;
              
              // Save refreshed tokens to store and update token manager
              get().setTokens(newAccessToken, newRefreshToken);
              console.log('🔑 Tokens updated in store and token manager');
              
              // Set the new access token in Directus client
              if (newAccessToken) {
                await directus.setToken(newAccessToken);
                console.log('✅ Directus client token updated');
                
                // Verify token is set correctly
                const currentToken = await directus.getToken();
                console.log('🔍 Current Directus token:', currentToken ? currentToken.substring(0, 20) + '...' : 'null');
              }
              
              // If refresh succeeds, get current user
              const userResult = await directusHelpers.getCurrentUser();
              
              if (userResult.success && userResult.data) {
                const user = userResult.data;
                const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
                const { selectedTenant } = get();
                
                // Keep selected tenant if still valid, otherwise select first
                const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                                   (tenants.length > 0 ? tenants[0] : null);
                
                console.log('✅ Authentication successful after reload');
                set({
                  user: user as User,
                  tenants,
                  selectedTenant: validTenant,
                  isAuthenticated: true,
                  isLoading: false,
                  isRefreshing: false,
                });
              } else {
                console.log('❌ No valid user after refresh, clearing auth state');
                get().clearAuthData();
              }
            } catch (error) {
              console.log('❌ Refresh failed, clearing auth state:', error);
              get().clearAuthData();
            }
            return;
          }

          // For non-reload cases, try stored tokens first
          if (accessToken && refreshToken) {
            await get().initializeFromStoredTokens();
            return;
          }
          
          set({ isLoading: true, isRefreshing: true });
          
          try {
            // Use refresh token to get new access token
            const refreshResult = await refreshWithToken(refreshToken);
            
            // Extract refreshed tokens
            const refreshData = refreshResult as DirectusAuthResponse;
            console.log('refreshData', refreshData);
            const newAccessToken = refreshData.access_token || null;
            const newRefreshToken = refreshData.refresh_token || null;
            
            // Save refreshed tokens to store and update token manager
            get().setTokens(newAccessToken, newRefreshToken);
            console.log('🔑 Tokens updated in store and token manager');
            
            // Set the new access token in Directus client
            if (newAccessToken) {
              await directus.setToken(newAccessToken);
              console.log('✅ Directus client token updated');
              
              // Verify token is set correctly
              const currentToken = await directus.getToken();
              console.log('🔍 Current Directus token:', currentToken ? currentToken.substring(0, 20) + '...' : 'null');
            }
            
            // If refresh succeeds, get current user
            const userResult = await directusHelpers.getCurrentUser();
            
            if (userResult.success && userResult.data) {
              const user = userResult.data;
              const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
              const { selectedTenant } = get();
              
              // Keep selected tenant if still valid, otherwise select first
              const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                                 (tenants.length > 0 ? tenants[0] : null);
              
              set({
                user: user as User,
                tenants,
                selectedTenant: validTenant,
                isAuthenticated: true,
                isLoading: false,
                isRefreshing: false,
              });
            } else {
              // No valid user, clear auth state
              get().clearAuthData();
            }
          } catch {
            // Token refresh failed, clear auth state
            get().clearAuthData();
          }
        }
      },

      // Method to handle reload/refresh with refresh token priority
      checkAuthOnReload: async () => {
        const { isRefreshing, refreshToken } = get();
        
        // Prevent multiple simultaneous refresh calls
        if (isRefreshing) {
          return;
        }

        // Check if we have refresh token
        if (!refreshToken) {
          console.log('❌ No refresh token found, clearing auth state');
          get().clearAuthData();
          return;
        }

        set({ isLoading: true, isRefreshing: true });
        
        try {
          console.log('🔄 Using refresh token to get new access token...');
          
          // Use refresh token to get new access token
          const refreshResult = await refreshWithToken(refreshToken);
          
          // Extract refreshed tokens
          const refreshData = refreshResult as DirectusAuthResponse;
          const newAccessToken = refreshData.access_token || null;
          const newRefreshToken = refreshData.refresh_token || null;
          
          // Save refreshed tokens to store and update token manager
          get().setTokens(newAccessToken, newRefreshToken);
          console.log('🔑 Tokens updated in store and token manager');
          
          // Set the new access token in Directus client
          if (newAccessToken) {
            await directus.setToken(newAccessToken);
            console.log('✅ Directus client token updated');
            
            // Verify token is set correctly
            const currentToken = await directus.getToken();
            console.log('🔍 Current Directus token:', currentToken ? currentToken.substring(0, 20) + '...' : 'null');
          }
          
          // If refresh succeeds, get current user
          const userResult = await directusHelpers.getCurrentUser();
          
          if (userResult.success && userResult.data) {
            const user = userResult.data;
            const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
            const { selectedTenant } = get();
            
            // Keep selected tenant if still valid, otherwise select first
            const validTenant = tenants.find(t => t.id === selectedTenant?.id) || 
                               (tenants.length > 0 ? tenants[0] : null);
            
            console.log('✅ Authentication successful after reload');
            set({
              user: user as User,
              tenants,
              selectedTenant: validTenant,
              isAuthenticated: true,
              isLoading: false,
              isRefreshing: false,
            });
          } else {
            console.log('❌ No valid user after refresh, clearing auth state');
            get().clearAuthData();
          }
        } catch (error) {
          console.log('❌ Refresh failed, clearing auth state:', error);
          get().clearAuthData();
        }
      },
    }),
    {
      name: 'nexpo-auth-storage',
      partialize: (state) => ({
        user: state.user,
        tenants: state.tenants,
        selectedTenant: state.selectedTenant,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
