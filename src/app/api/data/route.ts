import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/directus';
import { COLLECTIONS } from '@/types/collections';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection') || 'users';
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }
    
    // Get data from Directus
    const data = await dataApi.getItems(collection);
    
    return NextResponse.json({ 
      success: true, 
      data,
      collection 
    });
  } catch (error: any) {
    console.error('Data API error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to fetch data',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
