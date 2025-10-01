# Tenant System Implementation

This document explains the multi-tenant system implemented in the NEXPO Admin Panel.

## Overview

The application now supports multi-tenant architecture where:
- Users can belong to multiple tenants (organizations/workspaces)
- Events are scoped to specific tenants
- Users can switch between tenants using a dropdown selector
- API calls automatically filter data by the selected tenant

## Key Components

### 1. Data Models (`src/lib/directus.ts`)

#### Tenant
```typescript
interface Tenant {
  id: number;
  name: string;
  email?: string;
  logo?: string;
  status: 'active' | 'inactive';
}
```

#### User (Extended)
```typescript
interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  tenants?: {
    tenants_id: Tenant;
  }[];
}
```

#### Event (Updated)
```typescript
interface Event {
  id?: number;
  tenant_id?: number;  // Links event to tenant
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  tenant?: Tenant;     // Populated via relation
}
```

### 2. Authentication Store (`src/store/auth.ts`)

Extended with tenant management:
- `tenants: Tenant[]` - List of user's tenants
- `selectedTenant: Tenant | null` - Currently selected tenant
- `permissions: Permission[]` - User permissions
- `setSelectedTenant()` - Switch tenant
- `loadPermissions()` - Load user permissions

### 3. Tenant Selector (`src/components/ui/TenantSelector.tsx`)

Dropdown component that:
- Shows in sidebar when user has multiple tenants
- Displays tenant name, logo, and status
- Allows switching between tenants
- Persists selection in store

## API Integration

### User Authentication with Tenants

```typescript
// Get current user with deep tenant query
const user = await directus.request(
  readMe({
    fields: [
      'id', 'first_name', 'last_name', 'email', 'role', 'avatar', 'status',
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
```

### Permissions

```typescript
// Get user permissions for events and tenants
const permissions = await directus.request(
  readPermissions({
    fields: ['id', 'role', 'collection', 'action', 'permissions', 'validation', 'presets', 'fields'],
    filter: {
      collection: { _in: ['events', 'tenants'] }
    }
  })
);
```

### Events with Tenant Filtering

```typescript
// Get events filtered by tenant
const events = await directus.request(
  readItems('events', {
    fields: [
      '*',
      {
        tenant: ['id', 'name', 'logo']
      }
    ],
    filter: { tenant_id: { _eq: tenantId } },
    sort: ['-start_date'],
  })
);
```

## User Flow

1. **Login**: User logs in with email/password
2. **Tenant Loading**: System loads user's tenants via `/me` endpoint
3. **Auto-Selection**: First tenant is automatically selected
4. **Tenant Switching**: User can switch tenants via sidebar dropdown
5. **Data Filtering**: All API calls filter by selected tenant
6. **Event Creation**: New events are automatically assigned to selected tenant

## UI Components

### Sidebar Integration
- Tenant selector appears in sidebar header
- Only shows when user has multiple tenants
- Displays current tenant with logo and name

### Dashboard
- Events are filtered by selected tenant
- Create Event button respects tenant context
- Empty states show tenant-specific messaging

### Event Forms
- Automatically include `tenant_id` in form submissions
- Validate tenant selection before submission

## Security Considerations

1. **Tenant Isolation**: Events are strictly filtered by tenant_id
2. **Permission Checks**: User permissions are validated per tenant
3. **API Security**: All mutations include tenant context
4. **Data Validation**: Frontend validates tenant ownership

## Development Notes

### Adding New Tenant-Scoped Resources

1. Add `tenant_id` field to schema
2. Update TypeScript interfaces
3. Add tenant filtering to API calls
4. Update UI to respect tenant context

### Testing Tenant Switching

1. Create user with multiple tenant associations
2. Login and verify tenant dropdown appears
3. Switch tenants and verify data filtering
4. Test event creation with different tenants

## Environment Variables

No additional environment variables needed. The system uses the existing Directus endpoint:
```
DIRECTUS_URL=https://app.nexpo.vn
```

## Troubleshooting

### Tenant Not Loading
- Check user has tenant associations in Directus
- Verify `/me` endpoint returns tenant data
- Check browser console for API errors

### Events Not Filtering
- Verify `tenant_id` field exists in events table
- Check selected tenant is not null
- Verify API calls include tenant filter

### Permissions Issues
- Check user role has appropriate permissions
- Verify `/permissions/me` endpoint returns data
- Check tenant-specific permission rules

## Future Enhancements

1. **Tenant Administration**: Add tenant management UI
2. **Role-Based Access**: Implement tenant-specific roles
3. **Audit Logging**: Track tenant switching and actions
4. **Bulk Operations**: Support multi-tenant bulk actions
5. **Tenant Branding**: Custom themes per tenant
