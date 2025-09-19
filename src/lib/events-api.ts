import { apiClient } from './api-client';

// Event interface based on schema-events.json
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
  // Add other event_user fields as needed
}

export interface Site {
  id: number;
  domain: string;
  status: string;
  // Add other site fields as needed
}

export interface Form {
  id: string;
  title: string;
  status: string;
  // Add other form fields as needed
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

interface QueryParams {
  page: number;
  limit: number;
  fields: string;
  sort: string;
  filter?: {
    status?: { _eq: string };
    name?: { _icontains: string };
  };
}

export class EventsApiService {
  /**
   * Get all events with optional filtering and pagination
   */
  static async getEvents(filters: EventFilters = {}): Promise<EventsResponse> {
    try {
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

      // Build query parameters
      const queryParams: QueryParams = {
        page,
        limit,
        fields: fields.join(','),
        sort
      };

      // Add status filter if provided and not 'all'
      if (status && status !== 'all') {
        queryParams.filter = {
          status: {
            _eq: status
          }
        };
      }

      // Add search filter if provided
      if (search) {
        queryParams.filter = {
          ...queryParams.filter,
          name: {
            _icontains: search
          }
        };
      }

      // Build query string for our internal API
      const queryString = new URLSearchParams();
      queryString.append('page', page.toString());
      queryString.append('limit', limit.toString());
      queryString.append('sort', sort);
      
      if (status && status !== 'all') {
        queryString.append('status', status);
      }
      
      if (search) {
        queryString.append('search', search);
      }

      const response = await apiClient.get(`/api/events?${queryString.toString()}`);
      const data = await response.json();

      return {
        data: data.data || [],
        meta: {
          total: data.meta?.total || 0,
          page: data.meta?.page || page,
          limit: data.meta?.limit || limit,
          totalPages: data.meta?.totalPages || Math.ceil((data.meta?.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(id: string | number): Promise<Event> {
    try {
      const response = await apiClient.get(`/api/events/${id}`);
      const data = await response.json();

      return data.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      // Validate required fields
      if (!eventData.name || !eventData.start_date) {
        throw new Error('Name and start_date are required');
      }

      const response = await apiClient.post('/api/events', {
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        status: eventData.status || 'draft',
        tenant_id: eventData.tenant_id || 1,
        sort: eventData.sort
      });

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(id: string | number, eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await apiClient.put(`/api/events/${id}`, eventData);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: string | number): Promise<void> {
    try {
      await apiClient.delete(`/api/events/${id}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  /**
   * Get events by status
   */
  static async getEventsByStatus(status: 'draft' | 'published' | 'archived'): Promise<EventsResponse> {
    return this.getEvents({ status });
  }

  /**
   * Search events by name
   */
  static async searchEvents(searchTerm: string): Promise<EventsResponse> {
    return this.getEvents({ search: searchTerm });
  }

  /**
   * Get upcoming events (published events with start_date in the future)
   */
  static async getUpcomingEvents(): Promise<EventsResponse> {
    return this.getEvents({
      status: 'published',
      // Note: This would need proper date filtering implementation
      // For now, we'll get all published events and filter client-side
    });
  }

  /**
   * Get past events (published events with end_date in the past)
   */
  static async getPastEvents(): Promise<EventsResponse> {
    return this.getEvents({
      status: 'published',
      // Note: This would need proper date filtering implementation
      // For now, we'll get all published events and filter client-side
    });
  }

  /**
   * Get events count by status
   */
  static async getEventsCount(status?: 'draft' | 'published' | 'archived'): Promise<number> {
    try {
      const queryString = new URLSearchParams();
      queryString.append('limit', '1'); // Only need count, not data
      
      if (status) {
        queryString.append('status', status);
      }

      const response = await apiClient.get(`/api/events?${queryString.toString()}`);
      const data = await response.json();
      return data.meta?.total || 0;
    } catch (error) {
      console.error('Error fetching events count:', error);
      return 0;
    }
  }
}

// Export singleton instance for backward compatibility
export const eventsApi = {
  getEvents: EventsApiService.getEvents,
  getEventById: EventsApiService.getEventById,
  createEvent: EventsApiService.createEvent,
  updateEvent: EventsApiService.updateEvent,
  deleteEvent: EventsApiService.deleteEvent,
  getEventsByStatus: EventsApiService.getEventsByStatus,
  searchEvents: EventsApiService.searchEvents,
  getUpcomingEvents: EventsApiService.getUpcomingEvents,
  getPastEvents: EventsApiService.getPastEvents,
  getEventsCount: EventsApiService.getEventsCount
};