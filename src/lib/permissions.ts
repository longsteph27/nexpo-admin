import { directusAxios } from './directus';

export interface Permission {
  id: number;
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fields?: string[];
  validation?: any;
  permissions?: any;
  presets?: any;
  policy?: string;
}

export interface UserPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  allowedFields: string[];
  validationRules: any;
}

export class PermissionService {
  private static instance: PermissionService;
  private permissionsCache: Map<string, UserPermissions> = new Map();

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Get user permissions for a specific collection
   */
  async getUserPermissions(userId: string, collection: string, cookies?: string): Promise<UserPermissions> {
    const cacheKey = `${userId}-${collection}`;
    
    if (this.permissionsCache.has(cacheKey)) {
      return this.permissionsCache.get(cacheKey)!;
    }

    try {
          // Get user's role
          const userResponse = await directusAxios.get('/user/me', {
            headers: cookies ? { 'Cookie': cookies } : {}
          });
      const user = userResponse.data.data;
      const userRole = user.role;

      if (!userRole) {
        return this.getDefaultPermissions();
      }

      // Get permissions for the user's role and collection
      const permissionsResponse = await directusAxios.get('/items/directus_permissions', {
        params: {
          filter: {
            collection: {
              _eq: collection
            },
            policy: {
              roles: {
                _contains: userRole
              }
            }
          },
          fields: 'id,collection,action,fields,validation,permissions,presets'
        },
        headers: cookies ? { 'Cookie': cookies } : {}
      });

      const permissions = permissionsResponse.data.data || [];
      const userPermissions = this.processPermissions(permissions);
      
      // Cache the permissions
      this.permissionsCache.set(cacheKey, userPermissions);
      
      return userPermissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return this.getDefaultPermissions();
    }
  }

  /**
   * Check if user can perform a specific action on a collection
   */
  async canUserPerformAction(
    userId: string, 
    collection: string, 
    action: 'create' | 'read' | 'update' | 'delete',
    cookies?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, collection, cookies);
    
    switch (action) {
      case 'create':
        return permissions.canCreate;
      case 'read':
        return permissions.canRead;
      case 'update':
        return permissions.canUpdate;
      case 'delete':
        return permissions.canDelete;
      default:
        return false;
    }
  }

  /**
   * Get allowed fields for a user on a collection
   */
  async getAllowedFields(userId: string, collection: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId, collection);
    return permissions.allowedFields;
  }

  /**
   * Process raw permissions into a structured format
   */
  private processPermissions(permissions: Permission[]): UserPermissions {
    const result: UserPermissions = {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
      allowedFields: [],
      validationRules: {}
    };

    permissions.forEach(permission => {
      switch (permission.action) {
        case 'create':
          result.canCreate = true;
          break;
        case 'read':
          result.canRead = true;
          break;
        case 'update':
          result.canUpdate = true;
          break;
        case 'delete':
          result.canDelete = true;
          break;
      }

      // Collect allowed fields
      if (permission.fields && permission.fields.length > 0) {
        result.allowedFields.push(...permission.fields);
      }

      // Collect validation rules
      if (permission.validation) {
        result.validationRules = { ...result.validationRules, ...permission.validation };
      }
    });

    // Remove duplicates from allowed fields
    result.allowedFields = [...new Set(result.allowedFields)];

    return result;
  }

  /**
   * Get default permissions (restrictive)
   */
  private getDefaultPermissions(): UserPermissions {
    return {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
      allowedFields: [],
      validationRules: {}
    };
  }

  /**
   * Clear permissions cache
   */
  clearCache(): void {
    this.permissionsCache.clear();
  }

  /**
   * Clear specific user's permissions cache
   */
  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.permissionsCache.keys()).filter(key => 
      key.startsWith(`${userId}-`)
    );
    keysToDelete.forEach(key => this.permissionsCache.delete(key));
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();

// Helper functions for common permission checks
export const canCreateEvent = async (userId: string): Promise<boolean> => {
  return permissionService.canUserPerformAction(userId, 'events', 'create');
};

export const canReadEvent = async (userId: string): Promise<boolean> => {
  return permissionService.canUserPerformAction(userId, 'events', 'read');
};

export const canUpdateEvent = async (userId: string): Promise<boolean> => {
  return permissionService.canUserPerformAction(userId, 'events', 'update');
};

export const canDeleteEvent = async (userId: string): Promise<boolean> => {
  return permissionService.canUserPerformAction(userId, 'events', 'delete');
};

export const getEventPermissions = async (userId: string): Promise<UserPermissions> => {
  return permissionService.getUserPermissions(userId, 'events');
};
