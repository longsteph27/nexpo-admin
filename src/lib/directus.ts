import { createDirectus, rest, authentication, readItems, readMe, createItem, updateItem, deleteItem } from '@directus/sdk';

// Environment configuration (must be defined early for use in interceptor)
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

// Token refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Queue for pending requests during token refresh
let requestQueue: Array<(token: string | null) => void> = [];

// Process the queue after token refresh
const processQueue = (token: string | null) => {
  requestQueue.forEach(callback => callback(token));
  requestQueue = [];
};

// Custom fetch wrapper with 401 interceptor
const createAuthenticatedFetch = () => {
  return async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
    // Make the initial request
    const response = await fetch(url, options);
    
    // If not 401, return the response as is
    if (response.status !== 401) {
      return response;
    }
    
    console.log('[Directus Interceptor] 401 detected, attempting token refresh...');
    
    // Handle 401 - need to refresh token
    // Get the refresh token from storage
    const getRefreshTokenFromStorage = (): string | null => {
      if (typeof window === 'undefined') return null;
      
      try {
        const authStorage = localStorage.getItem('nexpo-auth-storage');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          return authData.state?.refreshToken || null;
        }
      } catch (error) {
        console.error('[Directus Interceptor] Failed to get refresh token from storage:', error);
      }
      return null;
    };
    
    const refreshToken = getRefreshTokenFromStorage();
    
    if (!refreshToken) {
      console.log('[Directus Interceptor] No refresh token available, clearing auth...');
      // No refresh token available, need to logout
      if (typeof window !== 'undefined') {
        // Import auth store dynamically to avoid circular dependency
        import('@/store/auth').then(({ useAuthStore }) => {
          // useAuthStore.getState().clearAuthData();
        });
      }
      return response;
    }
    
    // Wait for any ongoing refresh or start a new one
    let newAccessToken: string | null = null;
    
    if (isRefreshing && refreshPromise) {
      // Wait for the ongoing refresh
      console.log('[Directus Interceptor] Waiting for ongoing refresh...');
      newAccessToken = await refreshPromise;
    } else {
      // Start a new refresh
      isRefreshing = true;
      refreshPromise = new Promise(async (resolve) => {
        try {
          console.log('[Directus Interceptor] Starting token refresh...');
          const refreshResponse = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
            }),
          });
          
          if (!refreshResponse.ok) {
            console.log('[Directus Interceptor] Refresh failed, clearing auth...');
            // Refresh failed, clear auth
            if (typeof window !== 'undefined') {
              import('@/store/auth').then(({ useAuthStore }) => {
                useAuthStore.getState().clearAuthData();
              });
            }
            resolve(null);
            return;
          }
          
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.data?.access_token || null;
          const newRefreshToken = refreshData.data?.refresh_token || null;
          
          console.log('[Directus Interceptor] Token refresh successful');
          
          // Update tokens in store and token manager (without triggering re-render)
          if (typeof window !== 'undefined' && newToken) {
            import('@/store/auth').then(({ useAuthStore }) => {
              useAuthStore.getState().setTokens(newToken, newRefreshToken);
            });
            import('@/lib/tokenManager').then(({ tokenManager }) => {
              tokenManager.setAccessToken(newToken);
            });
          }
          
          resolve(newToken);
        } catch (error) {
          console.error('[Directus Interceptor] Refresh error:', error);
          if (typeof window !== 'undefined') {
            import('@/store/auth').then(({ useAuthStore }) => {
              useAuthStore.getState().clearAuthData();
            });
          }
          resolve(null);
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      });
      
      newAccessToken = await refreshPromise;
    }
    
    // Process the queue
    processQueue(newAccessToken);
    
    if (!newAccessToken) {
      console.log('[Directus Interceptor] No new token available, returning original response');
      return response;
    }
    
    // Retry the original request with the new token
    console.log('[Directus Interceptor] Retrying request with new token...');
    const newHeaders = new Headers(options.headers);
    newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
    
    const retryResponse = await fetch(url, {
      ...options,
      headers: newHeaders,
    });
    
    return retryResponse;
  };
};

