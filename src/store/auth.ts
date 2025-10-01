import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { directusHelpers, directus, initializeDirectusWithTokens, type User, type Tenant, type Permission } from '@/lib/directus';

// Types for Directus authentication responses
interface DirectusAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires?: number;
  expires_in?: number;
}

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
            // Extract tokens from Directus response
            const loginData = result.data as DirectusAuthResponse;
            const accessToken = loginData.access_token || null;
            const refreshToken = loginData.refresh_token || null;
            
            // Save tokens to store
            set({ accessToken, refreshToken });
            
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
        }
      },

      clearError: () => {
        set({ error: null });
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
      },

      getTokens: () => {
        const { accessToken, refreshToken } = get();
        return { accessToken, refreshToken };
      },

      initializeFromStoredTokens: async () => {
        const { accessToken, refreshToken, isRefreshing } = get();
        
        // Don't initialize if already refreshing or no tokens
        if (isRefreshing || !accessToken || !refreshToken) {
          return;
        }

        try {
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
        } catch (error) {
          console.error('Failed to initialize from stored tokens:', error);
          // Clear invalid tokens
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
      },

      checkAuth: async () => {
        const { isRefreshing, accessToken, refreshToken } = get();
        
        // Prevent multiple simultaneous refresh calls
        if (isRefreshing) {
          return;
        }

        // If we have stored tokens, try to initialize with them first
        if (accessToken && refreshToken) {
          await get().initializeFromStoredTokens();
          return;
        }
        
        set({ isLoading: true, isRefreshing: true });
        
        try {
          // Try to refresh token using Directus SDK (JSON mode)
          const refreshResult = await directus.refresh();
          
          // Extract refreshed tokens
          const refreshData = refreshResult as DirectusAuthResponse;
          const newAccessToken = refreshData.access_token || null;
          const newRefreshToken = refreshData.refresh_token || null;
          
          // Save refreshed tokens to store
          set({ accessToken: newAccessToken, refreshToken: newRefreshToken });
          
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
          // Token refresh failed, clear auth state
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
