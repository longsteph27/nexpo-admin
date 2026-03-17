import directus from '@/lib/directus';
import { aggregate, readItems, updateItems, deleteItems } from '@directus/sdk';

export interface EventStats {
  registrations: number;
  checkedIn: number;
  exhibitors: number;
  leads: number;
  matchRequests: number;
  openTickets: number;
  pendingOrders: number;
  profileViews: number;
}

export interface LeadWithExhibitor {
  id: string;
  date_created?: string;
  attendee_name?: string;
  attendee_email?: string;
  attendee_company?: string;
  status?: 'hot' | 'warm' | 'cold';
  notes?: string;
  exhibitor_id?: {
    id: string;
    translations?: { languages_code?: string; company_name?: string }[];
  };
}

export const dashboardApi = {
  async getEventStats(eventId: number): Promise<EventStats> {
    const [
      regResult, checkinResult, exhibitorResult, leadResult,
      matchResult, ticketResult, orderResult, viewResult,
    ] = await Promise.all([
      // Total registrations
      directus.request(aggregate('registrations', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId } } },
      })),
      // Checked in
      directus.request(aggregate('registrations', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, checkin_status: { _eq: true } } },
      })),
      // Exhibitors
      directus.request(aggregate('exhibitor_events', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, status: { _eq: 'published' } } },
      })),
      // Leads
      directus.request(aggregate('leads', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId } } },
      })),
      // Pending match requests
      directus.request(aggregate('visitor_match_requests', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, status: { _eq: 'pending' } } },
      })),
      // Open tickets
      directus.request(aggregate('support_tickets', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, status: { _in: ['open', 'in_progress'] } } },
      })),
      // Pending orders
      directus.request(aggregate('facility_orders', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, status: { _eq: 'submitted' } } },
      })),
      // Profile views
      directus.request(aggregate('exhibitor_profile_views', {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId } } },
      })),
    ]);

    return {
      registrations: Number((regResult as any)[0]?.count?.id ?? 0),
      checkedIn: Number((checkinResult as any)[0]?.count?.id ?? 0),
      exhibitors: Number((exhibitorResult as any)[0]?.count?.id ?? 0),
      leads: Number((leadResult as any)[0]?.count?.id ?? 0),
      matchRequests: Number((matchResult as any)[0]?.count?.id ?? 0),
      openTickets: Number((ticketResult as any)[0]?.count?.id ?? 0),
      pendingOrders: Number((orderResult as any)[0]?.count?.id ?? 0),
      profileViews: Number((viewResult as any)[0]?.count?.id ?? 0),
    };
  },

  async getLeads(eventId: number, options: { page?: number; limit?: number; search?: string } = {}): Promise<{ leads: LeadWithExhibitor[]; total: number }> {
    const { page = 1, limit = 30, search } = options;
    const offset = (page - 1) * limit;

    const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (search) {
      filter._or = [
        { attendee_name: { _icontains: search } },
        { attendee_email: { _icontains: search } },
        { attendee_company: { _icontains: search } },
      ];
    }

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('leads', {
          filter,
          fields: [
            'id', 'date_created', 'attendee_name', 'attendee_email',
            'attendee_company', 'status', 'notes',
            'exhibitor_id.id',
            'exhibitor_id.translations.languages_code',
            'exhibitor_id.translations.company_name',
          ] as any,
          sort: ['-date_created' as any],
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('leads', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]);

    return {
      leads: data as unknown as LeadWithExhibitor[],
      total: Number((countResult as any)[0]?.count?.id ?? 0),
    };
  },

  async bulkUpdateLeads(ids: string[], payload: Partial<LeadWithExhibitor>): Promise<void> {
    await directus.request(updateItems('leads', ids, payload as any));
  },

  async bulkDeleteLeads(ids: string[]): Promise<void> {
    await directus.request(deleteItems('leads', ids));
  },
};
