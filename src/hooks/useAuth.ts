import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  permissions: () => [...authKeys.all, 'permissions'] as const,
};

// Get current user hook
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.getCurrentUser(),
    select: (data) => data.data,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get user permissions hook
export function useUserPermissions() {
  return useQuery({
    queryKey: authKeys.permissions(),
    queryFn: () => authApi.getUserPermissions(),
    select: (data) => data.data || {},
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      authApi.login(email, password),
    onSuccess: () => {
      // Invalidate user and permissions queries
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.invalidateQueries({ queryKey: authKeys.permissions() });
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
}

// Refresh token mutation
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (refreshToken: string) => authApi.refresh(refreshToken),
    onSuccess: async (data, refreshToken) => {
      // Update tokens in the auth store
      const { setTokens } = useAuthStore.getState();
      const accessToken = data.data?.access_token || null;
      const newRefreshToken = data.data?.refresh_token || refreshToken;
      
      setTokens(accessToken, newRefreshToken);
      
      // Fetch user data with new token
      try {
        const userResult = await authApi.getCurrentUser();
        if (userResult.success && userResult.data) {
          // Update auth store with user data and set authenticated
          useAuthStore.setState({ 
            user: userResult.data, 
            isLoading: false, 
            isAuthenticated: true 
          });
          console.log('✅ User data loaded after refresh');
        }
      } catch (error) {
        console.error('❌ Failed to load user data after refresh:', error);
        // Set authenticated to true even if user fetch fails
        useAuthStore.setState({ isLoading: false, isAuthenticated: true });
      }
      
      // Invalidate user and permissions queries to refetch with new token
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
      queryClient.invalidateQueries({ queryKey: authKeys.permissions() });
      
      console.log('✅ Tokens updated successfully');
    },
    onError: (error) => {
      console.error('❌ Token refresh failed:', error);
      // Clear tokens on failure
      const { clearAuthData } = useAuthStore.getState();
      clearAuthData();
    },
  });
}
