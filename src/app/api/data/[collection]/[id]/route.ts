import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/directus';
import { COLLECTIONS } from '@/types/collections';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { collection, id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const fields = searchParams.get('fields');
    const options: any = {};
    if (fields) options.fields = fields.split(',');
    
    // Get item from Directus
    const data = await dataApi.getItem(collection, id, options, cookies);
    
    return NextResponse.json({ 
      success: true, 
      data,
      collection,
      id 
    });
  } catch (error: any) {
    console.error('Get item error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to fetch item',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { collection, id } = await params;
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const body = await request.json();
    
    // Update item in Directus
    const data = await dataApi.updateItem(collection, id, body, cookies);
    
    return NextResponse.json({ 
      success: true, 
      data,
      collection,
      id 
    });
  } catch (error: any) {
    console.error('Update item error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to update item',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const cookies = request.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { collection, id } = await params;
    
    // Validate collection name
    if (!COLLECTIONS.includes(collection as any)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }
    
    // Delete item from Directus
    await dataApi.deleteItem(collection, id, cookies);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item deleted successfully',
      collection,
      id 
    });
  } catch (error: any) {
    console.error('Delete item error:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.errors?.[0]?.message || 'Failed to delete item',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
