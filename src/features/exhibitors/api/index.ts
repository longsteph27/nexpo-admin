import directus from '@/lib/directus';
import { readItems, readItem, createItem, updateItem, updateItems, aggregate } from '@directus/sdk';
import type { ExhibitorEvent, ExhibitorEventWithDetails, ExhibitorListOptions, ExhibitorListResponse } from '../types';

export const exhibitorsApi = {
  async getExhibitorEvents(
    eventId: number,
    options: ExhibitorListOptions = {}
  ): Promise<ExhibitorListResponse> {
    const { page = 1, limit = 20, search, sort = '-date_created' } = options;
    const offset = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      event_id: { _eq: eventId },
    };

    if (search) {
      filter._or = [
        { exhibitor_id: { translations: { name: { _icontains: search } } } },
        { booth_number: { _icontains: search } },
        { nameboard: { _icontains: search } },
        { representative_name: { _icontains: search } },
      ];
    }

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('exhibitor_events', {
          filter,
          fields: [
            'id', 'status', 'booth_number', 'nameboard', 'representative_name',
            'representative_email', 'representative_phone', 'representative_position',
            'badge_quantity', 'date_created', 'event_id',
            'exhibitor_id.id', 'exhibitor_id.status', 'exhibitor_id.representative_name',
            'exhibitor_id.representative_email', 'exhibitor_id.website', 'exhibitor_id.tel',
            'exhibitor_id.logo.id', 'exhibitor_id.logo.filename_download',
            'exhibitor_id.translations.languages_code',
            'exhibitor_id.translations.company_name',
          ] as any,
          sort: [sort as any],
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('exhibitor_events', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]).catch((err) => {
      console.error('[exhibitorsApi] getExhibitorEvents error:', err?.errors ?? err?.message ?? err);
      throw err;
    });

    const total = Number((countResult as any)[0]?.count?.id ?? 0);

    return {
      exhibitorEvents: data as unknown as ExhibitorEventWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getExhibitorEvent(id: string): Promise<ExhibitorEventWithDetails> {
    const data = await directus.request(
      readItem('exhibitor_events', id, {
        fields: [
          'id', 'status', 'booth_number', 'nameboard', 'representative_name',
          'representative_email', 'representative_phone', 'representative_position',
          'introduction_video', 'badge_quantity', 'vip_pass_quantity', 'vip_pass_remain',
          'vip_pass_access_code', 'access_code', 'date_created', 'date_updated', 'event_id',
          'exhibitor_id.id', 'exhibitor_id.status', 'exhibitor_id.representative_name',
          'exhibitor_id.representative_email', 'exhibitor_id.representative_phone',
          'exhibitor_id.representative_position', 'exhibitor_id.address',
          'exhibitor_id.website', 'exhibitor_id.tel', 'exhibitor_id.fax', 'exhibitor_id.zip_code',
          'exhibitor_id.introduction_video',
          'exhibitor_id.user_id.id', 'exhibitor_id.user_id.email',
          'exhibitor_id.logo.id', 'exhibitor_id.logo.filename_download',
          'exhibitor_id.cover.id',
          'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name',
          'exhibitor_id.translations.company_description',
          'exhibitor_id.industry_id.id',
          'exhibitor_id.industry_id.translations.languages_code',
          'exhibitor_id.industry_id.translations.category',
          'exhibitor_id.country.id',
          'exhibitor_id.country.name',
        ] as any,
      })
    );
    return data as unknown as ExhibitorEventWithDetails;
  },

  async updateExhibitorEvent(id: string, payload: Partial<ExhibitorEvent>): Promise<ExhibitorEvent> {
    const data = await directus.request(updateItem('exhibitor_events', id, payload));
    return data as unknown as ExhibitorEvent;
  },

  async createExhibitorEvent(payload: Partial<ExhibitorEvent>): Promise<ExhibitorEvent> {
    const data = await directus.request(createItem('exhibitor_events', payload as any));
    return data as unknown as ExhibitorEvent;
  },

  async bulkUpdateExhibitorEvents(ids: string[], payload: Partial<ExhibitorEvent>): Promise<void> {
    await directus.request(updateItems('exhibitor_events', ids, payload));
  },

  /** Returns a map of { exhibitorId → booth_number } for a given event */
  async getBoothMap(eventId: number): Promise<Record<string, string>> {
    const data = await directus.request(
      readItems('exhibitor_events', {
        filter: { event_id: { _eq: eventId } },
        fields: ['exhibitor_id', 'booth_number'] as any,
        limit: -1,
      })
    );
    const map: Record<string, string> = {};
    for (const row of data as any[]) {
      const eid = typeof row.exhibitor_id === 'object' ? row.exhibitor_id?.id : row.exhibitor_id;
      if (eid && row.booth_number) map[eid] = row.booth_number;
    }
    return map;
  },
};
