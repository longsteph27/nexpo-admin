import directus from '@/lib/directus';
import { readItems, readItem, updateItem, updateItems, aggregate } from '@directus/sdk';
import type { FacilityOrder, FacilityOrderWithDetails, OrderItem, OrderListOptions, OrderListResponse } from '../types';

export const ordersApi = {
  async getOrders(eventId: number, options: OrderListOptions = {}): Promise<OrderListResponse> {
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
                { ref_number: { _icontains: search } },
                { notes: { _icontains: search } },
                { exhibitor_id: { translations: { company_name: { _icontains: search } } } },
              ],
            },
          ],
        }
      : baseFilter;

    const [data, countResult] = await Promise.all([
      directus.request(
        readItems('facility_orders', {
          filter,
          fields: [
            'id', 'status', 'date_created', 'date_updated', 'ref_number', 'total_amount', 'notes',
            'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
            'exhibitor_id.translations.company_name', 'exhibitor_id.logo.id',
            'items.id', 'items.quantity', 'items.unit_price', 'items.done',
            'items.facility_id.id', 'items.facility_id.name', 'items.facility_id.dimension',
          ] as any,
          sort: [sort as any],
          limit,
          offset,
        })
      ),
      directus.request(
        aggregate('facility_orders', {
          aggregate: { count: ['id'] },
          query: { filter },
        })
      ),
    ]);

    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return {
      orders: data as unknown as FacilityOrderWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getOrder(id: string): Promise<FacilityOrderWithDetails> {
    const data = await directus.request(
      readItem('facility_orders', id, {
        fields: [
          'id', 'status', 'date_created', 'date_updated', 'ref_number', 'total_amount', 'notes',
          'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name', 'exhibitor_id.logo.id',
          'items.id', 'items.quantity', 'items.unit_price', 'items.done',
          'items.facility_id.id', 'items.facility_id.name',
          'items.facility_id.dimension', 'items.facility_id.price',
          'items.facility_id.image.id',
        ] as any,
      })
    );
    return data as unknown as FacilityOrderWithDetails;
  },

  async bulkUpdateOrders(ids: string[], payload: Partial<FacilityOrder>): Promise<void> {
    await directus.request(updateItems('facility_orders', ids, payload));
  },

  async updateOrder(id: string, payload: Partial<FacilityOrder>): Promise<FacilityOrder> {
    const data = await directus.request(updateItem('facility_orders', id, payload));
    return data as unknown as FacilityOrder;
  },

  async updateOrderItem(id: string, payload: Partial<OrderItem>): Promise<OrderItem> {
    const data = await directus.request(updateItem('facility_order_items', id, payload));
    return data as unknown as OrderItem;
  },
};
