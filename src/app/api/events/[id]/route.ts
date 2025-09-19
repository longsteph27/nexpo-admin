import { NextRequest, NextResponse } from 'next/server';
import { directusAxios } from '@/lib/directus';
import { permissionService } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
        // Check if user has read permission
        const userResponse = await directusAxios.get('/user/me', {
          headers: {
            'Cookie': cookies
          }
        });
    
    const user = userResponse.data.data;
    const canRead = await permissionService.canUserPerformAction(user.id, 'events', 'read', cookies);
    
    if (!canRead) {
      return NextResponse.json(
        { error: 'Insufficient permissions to read events' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    
    const response = await directusAxios.get(`/items/events/${eventId}`, {
      params: {
        fields: 'id,name,description,start_date,end_date,location,status,tenant_id,user_created,date_created,event_users,sites,forms'
      },
      headers: {
        'Cookie': cookies
      }
    });

    return NextResponse.json({
      data: response.data.data
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Event not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
        // Check if user has update permission
        const userResponse = await directusAxios.get('/user/me', {
          headers: {
            'Cookie': cookies
          }
        });
    
    const user = userResponse.data.data;
    const canUpdate = await permissionService.canUserPerformAction(user.id, 'events', 'update', cookies);
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update events' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();

    // Update event
    const response = await directusAxios.patch(`/items/events/${eventId}`, body, {
      headers: {
        'Cookie': cookies
      }
    });

    return NextResponse.json({
      data: response.data.data,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
        // Check if user has delete permission
        const userResponse = await directusAxios.get('/user/me', {
          headers: {
            'Cookie': cookies
          }
        });
    
    const user = userResponse.data.data;
    const canDelete = await permissionService.canUserPerformAction(user.id, 'events', 'delete', cookies);
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete events' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    
    await directusAxios.delete(`/items/events/${eventId}`, {
      headers: {
        'Cookie': cookies
      }
    });

    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
