'use client';

import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

interface ProtectedComponentProps {
  children: React.ReactNode;
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all actions, otherwise any action
  actions?: ('create' | 'read' | 'update' | 'delete')[]; // Multiple actions to check
}

export default function ProtectedComponent({
  children,
  collection,
  action,
  fallback = null,
  requireAll = false,
  actions
}: ProtectedComponentProps) {
  const { canPerformAction, loading } = usePermissions();

  // Show loading state while permissions are being fetched
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-20"></div>;
  }

  // Check single action
  if (!actions) {
    const hasPermission = canPerformAction(collection, action);
    return hasPermission ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple actions
  if (requireAll) {
    // User must have ALL specified actions
    const hasAllPermissions = actions.every(action => canPerformAction(collection, action));
    return hasAllPermissions ? <>{children}</> : <>{fallback}</>;
  } else {
    // User must have ANY of the specified actions
    const hasAnyPermission = actions.some(action => canPerformAction(collection, action));
    return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
  }
}

// Convenience components for common use cases
export function ProtectedButton({
  children,
  collection,
  action,
  fallback = null,
  className = '',
  ...props
}: ProtectedComponentProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ProtectedComponent collection={collection} action={action} fallback={fallback}>
      <button className={className} {...props}>
        {children}
      </button>
    </ProtectedComponent>
  );
}

export function ProtectedLink({
  children,
  collection,
  action,
  fallback = null,
  className = '',
  href,
  ...props
}: ProtectedComponentProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <ProtectedComponent collection={collection} action={action} fallback={fallback}>
      <a href={href} className={className} {...props}>
        {children}
      </a>
    </ProtectedComponent>
  );
}

export function ProtectedDiv({
  children,
  collection,
  action,
  fallback = null,
  className = '',
  ...props
}: ProtectedComponentProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ProtectedComponent collection={collection} action={action} fallback={fallback}>
      <div className={className} {...props}>
        {children}
      </div>
    </ProtectedComponent>
  );
}

