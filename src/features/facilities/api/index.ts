import directus from '@/lib/directus';
import { readItems, readItem, createItem, updateItem, deleteItem, deleteItems, aggregate } from '@directus/sdk';
import type { Facility, FacilityCategory, FacilityListOptions, FacilityListResponse } from '../types';

export const facilitiesApi = {
  async getFacilities(eventId: number, options: FacilityListOptions = {}): Promise<FacilityListResponse> {
    const { page = 1, limit = 20, status, category_id, search } = options;
    const offset = (page - 1) * limit;

    const baseFilter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) baseFilter.status = { _eq: status };
    if (category_id) baseFilter.category_id = { _eq: category_id };

    const filter = search
      ? {
          _and: [
            baseFilter,
            {
              _or: [
                { name: { _icontains: search } },
                { name_vi: { _icontains: search } },
                { description: { _icontains: search } },
              ],
            },
          ],
        }
      : baseFilter;

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('facilities', {
          filter,
          fields: [
            'id', 'status', 'name', 'name_vi', 'description', 'description_vi',
            'dimension', 'price', 'price_usd', 'date_created', 'date_updated',
            'image.id',
            'category_id.id', 'category_id.name',
            'sub_category_id.id', 'sub_category_id.name',
          ] as any,
          sort: ['sort', 'name'] as any,
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('facilities', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]);

    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return {
      facilities: data as unknown as Facility[],
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async getFacility(id: string): Promise<Facility> {
    const data = await directus.request(
      readItem('facilities', id, {
        fields: [
          'id', 'status', 'name', 'name_vi', 'description', 'description_vi',
          'dimension', 'price', 'price_usd', 'event_id', 'tenant_id',
          'image.id',
          'category_id.id', 'category_id.name',
          'sub_category_id.id', 'sub_category_id.name',
        ] as any,
      })
    );
    return data as unknown as Facility;
  },

  async createFacility(payload: Omit<Partial<Facility>, 'id'>): Promise<Facility> {
    const data = await directus.request(createItem('facilities', payload as any));
    return data as unknown as Facility;
  },

  async updateFacility(id: string, payload: Partial<Facility>): Promise<Facility> {
    const data = await directus.request(updateItem('facilities', id, payload as any));
    return data as unknown as Facility;
  },

  async deleteFacility(id: string): Promise<void> {
    await directus.request(deleteItem('facilities', id));
  },

  async deleteFacilities(ids: string[]): Promise<void> {
    await directus.request(deleteItems('facilities', ids));
  },

  async getCategories(eventId: number): Promise<FacilityCategory[]> {
    const data = await directus.request(
      readItems('facility_categories', {
        filter: { status: { _eq: 'published' } },
        fields: ['id', 'name', 'status'] as any,
        sort: ['name'] as any,
        limit: -1,
      })
    );
    return data as unknown as FacilityCategory[];
  },
};
