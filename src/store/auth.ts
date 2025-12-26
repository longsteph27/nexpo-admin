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

          if (!result.success) {
            set({ isLoading: false, error: result.error || 'Login failed' });
            return false;
          }

          // Handle tokens based on auth mode
          if (!IS_SESSION_MODE) {
            const loginData = result.data as DirectusAuthResponse;
            get().setTokens(loginData.access_token || null, loginData.refresh_token || null);
          }

          // Get user info and permissions in parallel
          const [userResult, permissionsResult] = await Promise.all([
            directusHelpers.getCurrentUser(),
            directusHelpers.getUserPermissions()
          ]);

          if (!userResult.success || !userResult.data) {
            set({ isLoading: false, error: userResult.error || 'Failed to get user info' });
            return false;
          }

          const user = userResult.data;
          const tenants = user?.tenants ? user.tenants.map(t => t.tenants_id) : [];
          const firstTenant = tenants[0] || null;
          const permissions = permissionsResult.success ? permissionsResult.data : {};

          set({
            user: user as User,
            tenants,
            selectedTenant: firstTenant,
            permissions,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: errorMessage });
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
          error: null,
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
        const { isRefreshing, refreshToken } = get();

        console.log('[Auth Store] checkAuth called - IS_SESSION_MODE:', IS_SESSION_MODE, 'refreshToken:', !!refreshToken);

        // Prevent multiple simultaneous calls
        if (isRefreshing) {
          console.log('[Auth Store] Already refreshing, skipping...');
          return;
        }

        if (IS_SESSION_MODE) {
          // Session mode: validate session via getCurrentUser
          console.log('[Auth Store] Session mode - checking session...');
          set({ isLoading: true, isRefreshing: true });

          try {
            const userResult = await directusHelpers.getCurrentUser();
            console.log('[Auth Store] getCurrentUser result:', userResult);

            if (userResult.success && userResult.data) {
              const user = userResult.data;
              const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
              const { selectedTenant } = get();
              const validTenant = tenants.find(t => t.id === selectedTenant?.id) || tenants[0] || null;

              console.log('[Auth Store] Setting authenticated state - tenants:', tenants.length, 'selectedTenant:', validTenant?.id);

              set({
                user: user as User,
                tenants,
                selectedTenant: validTenant,
                isAuthenticated: true,
                isLoading: false,
                isRefreshing: false,
              });
            } else {
              console.log('[Auth Store] getCurrentUser failed, clearing auth data');
              get().clearAuthData();
            }
          } catch (error) {
            console.error('[Auth Store] Session check error:', error);
            get().clearAuthData();
          }
          return;
        }

        // JSON mode: refresh token and get user
        if (!refreshToken) {
          console.log('[Auth Store] No refresh token available - clearing auth');
          get().clearAuthData();
          return;
        }

        console.log('[Auth Store] JSON mode - refreshing token...');

        set({ isLoading: true, isRefreshing: true });

        try {
          // Step 1: Refresh the access token
          const refreshResult = await refreshWithToken(refreshToken);
          const refreshData = refreshResult as DirectusAuthResponse;
          const newAccessToken = refreshData.access_token || null;
          const newRefreshToken = refreshData.refresh_token || null;

          console.log('[Auth Store] Token refreshed successfully');

          // Step 2: Update tokens in store and directus client
          get().setTokens(newAccessToken, newRefreshToken);

          if (newAccessToken) {
            await directus.setToken(newAccessToken);
          }

          // Step 3: Fetch user info with new token
          const userResult = await directusHelpers.getCurrentUser();

          if (userResult.success && userResult.data) {
            const user = userResult.data;
            const tenants = user.tenants ? user.tenants.map(t => t.tenants_id) : [];
            const { selectedTenant } = get();
            const validTenant = tenants.find(t => t.id === selectedTenant?.id) || tenants[0] || null;

            console.log('[Auth Store] Auth restored - user:', user.email, 'tenants:', tenants.length);

            set({
              user: user as User,
              tenants,
              selectedTenant: validTenant,
              isAuthenticated: true,
              isLoading: false,
              isRefreshing: false,
            });
          } else {
            console.log('[Auth Store] Failed to get user info after refresh');
            get().clearAuthData();
          }
        } catch (error) {
          console.error('[Auth Store] Token refresh failed:', error);
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
        // Don't persist isAuthenticated to avoid race condition on page reload
        // It will be set to true after successful checkAuth()
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
