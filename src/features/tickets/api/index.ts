import directus from '@/lib/directus';
import { readItems, readItem, updateItem, updateItems, deleteItems, createItem, aggregate } from '@directus/sdk';
import type { SupportTicket, SupportTicketWithDetails, TicketReply, TicketListOptions, TicketListResponse } from '../types';

export const ticketsApi = {
  async getTickets(eventId: number, options: TicketListOptions = {}): Promise<TicketListResponse> {
    const { page = 1, limit = 20, status, sort = '-date_created', search } = options;
    const offset = (page - 1) * limit;

    const baseFilter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) baseFilter.status = { _eq: status };

    const filter = search
      ? {
          _and: [
            baseFilter,
            {
              _or: [
                { subject: { _icontains: search } },
                { message: { _icontains: search } },
                { exhibitor_id: { translations: { company_name: { _icontains: search } } } },
              ],
            },
          ],
        }
      : baseFilter;

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('support_tickets', {
          filter,
          fields: [
            'id', 'status', 'priority', 'date_created', 'date_updated', 'subject', 'message',
            'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
            'exhibitor_id.translations.company_name', 'exhibitor_id.logo.id',
            'replies.id', 'replies.date_created', 'replies.message', 'replies.sender_type',
          ] as any,
          sort: [sort as any],
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('support_tickets', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]);

    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return {
      tickets: data as unknown as SupportTicketWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getTicket(id: string): Promise<SupportTicketWithDetails> {
    const data = await directus.request(
      readItem('support_tickets', id, {
        fields: [
          'id', 'status', 'priority', 'date_created', 'date_updated', 'subject', 'message',
          'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name', 'exhibitor_id.logo.id',
          'replies.id', 'replies.date_created', 'replies.message',
          'replies.sender_type', 'replies.user_created.first_name',
          'replies.user_created.last_name', 'replies.user_created.email',
        ] as any,
      })
    );
    return data as unknown as SupportTicketWithDetails;
  },

  async updateTicket(id: string, payload: Partial<SupportTicket>): Promise<SupportTicket> {
    const data = await directus.request(updateItem('support_tickets', id, payload));
    return data as unknown as SupportTicket;
  },

  async bulkUpdateTickets(ids: string[], payload: Partial<SupportTicket>): Promise<void> {
    await directus.request(updateItems('support_tickets', ids, payload));
  },

  async bulkDeleteTickets(ids: string[]): Promise<void> {
    await directus.request(deleteItems('support_tickets', ids));
  },

  async addReply(ticketId: string, message: string): Promise<TicketReply> {
    const data = await directus.request(
      createItem('support_ticket_replies', {
        ticket_id: ticketId,
        message,
        sender_type: 'support',
      } as any)
    );
    return data as unknown as TicketReply;
  },
};
