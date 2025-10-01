import { createDirectus, rest, authentication, readItems, readMe, createItem, updateItem, deleteItem } from '@directus/sdk';

// Define your schema types based on the actual Directus schema
interface Tenant {
  id: number;
  name: string;
  email?: string;
  logo?: string;
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

// Create Directus client
const directus = createDirectus<Schema>('https://app.nexpo.vn')
  .with(rest())
  .with(authentication('json', { autoRefresh: true }));

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

  // Forms
  async getForm(formId: string) {
    try {
      const form = await directus.request(readItems('forms', {
        filter: { id: { _eq: formId } },
        limit: 1,
        fields: ([
          'id', 'status', 'on_success', 'redirect_url', 'event_id',
          { translations: ['languages_code','title','submit_label','success_message'] },
          { fields: [
            'id','name','type','width','sort','is_required','validation',
            { translations: ['languages_code','label','placeholder','help','options'] }
          ]}
        ]) as unknown as never,
      }));
      return { success: true, data: form?.[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get form' };
    }
  },

  async getFormFields(formId: string) {
    try {
      const fields = await directus.request(readItems('form_fields', {
        filter: { form_id: { _eq: formId } },
        sort: ['sort'],
        fields: ([
          'id','name','type','width','sort','is_required','validation','form_id',
          { translations: ['languages_code','label','placeholder','help','options'] }
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
          'id','event_id','status','on_success','redirect_url',
          { translations: ['languages_code','title','submit_label','success_message'] },
        ]) as unknown as never,
      }));
      return { success: true, data: forms?.[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get form by event' };
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
                  tenants_id: ['id', 'name', 'email', 'logo', 'status']
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
                { tenant: ['id', 'name', 'logo', 'status'] },
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
          fields: ['*'],
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
  async uploadFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Public upload (no auth headers, no credentials)
      const response = await fetch('https://app.nexpo.vn/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to upload file' };
    }
  },
};

export default directus;
