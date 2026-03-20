import directus from '@/lib/directus';
import { readItems, readItem, updateItem, updateItems, deleteItems, createItem, aggregate } from '@directus/sdk';
import type { VisitorMatchRequest, VisitorMatchRequestWithDetails, Meeting, MatchListOptions, MatchListResponse } from '../types';

export const matchingApi = {
  async getMatchRequests(eventId: number, options: MatchListOptions = {}): Promise<MatchListResponse> {
    const { page = 1, limit = 20, status, sort = '-date_created', search, request_type } = options;
    const offset = (page - 1) * limit;

    const baseFilter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) baseFilter.status = { _eq: status };
    if (request_type) baseFilter.request_type = { _eq: request_type };

    const filter = search
      ? {
          _and: [
            baseFilter,
            {
              _or: [
                { message: { _icontains: search } },
                { organizer_note: { _icontains: search } },
                { exhibitor_id: { translations: { company_name: { _icontains: search } } } },
              ],
            },
          ],
        }
      : baseFilter;

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('visitor_match_requests', {
          filter,
          fields: [
            'id', 'status', 'date_created', 'message', 'preferred_meeting_time',
            'organizer_note', 'organizer_approved_at', 'exhibitor_responded_at',
            'exhibitor_id.id',
            'exhibitor_id.translations.languages_code',
            'exhibitor_id.translations.company_name',
            'exhibitor_id.logo.id',
            'registration_id.id',
            'registration_id.full_name',
            'registration_id.email',
            'registration_id.phone_number',
            'registration_id.submissions.answers.value',
            'registration_id.submissions.answers.field.translations.languages_code',
            'registration_id.submissions.answers.field.translations.label',
          ] as any,
          sort: [sort as any],
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('visitor_match_requests', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]);

    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return {
      requests: data as unknown as VisitorMatchRequestWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getMatchRequest(id: string): Promise<VisitorMatchRequestWithDetails> {
    const data = await directus.request(
      readItem('visitor_match_requests', id, {
        fields: [
          'id', 'status', 'date_created', 'date_updated', 'message',
          'preferred_meeting_time', 'organizer_note', 'organizer_approved_at',
          'exhibitor_responded_at',
          'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name', 'exhibitor_id.logo.id',
          'registration_id.id',
        ] as any,
      })
    );
    return data as unknown as VisitorMatchRequestWithDetails;
  },

  async bulkUpdateMatchRequests(ids: string[], payload: Partial<VisitorMatchRequest>): Promise<void> {
    await directus.request(updateItems('visitor_match_requests', ids, payload));
  },

  async bulkDeleteMatchRequests(ids: string[]): Promise<void> {
    await directus.request(deleteItems('visitor_match_requests', ids));
  },

  async updateMatchRequest(id: string, payload: Partial<VisitorMatchRequest>): Promise<VisitorMatchRequest> {
    const data = await directus.request(updateItem('visitor_match_requests', id, payload));
    return data as unknown as VisitorMatchRequest;
  },

  async getMeetings(eventId: number): Promise<Meeting[]> {
    const data = await directus.request(
      readItems('meetings', {
        filter: { event_id: { _eq: eventId } },
        fields: ['id', 'status', 'scheduled_at', 'location', 'meeting_type', 'duration_minutes', 'notes', 'match_request_id', 'exhibitor_id', 'registration_id'] as any,
        sort: ['-scheduled_at' as any],
        limit: 100,
      })
    );
    return data as unknown as Meeting[];
  },

  async createMeeting(payload: Partial<Meeting>): Promise<Meeting> {
    const data = await directus.request(createItem('meetings', payload as any));
    return data as unknown as Meeting;
  },

  async updateMeeting(id: string, payload: Partial<Meeting>): Promise<Meeting> {
    const data = await directus.request(updateItem('meetings', id, payload));
    return data as unknown as Meeting;
  },

  async bulkDeleteMeetings(ids: string[]): Promise<void> {
    await directus.request(deleteItems('meetings' as any, ids));
  },
};
