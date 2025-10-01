import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { directusHelpers, directus, type User, type Tenant, type Permission } from '@/lib/directus';

interface AuthState {
  user: User | null;
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  permissions: Permission;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  setSelectedTenant: (tenant: Tenant | null) => void;
  loadPermissions: () => Promise<void>;
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

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await directusHelpers.login(email, password);
          
          if (result.success) {
            // Ensure tokens exist in JSON mode and fetch current user
            
            // Get current user info with tenants after successful login
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

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Try to refresh token using Directus SDK (JSON mode)
          await directus.refresh();
          
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
      }),
    }
  )
);
