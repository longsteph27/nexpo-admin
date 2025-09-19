import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/directus';
import { COLLECTIONS } from '@/types/collections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { collection } = await params;
    const { searchParams } = new URL(request.url);
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    // Parse query parameters
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const page = searchParams.get('page');
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
    const options: any = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    if (page) options.page = parseInt(page);
    if (fields.length > 0) options.fields = fields;
    if (sort.length > 0) options.sort = sort;
    if (search) options.search = search;
    
    // Handle filters with Directus format: filter[field][_neq]=value
    const filters: Record<string, any> = {};
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
    
        // Get data from Directus
        try {
          const data = await dataApi.getItems(collection, options, cookies);

          return NextResponse.json({
            success: true,
            data,
            collection
          });
        } catch (directusError: any) {
          // Re-throw all errors to see the real issue
          throw directusError;
        }
  } catch (error: any) {
    console.error('Collection API error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to fetch collection data',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { collection } = await params;
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const body = await request.json();
    
    // Create item in Directus
    const data = await dataApi.createItem(collection, body);
    
    return NextResponse.json({ 
      success: true, 
      data,
      collection 
    });
  } catch (error: any) {
    console.error('Create item error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to create item',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