// Define your schema types based on the actual Directus schema
interface Tenant {
  id: number;
  name: string;
  email?: string;
  logo?: string;
  folder_files_id?: string;
  settings?: unknown;
  status: 'active' | 'inactive';
  sort?: number;
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

interface Event {
  id?: number;
  tenant_id?: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  sort?: number;
  logo?: string;
  banner?: string;
  user_created?: string;
  tenant?: Tenant;
  forms?: { id: string }[];
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password?: string;
  location?: string;
  title?: string;
  description?: string;
  tags?: string[];
  avatar?: string;
  language?: string;
  theme?: string;
  tfa_secret?: string;
  status: 'active' | 'invited' | 'draft' | 'suspended' | 'archived';
  role?: string;
  token?: string;
  last_access?: string;
  last_page?: string;
  provider?: string;
  external_identifier?: string;
  auth_data?: unknown;
  email_notifications?: boolean;
  tenants?: {
    tenants_id: Tenant;
  }[];
}

interface Site {
  id: number;
  event_id: number;
  slug?: string;
  domain?: string;
  status: 'published' | 'draft' | 'archived';
  sort?: number;
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
  logo?: string;
  favicon?: string;
  tenant_id?: number;
  translations?: SiteTranslation[];
}

interface SiteTranslation {
  id: number;
  sites_id: number;
  languages_code: string;
  description?: string;
  title?: string;
}

interface Registration {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  checkin_status?: boolean;
  date_created?: string;
  date_updated?: string;
  badge_id?: string;
  redeem_id?: string;
  group_id?: string;
  checkin_history?: Array<{ date_time_checkin: string }>;
  event_id?: number;
  tenant_id?: number;
  submissions?: string;
}

interface Page {
  id: string;
  sort?: number;
  status: 'published' | 'draft' | 'archived';
  date_created?: string;
  user_created?: string;
  date_updated?: string;
  user_updated?: string;
  seo?: string;
  site_id?: number;
  tenant_id?: number;
  event_id?: number;
  translations?: PageTranslation[];
}

interface PageTranslation {
  id: number;
  pages_id: string;
  languages_code: string;
  title: string;
  permalink: string;
}

// Permission structure from /permissions/me endpoint
interface Permission {
  [collection: string]: {
    [action: string]: {
      access: 'full' | 'partial' | 'none';
      fields?: string[];
    };
  };
}

interface Schema {
  events: Event[];
  tenants: Tenant[];
  directus_users: User[];
  directus_permissions: Permission[];
  forms: Record<string, unknown>[];
  form_fields: Record<string, unknown>[];
  form_submissions: Record<string, unknown>[];
}

// Additional environment configuration
const AUTH_MODE = (process.env.NEXT_PUBLIC_DIRECTUS_AUTH_MODE as 'json' | 'session') || 'json';
const AUTO_REFRESH = process.env.NEXT_PUBLIC_DIRECTUS_AUTO_REFRESH === 'true';

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Directus Configuration:', {
    url: DIRECTUS_URL,
    authMode: AUTH_MODE,
    autoRefresh: AUTO_REFRESH,
    environment: process.env.NODE_ENV
  });
}

// Create custom fetch with interceptor
const authenticatedFetch = createAuthenticatedFetch();

// Create Directus client with environment-based configuration and custom fetch
const directus = createDirectus<Schema>(DIRECTUS_URL, {
  globals: {
    fetch: authenticatedFetch,
  },
})
  .with(rest())
  .with(authentication(AUTH_MODE, { autoRefresh: AUTO_REFRESH }));

// Helper function to initialize Directus with stored tokens
export const initializeDirectusWithTokens = async (accessToken: string | null, refreshToken: string | null) => {
  if (accessToken && refreshToken) {
    try {
      // Set the tokens in the Directus client
      await directus.setToken(accessToken);
      // Note: Directus SDK handles refresh token internally when autoRefresh is enabled
      // We need to ensure the refresh token is available for the SDK
      return true;
    } catch (error) {
      console.error('Failed to initialize Directus with tokens:', error);
      return false;
    }
  }
  return false;
};

// Helper function to set refresh token for refresh calls
export const setRefreshToken = async (refreshToken: string | null) => {
  if (refreshToken) {
    try {
      // For JSON mode, we need to manually set the refresh token
      // The Directus SDK doesn't expose a direct method to set refresh token
      // We'll need to handle this in the refresh call itself
      return true;
    } catch (error) {
      console.error('Failed to set refresh token:', error);
      return false;
    }
  }
  return false;
};

