import { createDirectus, rest, authentication, readMe } from '@directus/sdk';
import axios from 'axios';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

// Create axios instance for session authentication
export const directusAxios = axios.create({
  baseURL: `${directusUrl}/`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create Directus SDK client
export const directus = createDirectus(directusUrl)
  .with(rest())
  .with(authentication())
  .with(readMe());

// Types for Directus collections
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string;
}

export interface DirectusSchema {
  users: User[];
}

// Authentication functions
export const authApi = {
  // Login with session mode
  async login(email: string, password: string) {
    try {
      const response = await directusAxios.post('/auth/login', {
        email,
        password,
        mode: 'session'
      });
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await directusAxios.get('/users/me');
      return response.data.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      const response = await directusAxios.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      await directusAxios.get('/users/me');
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Generic data fetching functions
export const dataApi = {
  // Get items from a collection
  async getItems(collection: string, params?: any, cookies?: string) {
    try {
      // Convert params to Directus format
      const directusParams: any = {};
      
      if (params) {
        if (params.limit) directusParams.limit = params.limit;
        if (params.offset) directusParams.offset = params.offset;
        if (params.page) directusParams.page = params.page;
        if (params.search) directusParams.search = params.search;
        
        // Handle fields array - keep as array for Directus
        if (params.fields && Array.isArray(params.fields)) {
          directusParams.fields = params.fields;
        }
        
        // Handle sort array - keep as array for Directus
        if (params.sort && Array.isArray(params.sort)) {
          directusParams.sort = params.sort;
        }
        
        // Handle filters
        if (params.filter) {
          Object.entries(params.filter).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              Object.entries(value).forEach(([operator, operatorValue]) => {
                directusParams[`filter[${key}][${operator}]`] = operatorValue;
              });
            } else {
              directusParams[`filter[${key}]`] = value;
            }
          });
        }
      }
      
      // Prepare request options with cookies if provided
      const requestOptions: any = { params: directusParams };
      if (cookies) {
        requestOptions.headers = { 'Cookie': cookies };
      }
      
      const response = await directusAxios.get(`/items/${collection}`, requestOptions);
      return response.data;
    } catch (error) {
      console.error(`Get ${collection} error:`, error);
      throw error;
    }
  },

  // Get single item
  async getItem(collection: string, id: string, params?: any, cookies?: string) {
    try {
      const requestOptions: any = { params };
      if (cookies) {
        requestOptions.headers = { 'Cookie': cookies };
      }
      const response = await directusAxios.get(`/items/${collection}/${id}`, requestOptions);
      return response.data.data;
    } catch (error) {
      console.error(`Get ${collection}/${id} error:`, error);
      throw error;
    }
  },

  // Create item
  async createItem(collection: string, data: any, cookies?: string) {
    try {
      const requestOptions: any = {};
      if (cookies) {
        requestOptions.headers = { 'Cookie': cookies };
      }
      const response = await directusAxios.post(`/items/${collection}`, data, requestOptions);
      return response.data.data;
    } catch (error) {
      console.error(`Create ${collection} error:`, error);
      throw error;
    }
  },

  // Update item
  async updateItem(collection: string, id: string, data: any, cookies?: string) {
    try {
      const requestOptions: any = {};
      if (cookies) {
        requestOptions.headers = { 'Cookie': cookies };
      }
      const response = await directusAxios.patch(`/items/${collection}/${id}`, data, requestOptions);
      return response.data.data;
    } catch (error) {
      console.error(`Update ${collection}/${id} error:`, error);
      throw error;
    }
  },

  // Delete item
  async deleteItem(collection: string, id: string, cookies?: string) {
    try {
      const requestOptions: any = {};
      if (cookies) {
        requestOptions.headers = { 'Cookie': cookies };
      }
      const response = await directusAxios.delete(`/items/${collection}/${id}`, requestOptions);
      return response.data;
    } catch (error) {
      console.error(`Delete ${collection}/${id} error:`, error);
      throw error;
    }
  }
};
