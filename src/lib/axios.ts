import axios from 'axios';
import { tokenManager } from './tokenManager';

// Environment configuration
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
const AUTH_MODE = (process.env.NEXT_PUBLIC_DIRECTUS_AUTH_MODE as 'json' | 'session') || 'json';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: DIRECTUS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: AUTH_MODE === 'session', // Include cookies for session mode
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from token manager for JSON mode
    if (AUTH_MODE === 'json') {
      const token = tokenManager.getBestAvailableToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Adding token to request:', token.substring(0, 20) + '...');
      } else {
        console.log('❌ No token available for request');
        console.log('🔍 Token manager state:', {
          currentToken: tokenManager.getAccessToken() ? tokenManager.getAccessToken()!.substring(0, 20) + '...' : 'null',
          storageToken: tokenManager.getTokenFromStorage() ? tokenManager.getTokenFromStorage()!.substring(0, 20) + '...' : 'null'
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔄 401 error detected, attempting token refresh...');
      // Token expired, try to refresh
      try {
        const token = localStorage.getItem('nexpo-auth-storage');
        if (token) {
          const authData = JSON.parse(token);
          if (authData.state?.refreshToken) {
            // Use authAxiosInstance for refresh to avoid Authorization header
            const refreshResponse = await axios.post(`${DIRECTUS_URL}/auth/refresh`, {
              refresh_token: authData.state.refreshToken
            });

            if (refreshResponse.data?.access_token) {
              // Update token in token manager
              tokenManager.setAccessToken(refreshResponse.data.access_token);

              // Update token in localStorage
              const updatedAuthData = {
                ...authData,
                state: {
                  ...authData.state,
                  accessToken: refreshResponse.data.access_token,
                  refreshToken: refreshResponse.data.refresh_token || authData.state.refreshToken,
                }
              };
              localStorage.setItem('nexpo-auth-storage', JSON.stringify(updatedAuthData));

              // Retry original request with new token
              error.config.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
              console.log('✅ Token refreshed, retrying request...');
              return axiosInstance(error.config);
            }
          }
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Clear token from manager
        tokenManager.setAccessToken(null);
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
