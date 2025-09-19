import { getItems, getItemById, createItem, updateItem, deleteItem } from '@/services/directus';

// Event interface
export interface Event {
  id: number;
  tenant_id?: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  sort?: number;
  event_users?: EventUser[];
  sites?: Site[];
  forms?: Form[];
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface EventUser {
  id: number;
  event_id: number;
  user_id: string;
  status: string;
}

export interface Site {
  id: number;
  domain: string;
  status: string;
}

export interface Form {
  id: string;
  title: string;
  status: string;
}

export interface EventsResponse {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'archived' | 'all';
  search?: string;
  sort?: string;
  fields?: string[];
}

// Query functions for events
export async function fetchEvents(
  filters: EventFilters = {},
  cookies?: string
): Promise<EventsResponse | undefined> {
  const {
    page = 1,
    limit = 15,
    status = 'all',
    search,
    sort = '-date_created',
    fields = [
      'id',
      'name',
      'description',
      'start_date',
      'end_date',
      'location',
      'status',
      'tenant_id',
      'user_created',
      'date_created',
      'event_users',
      'sites',
      'forms'
    ]
  } = filters;

  const options: any = {
    fields,
    sort: [sort],
    limit,
    offset: (page - 1) * limit,
    meta: 'total_count'
  };

  // Add status filter
  if (status && status !== 'all') {
    options.filter = {
      status: {
        _neq: status === 'archived' ? 'archived' : status
      }
    };
  }

  // Add search filter
  if (search) {
    options.filter = {
      ...options.filter,
      name: {
        _icontains: search
      }
    };
  }

  const result = await getItems('events', options, cookies);
  
  if (!result) return undefined;

  return {
    data: result.data || [],
    meta: {
      total: result.meta?.total_count || 0,
      page,
      limit,
      totalPages: Math.ceil((result.meta?.total_count || 0) / limit)
    }
  };
}

export async function fetchEventById(
  id: string | number,
  cookies?: string
): Promise<Event | undefined> {
  return getItemById('events', id, {
    fields: [
      'id',
      'name',
      'description',
      'start_date',
      'end_date',
      'location',
      'status',
      'tenant_id',
      'user_created',
      'date_created',
      'event_users',
      'sites',
      'forms'
    ]
  }, cookies);
}

export async function createEvent(
  eventData: Partial<Event>,
  cookies?: string
): Promise<Event | undefined> {
  return createItem('events', eventData, cookies);
}

export async function updateEvent(
  id: string | number,
  eventData: Partial<Event>,
  cookies?: string
): Promise<Event | undefined> {
  return updateItem('events', id, eventData, cookies);
}

export async function deleteEvent(
  id: string | number,
  cookies?: string
): Promise<boolean | undefined> {
  return deleteItem('events', id, cookies);
}

export async function fetchEventsByStatus(
  status: 'draft' | 'published' | 'archived',
  cookies?: string
): Promise<EventsResponse | undefined> {
  return fetchEvents({ status }, cookies);
}

export async function searchEvents(
  searchTerm: string,
  cookies?: string
): Promise<EventsResponse | undefined> {
  return fetchEvents({ search: searchTerm }, cookies);
}

export async function fetchUpcomingEvents(
  cookies?: string
): Promise<EventsResponse | undefined> {
  return fetchEvents({
    status: 'published',
    // Note: This would need proper date filtering implementation
    // For now, we'll get all published events and filter client-side
  }, cookies);
}

export async function fetchPastEvents(
  cookies?: string
): Promise<EventsResponse | undefined> {
  return fetchEvents({
    status: 'published',
    // Note: This would need proper date filtering implementation
    // For now, we'll get all published events and filter client-side
  }, cookies);
}