// Helper function to get current tokens from Directus
export const getDirectusTokens = async () => {
  try {
    const accessToken = await directus.getToken();
    return { accessToken, refreshToken: null }; // Directus SDK doesn't expose refresh token directly
  } catch (error) {
    console.error('Failed to get Directus tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

// Custom refresh function that includes refresh token in payload
export const refreshWithToken = async (refreshToken: string) => {
  try {
    // Make a direct API call to refresh endpoint with refresh token
    const response = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const {data} = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to refresh with token:', error);
    throw error;
  }
};

export { directus };
export type { Event, User, Tenant, Permission, Schema };

// Helper functions for common operations
export const directusHelpers = {
  // Authentication
  async login(email: string, password: string) {
    try {
      const result = await directus.login(email, password);
      return { success: true, data: result };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  async refresh(refreshToken: string) {
    try {
      const result = await refreshWithToken(refreshToken);
      return { success: true, data: result };
    } catch (error) {
      console.error('Refresh error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Refresh failed' };
    }
  },

  // Forms
  async getForm(formId: string) {
    try {
      // Debug: Log formId to check if it's a string or object
      if (typeof formId !== 'string') {
        console.error('[getForm] ERROR: formId is not a string!', { formId, type: typeof formId });
        return { success: false, error: 'Invalid formId: must be a string' };
      }
      
      console.log('[getForm] Fetching form with ID:', formId);
      
      const forms = await directus.request(readItems('forms', {
        filter: { id: { _eq: formId } },
        limit: 1,
        fields: ([
          'id', 'status', 'on_success', 'redirect_url', 'template_email', 'qr_code_field', 'event_id',
          { translations: ['id','languages_code','title','submit_label','success_message'] },
          { fields: [
            'id','name','type','width','sort','is_required','validation','conditions',
            { translations: ['id','languages_code','label','placeholder','help','options'] }
          ]}
        ]) as unknown as never,
      }));
      
      if (!forms || forms.length === 0) {
        return { success: false, error: 'Form not found' };
      }
      
      return { success: true, data: forms[0] };
    } catch (error) {
      console.error('[getForm] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get form' };
    }
  },

  async getFormFields(formId: string) {
    try {
      const fields = await directus.request(readItems('form_fields', {
        filter: { form_id: { _eq: formId } },
        sort: ['sort'],
        fields: ([
          'id','name','type','width','sort','is_required','validation','conditions','form_id',
          { translations: ['id','languages_code','label','placeholder','help','options'] }
        ]) as unknown as never,
      }));
      return { success: true, data: fields };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get form fields' };
    }
  },

  async getFormByEvent(eventId: number | string) {
    try {
      const forms = await directus.request(readItems('forms', {
        filter: { event_id: { _eq: Number(eventId) } },
        limit: 1,
        fields: ([
          'id','event_id','status','on_success','redirect_url','template_email',
          { translations: ['id','languages_code','title','submit_label','success_message'] },
        ]) as unknown as never,
      }));
      return { success: true, data: forms?.[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get form by event' };
    }
  },

  async getAllFormsByEvent(eventId: number | string) {
    try {
      const forms = await directus.request(readItems('forms', {
        filter: { event_id: { _eq: Number(eventId) } },
        fields: ([
          'id','event_id','status','on_success','redirect_url','template_email','is_registration',
          { translations: ['id','languages_code','title','submit_label','success_message'] },
        ]) as unknown as never,
        sort: ['date_created'],
      }));
      return { success: true, data: forms || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get forms by event' };
    }
  },

  async getRegistrationForms(eventId: number, tenantId: number) {
    try {
      const forms = await directus.request(readItems('forms' as never, {
        filter: { 
          event_id: { _eq: eventId },
          tenant_id: { _eq: tenantId },
          is_registration: { _eq: true }
        },
        sort: (['-date_created'] as unknown) as never,
        fields: ([
          'id','status','is_registration','date_created','date_updated',
          { translations: ['languages_code','title','submit_label'] },
          { fields: ['id'] },
          { submissions: ['id'] }
        ] as unknown) as never,
      }));
      return { success: true, data: forms };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get registration forms' };
    }
  },

  async getOtherForms(eventId: number, tenantId: number) {
    try {
      const forms = await directus.request(readItems('forms' as never, {
        filter: { 
          event_id: { _eq: eventId },
          tenant_id: { _eq: tenantId },
          _or: [
            { is_registration: { _eq: false } },
            { is_registration: { _null: true } }
          ]
        },
        sort: (['-date_created'] as unknown) as never,
        fields: ([
          'id','status','is_registration','date_created','date_updated',
          { translations: ['languages_code','title','submit_label'] },
          { fields: ['id'] },
          { submissions: ['id'] }
        ] as unknown) as never,
      }));
      return { success: true, data: forms };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get other forms' };
    }
  },

  // Form CRUD operations
  async createForm(formData: Record<string, unknown>) {
    try {
      const form = await directus.request(createItem('forms', formData));
      return { success: true, data: form };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create form' };
    }
  },

  async updateForm(formId: string, formData: Record<string, unknown>) {
    try {
      const form = await directus.request(updateItem('forms', formId, formData));
      return { success: true, data: form };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form' };
    }
  },

  async createFormField(fieldData: Record<string, unknown>) {
    try {
      const field = await directus.request(createItem('form_fields', fieldData));
      return { success: true, data: field };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create form field' };
    }
  },

  async updateFormField(fieldId: string, fieldData: Record<string, unknown>) {
    try {
      const field = await directus.request(updateItem('form_fields', fieldId, fieldData));
      return { success: true, data: field };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form field' };
    }
  },

  async deleteFormField(fieldId: string) {
    try {
      await directus.request(deleteItem('form_fields', fieldId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete form field' };
    }
  },

  // Translation operations
  async createFormTranslation(translationData: Record<string, unknown>) {
    try {
      const translation = await directus.request(createItem('forms_translations' as never, translationData as never));
      return { success: true, data: translation };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create form translation' };
    }
  },

  async updateFormTranslation(translationId: string, translationData: Record<string, unknown>) {
    try {
      const translation = await directus.request(updateItem('forms_translations' as never, translationId, translationData as never));
      return { success: true, data: translation };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form translation' };
    }
  },

  async createFormFieldTranslation(translationData: Record<string, unknown>) {
    try {
      const translation = await directus.request(createItem('form_fields_translations' as never, translationData as never));
      return { success: true, data: translation };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create form field translation' };
    }
  },

  async updateFormFieldTranslation(translationId: string, translationData: Record<string, unknown>) {
    try {
      const translation = await directus.request(updateItem('form_fields_translations' as never, translationId, translationData as never));
      return { success: true, data: translation };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form field translation' };
    }
  },

  async deleteFormTranslation(translationId: string) {
    try {
      await directus.request(deleteItem('forms_translations' as never, translationId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete form translation' };
    }
  },

  async deleteFormFieldTranslation(translationId: string) {
    try {
      await directus.request(deleteItem('form_fields_translations' as never, translationId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete form field translation' };
    }
  },

  // Comprehensive form save operation
  async saveForm(formId: string, eventId: string, formData: {
    // Form metadata
    status: 'draft' | 'published' | 'archived';
    on_success: 'redirect' | 'message';
    redirect_url?: string;
    
    // Form translations
    translations: {
      'en-US': {
        title: string;
        submit_label: string;
        success_message: string;
      };
      'vi-VN': {
        title: string;
        submit_label: string;
        success_message: string;
      };
    };
    
    // Form fields
    fields: Array<{
      id?: string;
      name: string;
      type: 'input' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'image';
      width: 'full' | 'half';
      sort: number;
      is_required: boolean;
      validation?: string;
      conditions?: Record<string, unknown>;
      
      // Field translations
      translations: {
        'en-US': {
          label: string;
          placeholder?: string;
          help?: string;
          options?: Array<{ label: string; value: string }>;
        };
        'vi-VN': {
          label: string;
          placeholder?: string;
          help?: string;
          options?: Array<{ label: string; value: string }>;
        };
      };
    }>;
  }) {
    try {
      // 1. Update form metadata
      const formUpdateData = {
        status: formData.status,
        on_success: formData.on_success,
        redirect_url: formData.redirect_url || null,
        event_id: Number(eventId),
      };

      const formResult = await this.updateForm(formId, formUpdateData);
      if (!formResult.success) {
        return formResult;
      }

      // 2. Update form translations
      for (const [langCode, translation] of Object.entries(formData.translations)) {
        const translationData = {
          forms_id: formId,
          languages_code: langCode,
          title: translation.title,
          submit_label: translation.submit_label,
          success_message: translation.success_message,
        };

        // Try to update existing translation first, then create if not exists
        const existingTranslations = await directus.request(readItems('forms_translations' as never, {
          filter: { 
            forms_id: { _eq: formId },
            languages_code: { _eq: langCode }
          },
          limit: 1
        }));

        if (existingTranslations && existingTranslations.length > 0) {
          await this.updateFormTranslation(existingTranslations[0].id, translationData);
        } else {
          await this.createFormTranslation(translationData);
        }
      }

      // 3. Get existing fields to determine which to update/delete
      const existingFields = await this.getFormFields(formId);
      const existingFieldIds = existingFields.success ? existingFields.data?.map((f: Record<string, unknown>) => f.id as string) || [] : [];
      const newFieldIds = formData.fields.filter(f => f.id).map(f => f.id!);

      // Delete fields that are no longer in the form
      const fieldsToDelete = existingFieldIds.filter(id => !newFieldIds.includes(id));
      for (const fieldId of fieldsToDelete) {
        await this.deleteFormField(fieldId);
      }

      // 4. Update/create form fields
      for (const field of formData.fields) {
        const fieldData = {
          form_id: formId,
          name: field.name,
          type: field.type,
          width: field.width,
          sort: field.sort,
          is_required: field.is_required,
          validation: field.validation || null,
          conditions: field.conditions || null,
          event_id: Number(eventId),
        };

        let fieldResult;
        if (field.id) {
          // Update existing field
          fieldResult = await this.updateFormField(field.id, fieldData);
        } else {
          // Create new field
          fieldResult = await this.createFormField(fieldData);
        }

        if (!fieldResult.success) {
          return fieldResult;
        }

        const fieldId = field.id || fieldResult.data?.id;
        if (!fieldId) continue;

        // 5. Update field translations
        for (const [langCode, translation] of Object.entries(field.translations)) {
          const fieldTranslationData = {
            form_fields_id: fieldId,
            languages_code: langCode,
            label: translation.label,
            placeholder: translation.placeholder || null,
            help: translation.help || null,
            options: translation.options ? JSON.stringify(translation.options) : null,
          };

          // Try to update existing translation first, then create if not exists
          const existingFieldTranslations = await directus.request(readItems('form_fields_translations' as never, {
            filter: { 
              form_fields_id: { _eq: fieldId },
              languages_code: { _eq: langCode }
            },
            limit: 1
          }));

          if (existingFieldTranslations && existingFieldTranslations.length > 0) {
            await this.updateFormFieldTranslation(existingFieldTranslations[0].id, fieldTranslationData);
          } else {
            await this.createFormFieldTranslation(fieldTranslationData);
          }
        }
      }

      return { success: true, data: { formId, eventId } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save form' };
    }
  },

  // Single API call form save operation with deep query create/update/delete mechanism
  async saveFormWithFields(formId: string, eventId: string, tenantId: number, formData: {
    // Form metadata
    status: 'draft' | 'published' | 'archived';
    on_success: 'redirect' | 'message';
    redirect_url?: string;
    template_email?: string;
    event_id: number;
    tenant_id: number;
    
    // Form translations with create/update/delete structure
    translations?: {
      create: Array<{
        languages_code: string;
        title: string;
        submit_label: string;
        success_message: string;
      }>;
      update: Array<{
        id: string;
        languages_code: string;
        title: string;
        submit_label: string;
        success_message: string;
      }>;
      delete: string[];
    };
    
    // Form fields with create/update/delete structure
    fields: {
      create: Array<{
        name: string;
        type: string;
        width?: string;
        validation?: string;
        is_required?: boolean;
        sort: number;
        event_id: number;
        tenant_id: number;
        translations: {
          create: Array<{
            languages_code: { code: string };
            label: string;
            placeholder?: string;
            help?: string;
            options?: Array<{ label: string; value: string }>;
          }>;
          update: Array<{
            id: string;
            languages_code: { code: string };
            label: string;
            placeholder?: string;
            help?: string;
            options?: Array<{ label: string; value: string }>;
          }>;
          delete: string[];
        };
      }>;
      update: Array<{
        id: string;
        name: string;
        type: string;
        width?: string;
        validation?: string;
        is_required?: boolean;
        sort: number;
        event_id: number;
        tenant_id: number;
        translations: {
          create: Array<{
            languages_code: { code: string };
            label: string;
            placeholder?: string;
            help?: string;
            options?: Array<{ label: string; value: string }>;
          }>;
          update: Array<{
            id: string;
            languages_code: { code: string };
            label: string;
            placeholder?: string;
            help?: string;
            options?: Array<{ label: string; value: string }>;
          }>;
          delete: string[];
        };
      }>;
      delete: string[];
    };
  }) {
    try {
      console.log('[saveFormWithFields] Starting single API call with payload:', {
        formId,
        eventId,
        tenantId,
        formData
      });

      // Build the complete payload for single API call with deep query
      const payload: any = {
        status: formData.status,
        on_success: formData.on_success,
        redirect_url: formData.redirect_url,
        template_email: formData.template_email,
        event_id: formData.event_id,
        tenant_id: formData.tenant_id,
        
        // Form translations with deep query structure
        ...(formData.translations && {
          translations: {
            create: formData.translations.create,
            update: formData.translations.update,
            delete: formData.translations.delete,
          },
        }),
        
        // Form fields with deep query structure
        fields: {
          create: formData.fields.create,
          update: formData.fields.update,
          delete: formData.fields.delete,
        },
      };

      console.log('[saveFormWithFields] Final payload for single API call:', payload);

      // Single API call to update form with deep query
      const result = await directus.request(
        updateItem('forms', formId, payload)
      );

      console.log('[saveFormWithFields] Single API call result:', result);

      return { success: true, data: result };
    } catch (error) {
      console.error('[saveFormWithFields] Single API call failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save form' };
    }
  },

  async logout() {
    try {
      await directus.logout();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    }
  },

  // Get current user with deep tenants query
  async getCurrentUser() {
    try {
      const user = await directus.request(
        readMe({
          fields: [
            'id',
            'first_name',
            'last_name',
            'email',
            'role',
            'avatar',
            'status',
            {
              tenants: [
                {
                  tenants_id: ['id', 'name', 'email', 'logo', 'status', 'folder_files_id']
                }
              ]
            }
          ],
        })
      );
      return { success: true, data: user };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  },

  // Get user permissions using /permissions/me endpoint
  async getUserPermissions() {
    try {
      // Use the /permissions/me endpoint which returns effective permissions
      const response = await fetch('https://app.nexpo.vn/permissions/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await directus.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Get permissions error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get permissions' };
    }
  },

  // Get tenants for current user
  async getUserTenants() {
    try {
      const user = await this.getCurrentUser();
      if (!user.success || !user.data || !user.data.tenants) {
        return { success: true, data: [] };
      }
      
      const tenants = user.data.tenants.map((t: { tenants_id: Tenant }) => t.tenants_id);
      return { success: true, data: tenants };
    } catch (error) {
      console.error('Get user tenants error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tenants' };
    }
  },

  // Events with tenant filtering
  async getEvents(tenantId?: number, filters?: unknown, fields?: (keyof Event)[]) {
    try {
      const baseFilter = tenantId ? { tenant_id: { _eq: tenantId } } : {};
      const combinedFilter = filters ? { _and: [baseFilter, filters] } : baseFilter;
      
      const events = await directus.request(
        readItems('events', {
          fields: ((fields && fields.length > 0)
            ? ([...fields, { forms: ['id'] }] as unknown as never)
            : ([
                '*',
                { tenant: ['id', 'name', 'logo', 'status', 'folder_files_id'] },
                { forms: ['id'] }
              ] as unknown as never)
          ),
          filter: Object.keys(combinedFilter).length > 0 ? combinedFilter : undefined,
          sort: ['-start_date'],
        })
      );
      return { success: true, data: events };
    } catch (error) {
      console.error('Get events error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get events' };
    }
  },

  async getEvent(id: string | number) {
    try {
      const event = await directus.request(
        readItems('events', {
          fields: ([
            '*',
            { sites: ['id'] }
          ] as unknown) as never,
          filter: { id: { _eq: Number(id) } },
        })
      );
      return { success: true, data: event[0] };
    } catch (error) {
      console.error('Get event error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get event' };
    }
  },

  async createEvent(eventData: Omit<Event, 'id' | 'user_created'>) {
    try {
      const event = await directus.request(createItem('events', eventData));
      return { success: true, data: event };
    } catch (error) {
      console.error('Create event error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create event' };
    }
  },

  async updateEvent(id: string, eventData: Partial<Event>) {
    try {
      const event = await directus.request(updateItem('events', id, eventData));
      return { success: true, data: event };
    } catch (error) {
      console.error('Update event error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update event' };
    }
  },

  async deleteEvent(id: string) {
    try {
      await directus.request(deleteItem('events', id));
      return { success: true };
    } catch (error) {
      console.error('Delete event error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete event' };
    }
  },

  // File uploads
  async uploadFile(file: File, folderId?: string, eventId?: string) {
    try {
      console.log('[uploadFile] Starting upload:', { fileName: file.name, folderId, eventId });
      
      const formData = new FormData();
      
      // Add folder FIRST if provided (before file)
      if (folderId) {
        console.log('[uploadFile] Adding folder to FormData:', folderId);
        formData.append('folder', folderId);
      } else {
        console.warn('[uploadFile] No folderId provided - file will upload to root');
      }
      
      // Add event_id metadata if provided (before file)
      if (eventId) {
        console.log('[uploadFile] Adding event_id to FormData:', eventId);
        formData.append('event_id', eventId);
      }
      
      // Add file LAST
      formData.append('file', file);
      
      // Get auth token from tokenManager
      const { tokenManager } = await import('./tokenManager');
      const token = tokenManager.getBestAvailableToken();
      console.log('[uploadFile] Token available:', !!token);
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Authenticated upload with Bearer token
      const response = await fetch('https://app.nexpo.vn/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to upload file' };
    }
  },

  // Get files from tenant folder
  async getFilesByFolder(folderId: string, limit: number = 50) {
    try {
      console.log('[getFilesByFolder] Fetching files from folder:', folderId);
      
      const { tokenManager } = await import('./tokenManager');
      const token = tokenManager.getBestAvailableToken();
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Fetch files from Directus with filter
      const response = await fetch(`https://app.nexpo.vn/files?filter[folder][_eq]=${folderId}&limit=${limit}&sort[]=-uploaded_on`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch files failed:', response.status, errorText);
        throw new Error(`Failed to fetch files: ${response.status}`);
      }

      const result = await response.json();
      console.log('[getFilesByFolder] Fetched files:', result.data?.length || 0);
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('Get files error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch files' };
    }
  },

  // Sites
  async getSiteByEvent(eventId: number) {
    try {
      const sites = await directus.request(readItems('sites' as never, {
        filter: { event_id: { _eq: Number(eventId) } },
        limit: 1,
        fields: (['id','event_id','slug','domain','status'] as unknown) as never,
      }));
      return { success: true, data: sites?.[0] || null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get site by event' };
    }
  },

  // Get list of sites for an event (with all data for list display)
  async getSitesList(eventId: number, tenantId?: number) {
    try {
      const filter: Record<string, unknown> = {
        event_id: { _eq: Number(eventId) }
      };

      // Add tenant filter if provided
      if (tenantId) {
        filter.tenant_id = { _eq: Number(tenantId) };
      }

      const sites = await directus.request(readItems('sites' as never, {
        filter: filter as never,
        fields: ([
          'id',
          'event_id',
          'slug',
          'domain',
          'status',
          'date_created',
          'date_updated',
          'logo',
          'favicon',
          'tenant_id',
          { 
            translations: ['id', 'languages_code', 'title', 'description'] 
          },
          { 
            pages: ['id', 'status'] 
          },
          { 
            navigation: ['id', 'type', 'status'] 
          },
          {
            categories: ['id']
          }
        ] as unknown) as never,
        sort: (['-date_updated'] as unknown) as never,
      }));
      return { success: true, data: sites };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get sites list' };
    }
  },

  async getSite(siteId: number) {
    try {
      const sites = await directus.request(readItems('sites' as never, {
        filter: { id: { _eq: Number(siteId) } },
        limit: 1,
        fields: ([
          'id',
          'event_id',
          'slug',
          'domain',
          'status',
          'sort',
          'user_created',
          'date_created',
          'user_updated',
          'date_updated',
          'logo',
          'favicon',
          'tenant_id',
          { 
            posts: [
              'id', 
              'title', 
              'slug',
              'status',
              'type',
              'date_published',
              'summary',
              { category: ['id', { translations: ['title'] }] },
              { author: ['id', 'name'] }
            ] 
          },
          { 
            testimonials: [
              'id', 
              'title', 
              'subtitle',
              'status',
              'company',
              'content'
            ] 
          },
          { 
            team: [
              'id', 
              'name', 
              'status',
              'image',
              { translations: ['languages_code', 'job_title', 'bio'] }
            ] 
          },
          { 
            redirects: [
              'id', 
              'url_old', 
              'url_new',
              'response_code'
            ] 
          },
          { 
            navigation: [
              'id', 
              'status', 
              'type',
              { translations: ['id', 'languages_code', 'title'] },
              { 
                items: [
                  'id',
                  'type',
                  'sort',
                  { translations: ['languages_code', 'title'] }
                ]
              }
            ] 
          },
          { 
            translations: ['id', 'languages_code', 'title', 'description'] 
          },
          { 
            pages: [
              'id', 
              'sort', 
              'status',
              'date_created',
              'date_updated',
              { translations: ['id', 'languages_code', 'title'] },
              { blocks: ['id', 'collection'] }
            ] 
          },
          { 
            categories: [
              'id', 
              'color',
              'sort',
              { translations: ['id', 'languages_code', 'title'] }
            ] 
          },
          { 
            globals: [
              'id', 
              'title', 
              'url',
              'tagline',
              'description',
              'email',
              'phone'
            ] 
          },
          { 
            languages: [
              'id',
              { languages_id: ['code', 'name'] }
            ] 
          }
        ] as unknown) as never,
      }));
      return { success: true, data: sites?.[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get site' };
    }
  },

  async createSite(payload: { event_id: number; slug?: string; domain?: string; status?: string }) {
    try {
      const site = await directus.request(createItem('sites' as never, payload as never));
      return { success: true, data: site };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create site' };
    }
  },

  async updateSite(siteId: number, payload: Partial<{
    slug: string;
    domain: string;
    status: string;
    logo: string | null;
    favicon: string | null;
    tenant_id: number;
    translations: {
      create?: Array<{ languages_code: { code: string }; title?: string; description?: string }>;
      update?: Array<{ id: number; title?: string; description?: string }>;
    };
  }>) {
    try {
      console.log('[updateSite] Updating site:', siteId, 'with payload:', payload);
      
      const site = await directus.request(updateItem('sites' as never, siteId as never, payload as never));
      return { success: true, data: site };
    } catch (error) {
      console.error('[updateSite] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update site' };
    }
  },

  // Pages
  async createPage(payload: { site_id: number; sort?: number; translations?: { create: Array<{ languages_code: { code: string }; title?: string; permalink?: string }> } }) {
    try {
      const page = await directus.request(createItem('pages' as never, payload as never));
      return { success: true, data: page };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create page' };
    }
  },

  async getPagesBySite(siteId: number) {
    try {
      const pages = await directus.request(readItems('pages' as never, {
        filter: { site_id: { _eq: Number(siteId) } },
        fields: (['id','sort',{ translations: ['title', 'permalink'] }] as unknown) as never,
      }));
      return { success: true, data: pages };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get pages' };
    }
  },

  async getPage(pageId: string) {
    try {
      const pages = await directus.request(readItems('pages' as never, {
        filter: { id: { _eq: pageId } },
        limit: 1,
        fields: ([
          'id','sort','status','site_id','date_created','date_updated',
          { translations: ['id','languages_code','title','permalink'] },
          { site: ['id','event_id','tenant_id'] },
          { blocks: [
            'id','collection','sort','hide_block',
            { item: [
              '*',
              { translations: ['*'] },
              { form: ['id','status','on_success','redirect_url', { translations: ['*'] }, { fields: ['*', { translations: ['*'] }] }] }
            ] }
          ] }
        ] as unknown) as never,
      }));
      return { success: true, data: pages?.[0] || null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get page' };
    }
  },

  async updatePage(pageId: string, payload: Record<string, unknown>) {
    try {
      const page = await directus.request(updateItem('pages' as never, pageId, payload as never));
      return { success: true, data: page };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update page' };
    }
  },

  // Blocks via junction page_blocks
  async getBlocksByPage(pageId: string) {
    try {
      const blocks = await directus.request(readItems('page_blocks' as never, {
        filter: { pages_id: { _eq: pageId } },
        fields: (['id','collection','hide_block','sort'] as unknown) as never,
        sort: (['sort'] as unknown) as never
      }));
      return { success: true, data: blocks };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get blocks' };
    }
  },

  async upsertPageBlock(payload: { pages_id: string; collection: string; item: Record<string, unknown>; sort?: number; hide_block?: boolean }) {
    try {
      // Create the block item first
      const createdItem = await directus.request(createItem(payload.collection as never, payload.item as never));
      const link = await directus.request(createItem('page_blocks' as never, {
        pages_id: payload.pages_id,
        collection: payload.collection,
        item: createdItem.id,
        sort: payload.sort || 1,
        hide_block: payload.hide_block || false,
      } as never));
      return { success: true, data: link };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to save block' };
    }
  },

  // Navigation (single per site)
  async getNavigation(siteId: number) {
    try {
      const nav = await directus.request(readItems('navigation' as never, {
        filter: { site_id: { _eq: Number(siteId) } },
        limit: 1,
        fields: ([
          'id','status','type','site_id',
          { translations: ['languages_code','title'] },
          { items: [
            'id','sort','type','url','open_in_new_tab','has_children',
            { translations: ['languages_code','title'] },
            { page: ['id', { translations: ['title'] }] },
            { parent: ['id'] },
            { children: [
              'id','sort','type','url','open_in_new_tab','has_children',
              { translations: ['languages_code','title'] },
              { page: ['id', { translations: ['title'] }] },
              { parent: ['id'] }
            ]}
          ] }
        ] as unknown) as never,
      }));
      return { success: true, data: nav?.[0] || null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get navigation' };
    }
  },

  async getNavigations(siteId: number) {
    try {
      const list = await directus.request(readItems('navigation' as never, {
        filter: { site_id: { _eq: Number(siteId) } },
        fields: ([
          'id','status','type','site_id',
          { translations: ['languages_code','title'] },
          { items: [
            'id','sort','type','url','open_in_new_tab','has_children',
            { translations: ['languages_code','title'] },
            { page: ['id', { translations: ['title'] }] },
            { parent: ['id'] },
            { children: [
              'id','sort','type','url','open_in_new_tab','has_children',
              { translations: ['languages_code','title'] },
              { page: ['id', { translations: ['title'] }] },
              { parent: ['id'] }
            ]}
          ] }
        ] as unknown) as never,
      }));
      return { success: true, data: list };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get navigations' };
    }
  },

  async updateNavigation(id: string, payload: Record<string, unknown>) {
    try {
      const updated = await directus.request(updateItem('navigation' as never, id as never, payload as never));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update navigation' };
    }
  },

  async createNavigation(payload: Record<string, unknown>) {
    try {
      const created = await directus.request(createItem('navigation' as never, payload as never));
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create navigation' };
    }
  },

  async createNavigationItem(payload: Record<string, unknown>) {
    try {
      const created = await directus.request(createItem('navigation_items' as never, payload as never));
      return { success: true, data: created };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create navigation item' };
    }
  },

  async updateNavigationItem(id: string, payload: Record<string, unknown>) {
    try {
      const updated = await directus.request(updateItem('navigation_items' as never, id as never, payload as never));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update navigation item' };
    }
  },

  // Sites queries
  async getSitesByEvent(eventId: number) {
    try {
      const sites = await directus.request(
        readItems('sites' as never, {
          filter: { event_id: { _eq: eventId } },
          fields: (['id', 'slug', 'domain', 'status', 'sort', 'translations.title'] as unknown) as never,
          sort: (['sort'] as unknown) as never,
        })
      );
      return { success: true, data: sites as unknown as Site[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch sites' };
    }
  },

  // Registrations queries
  async getRegistrationsByEvent(eventId: number) {
    try {
      console.log('[getRegistrationsByEvent] Fetching registrations for eventId:', eventId);
      const registrations = await directus.request(
        readItems('registrations' as never, {
          filter: { event_id: { _eq: eventId } },
          fields: ([
            'id', 'full_name', 'email', 'phone_number', 'checkin_status', 'date_created', 'badge_id', 'redeem_id',
            {
              submissions: [
                'id', 'date_sumitted', 'status',
                {
                  form: [
                    'id',
                    {
                      translations: ['languages_code', 'title']
                    }
                  ]
                },
                {
                  answers: [
                    'id', 'value',
                    {
                      field: [
                        'id', 'name', 'type',
                        {
                          translations: ['languages_code', 'label']
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ] as unknown) as never,
          sort: (['-date_created'] as unknown) as never,
        })
      );
      console.log('[getRegistrationsByEvent] Raw registrations data:', registrations);
      return { success: true, data: registrations as unknown as Registration[] };
    } catch (error) {
      console.error('[getRegistrationsByEvent] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch registrations' };
    }
  },

  async getRegistrationById(registrationId: string) {
    try {
      const registration = await directus.request(
        readItems('registrations' as never, {
          filter: { id: { _eq: registrationId } },
          fields: ([
            'id', 'full_name', 'email', 'phone_number', 'checkin_status', 'date_created', 'badge_id', 'redeem_id',
            {
              submissions: [
                'id', 'date_sumitted', 'status',
                {
                  form: [
                    'id',
                    {
                      translations: ['languages_code', 'title']
                    }
                  ]
                },
                {
                  answers: [
                    'id', 'value',
                    {
                      field: [
                        'id', 'name', 'type',
                        {
                          translations: ['languages_code', 'label']
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ] as unknown) as never,
        })
      );
      return { success: true, data: registration?.[0] as unknown as Registration };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch registration' };
    }
  },

  async updateRegistration(registrationId: string, data: any) {
    try {
      console.log('[updateRegistration] Updating registration:', registrationId, data);
      const result = await directus.request(
        updateItem('registrations' as never, registrationId, data)
      );
      console.log('[updateRegistration] Update result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('[updateRegistration] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update registration' };
    }
  },

  async updateFormAnswer(answerId: string, data: any) {
    try {
      console.log('[updateFormAnswer] Updating answer:', answerId, data);
      const result = await directus.request(
        updateItem('form_answers' as never, answerId, data)
      );
      console.log('[updateFormAnswer] Update result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('[updateFormAnswer] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form answer' };
    }
  },

  async updateFormTemplate(formId: string, data: any) {
    try {
      console.log('[updateFormTemplate] Updating form template:', formId, data);
      const result = await directus.request(
        updateItem('forms' as never, formId, data)
      );
      console.log('[updateFormTemplate] Update result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('[updateFormTemplate] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update form template' };
    }
  },

  // Pages queries (alternative implementation to avoid duplicate)
  async getPagesBySiteList(siteId: number) {
    try {
      const pages = await directus.request(
        readItems('pages' as never, {
          filter: { site_id: { _eq: siteId } },
          fields: (['id', 'status', 'sort', 'translations.title', 'translations.permalink', 'site_id'] as unknown) as never,
          sort: (['sort'] as unknown) as never,
        })
      );
      return { success: true, data: pages as unknown as Page[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch pages' };
      }
    },

    // Global settings CRUD operations
    async getGlobal(siteId: number) {
      try {
        const globals = await directus.request(
          readItems('globals' as never, {
            filter: { site_id: { _eq: siteId } },
            limit: 1,
            fields: ([
              'id', 'site_id', 'title', 'tagline', 'description', 'url', 'theme',
              'logo_on_light_bg', 'logo_on_dark_bg', 'favicon', 'og_image',
              'street_address', 'address_locality', 'address_region', 'address_country',
              'postal_code', 'email', 'phone', 'social_links', 'build_hook_url'
            ] as unknown) as never,
          })
        );
        return { success: true, data: globals?.[0] || null };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get global settings' };
      }
    },

    async updateGlobal(globalId: string, payload: Partial<{
      title: string; tagline: string; description: string; url: string;
      theme: Record<string, unknown>; logo_on_light_bg: string | null;
      logo_on_dark_bg: string | null; favicon: string | null; og_image: string | null;
      street_address: string; address_locality: string; address_region: string;
      address_country: string; postal_code: string; email: string; phone: string;
      social_links: Array<{ service: string; url: string }>; build_hook_url: string;
    }>) {
      try {
        const global = await directus.request(updateItem('globals' as never, globalId as never, payload as never));
        return { success: true, data: global };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update global settings' };
      }
    },

    async createGlobal(payload: {
      site_id: number; title?: string; tagline?: string; description?: string;
      url?: string; theme?: Record<string, unknown>;
    }) {
      try {
        const global = await directus.request(createItem('globals' as never, payload as never));
        return { success: true, data: global };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create global settings' };
      }
    }
  };

export default directus;
