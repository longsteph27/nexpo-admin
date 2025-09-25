import { createDirectus, rest, authentication, readItems, readMe, createItem, updateItem, deleteItem, readPermissions } from '@directus/sdk';

// Define your schema types based on the actual Directus schema
interface Tenant {
  id: number;
  name: string;
  email?: string;
  logo?: string;
  settings?: any;
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
  auth_data?: any;
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
}

// Create Directus client
const directus = createDirectus<Schema>('https://app.nexpo.vn')
  .with(rest())
  .with(authentication());

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
      if (!user.success || !user.data.tenants) {
        return { success: true, data: [] };
      }
      
      const tenants = user.data.tenants.map(t => t.tenants_id);
      return { success: true, data: tenants };
    } catch (error) {
      console.error('Get user tenants error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get tenants' };
    }
  },

  // Events with tenant filtering
  async getEvents(tenantId?: number, filters?: any) {
    try {
      const baseFilter = tenantId ? { tenant_id: { _eq: tenantId } } : {};
      const combinedFilter = filters ? { _and: [baseFilter, filters] } : baseFilter;
      
      const events = await directus.request(
        readItems('events', {
          fields: [
            '*',
            {
              tenant: ['id', 'name', 'logo']
            }
          ],
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

  async getEvent(id: string) {
    try {
      const event = await directus.request(
        readItems('events', {
          fields: ['*'],
          filter: { id: { _eq: id } },
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

      const response = await fetch('https://app.nexpo.vn/files', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${await directus.getToken()}`,
        },
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
