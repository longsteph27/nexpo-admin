import { NextRequest, NextResponse } from 'next/server';
import { directusAxios } from '@/lib/directus';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Login API - Attempting login for:', email);

    // Login with Directus using session mode (matching the curl command)
    const response = await directusAxios.post('/auth/login', {
      email,
      password,
      mode: 'session'
    });

    console.log('Login API - Directus response status:', response.status);
    console.log('Login API - Directus response headers:', response.headers);
    console.log('Login API - Directus response data:', response.data);

    // Create response with the session cookie
    const nextResponse = NextResponse.json({ 
      success: true, 
      user: response.data?.data?.user || null,
      message: 'Login successful'
    });

    // Forward any cookies from Directus response
    if (response.headers?.['set-cookie']) {
      console.log('Login API - Setting cookies:', response.headers['set-cookie']);
      response.headers['set-cookie'].forEach((cookie: string) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });
    }

    // Also set the directus_session_token cookie if it exists in the response
    if (response.data?.data?.access_token) {
      // For session mode, the token might be in access_token field
      const sessionToken = response.data.data.access_token;
      nextResponse.headers.append('Set-Cookie', 
        `directus_session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Secure`
      );
    }

    console.log('Login API - Login successful for:', email);
    return nextResponse;
  } catch (error: any) {
    console.error('Login API error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Login failed',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
