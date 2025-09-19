import { NextRequest, NextResponse } from 'next/server';
import { directusAxios } from '@/lib/directus';
import { getCurrentUser } from '@/services/directus';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Get user's role and permissions
    const user = await getCurrentUser(cookies);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    const userRole = user.role;

    // For now, return basic permissions based on role
    // In a real implementation, you would fetch from directus_permissions
    const permissionsByCollection: Record<string, {
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      allowedFields: string[];
      validationRules: any;
    }> = {};

    // Default permissions for admin role
    if (userRole === 'cc2b1282-d562-4a2f-b9a9-d5a32004c909') { // Admin role ID
      // Give full permissions to events collection for admin
      permissionsByCollection['events'] = {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        allowedFields: ['*'], // All fields
        validationRules: {}
      };
      
      // Give read permissions to other collections
      const otherCollections = ['event_users', 'sites', 'forms', 'posts', 'navigation'];
      otherCollections.forEach(collection => {
        permissionsByCollection[collection] = {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          allowedFields: ['*'],
          validationRules: {}
        };
      });
    } else {
      // Default restrictive permissions for non-admin users
      permissionsByCollection['events'] = {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        allowedFields: ['id', 'name', 'description', 'start_date', 'end_date', 'location', 'status'],
        validationRules: {}
      };
    }

    return NextResponse.json({
      success: true,
      permissions: permissionsByCollection,
      role: userRole,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error: any) {
    console.error('Permissions API error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to fetch permissions',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
