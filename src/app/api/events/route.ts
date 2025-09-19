import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/directus';

interface DirectusError {
  response?: {
    status?: number;
    data?: {
      errors?: Array<{ message?: string }>;
    };
  };
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create event in Directus
    try {
      const data = await dataApi.createItem('events', body, cookies);
      
      return NextResponse.json({ 
        success: true, 
        data: data,
        message: 'Event created successfully'
      });
    } catch (directusError: unknown) {
      throw directusError;
    }
  } catch (error: unknown) {
    console.error('Create event API error:', error);
    
    const directusError = error as DirectusError;
    return NextResponse.json(
      { 
        error: directusError.response?.data?.errors?.[0]?.message || 'Failed to create event',
        details: directusError.response?.data || directusError.message
      },
      { status: directusError.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for events
    const limit = searchParams.get('limit') || '25';
    const page = searchParams.get('page') || '1';
    const search = searchParams.get('search');
    
    // Handle fields array format: fields[]=field1&fields[]=field2
    const fields: string[] = [];
    searchParams.forEach((value, key) => {
      if (key === 'fields[]') {
        fields.push(value);
      }
    });
    
    // Handle sort array format: sort[]=field1&sort[]=field2
    const sort: string[] = [];
    searchParams.forEach((value, key) => {
      if (key === 'sort[]') {
        sort.push(value);
      }
    });
    
    // Build query options
    const options: Record<string, unknown> = {
      limit: parseInt(limit),
      page: parseInt(page)
    };
    
    if (fields.length > 0) {
      options.fields = fields;
    }
    
    if (sort.length > 0) {
      options.sort = sort;
    }
    
    if (search) {
      options.search = search;
    }
    
    // Handle filters with Directus format: filter[field][_neq]=value
    const filters: Record<string, Record<string, string>> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter[') && key.includes(']')) {
        // Parse filter[field][operator] format
        const match = key.match(/filter\[([^\]]+)\](\[([^\]]+)\])?/);
        if (match) {
          const field = match[1];
          const operator = match[3] || '_eq'; // Default to _eq if no operator
          
          if (!filters[field]) {
            filters[field] = {};
          }
          filters[field][operator] = value;
        }
      }
    });
    
    if (Object.keys(filters).length > 0) {
      options.filter = filters;
    }
    
    console.log('Events API options:', options);
    
    // Get events from Directus
    try {
      const data = await dataApi.getItems('events', options, cookies);
      
      return NextResponse.json({ 
        success: true, 
        data: data.data || data,
        meta: data.meta,
        collection: 'events'
      });
    } catch (directusError: unknown) {
      // Re-throw all errors to see the real issue
      throw directusError;
    }
  } catch (error: unknown) {
    console.error('Events API error:', error);
    
    const directusError = error as DirectusError;
    return NextResponse.json(
      { 
        error: directusError.response?.data?.errors?.[0]?.message || 'Failed to fetch events',
        details: directusError.response?.data || directusError.message
      },
      { status: directusError.response?.status || 500 }
    );
  }
}