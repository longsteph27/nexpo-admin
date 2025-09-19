import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/directus';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
    console.log('Auth Me API - Request cookies:', cookies);
    
    // Use the service layer
    const user = await getCurrentUser(cookies);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user,
      success: true
    });
  } catch (error) {
    console.error('Auth Me API - Error:', error);
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get user info', success: false },
      { status: 500 }
    );
  }
}
