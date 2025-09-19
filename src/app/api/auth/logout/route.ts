import { NextRequest, NextResponse } from 'next/server';
import { directusAxios } from '@/lib/directus';

export async function POST(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie');
    
    // Create response - always return success to clear cookies
    const nextResponse = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

    // Always clear cookies regardless of Directus response
    const cookiesToClear = [
      'directus_session_token',
      'directus_refresh_token',
      'directus_access_token',
      'session',
      'auth_token'
    ];

    // Clear all potential authentication cookies
    cookiesToClear.forEach(cookieName => {
      nextResponse.headers.append('Set-Cookie', 
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`
      );
    });

    // Try to logout from Directus if cookies exist
    if (cookies) {
      try {
        await directusAxios.post('/auth/logout', {}, {
          headers: {
            'Cookie': cookies
          }
        });
        console.log('Directus logout successful');
      } catch (directusError) {
        console.warn('Directus logout failed, but cookies will still be cleared:', directusError);
      }
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Logout API error:', error);
    
    // Even on error, clear cookies and return success
    const nextResponse = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully (cookies cleared)'
    });

    // Clear cookies even on error
    const cookiesToClear = [
      'directus_session_token',
      'directus_refresh_token', 
      'directus_access_token',
      'session',
      'auth_token'
    ];

    cookiesToClear.forEach(cookieName => {
      nextResponse.headers.append('Set-Cookie', 
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`
      );
    });

    return nextResponse;
  }
}
