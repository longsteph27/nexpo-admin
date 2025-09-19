'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { permissionService, UserPermissions } from '@/lib/permissions';

interface PermissionContextType {
  permissions: Record<string, UserPermissions>;
  loading: boolean;
  canPerformAction: (collection: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  getAllowedFields: (collection: string) => string[];
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, UserPermissions>>({});
  const [loading, setLoading] = useState(false);

  const loadPermissions = async () => {
    if (!user?.id || !isAuthenticated) {
      setPermissions({});
      return;
    }

    setLoading(true);
    try {
      // Call the new /permissions/me API
      const response = await fetch('/api/permissions/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions);
      } else {
        console.error('Error loading permissions:', data.error);
        setPermissions({});
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const canPerformAction = (collection: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    const collectionPermissions = permissions[collection];
    if (!collectionPermissions) return false;

    switch (action) {
      case 'create':
        return collectionPermissions.canCreate;
      case 'read':
        return collectionPermissions.canRead;
      case 'update':
        return collectionPermissions.canUpdate;
      case 'delete':
        return collectionPermissions.canDelete;
      default:
        return false;
    }
  };

  const getAllowedFields = (collection: string): string[] => {
    const collectionPermissions = permissions[collection];
    return collectionPermissions?.allowedFields || [];
  };

  const refreshPermissions = async () => {
    if (user?.id) {
      permissionService.clearUserCache(user.id);
      await loadPermissions();
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadPermissions();
    } else {
      setPermissions({});
    }
  }, [isAuthenticated, user?.id]);

  const value: PermissionContextType = {
    permissions,
    loading,
    canPerformAction,
    getAllowedFields,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

// Hook for specific collection permissions
export function useCollectionPermissions(collection: string) {
  const { permissions, canPerformAction, getAllowedFields } = usePermissions();
  
  const collectionPermissions = permissions[collection] || {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    allowedFields: [],
    validationRules: {}
  };

  return {
    ...collectionPermissions,
    canPerformAction: (action: 'create' | 'read' | 'update' | 'delete') => 
      canPerformAction(collection, action),
    getAllowedFields: () => getAllowedFields(collection)
  };
}
