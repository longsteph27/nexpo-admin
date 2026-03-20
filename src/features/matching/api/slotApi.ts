import directus from '@/lib/directus';
import { readItems, createItem, updateItem, updateItems, deleteItems, aggregate } from '@directus/sdk';
import type { MeetingSlotConfig, MeetingSlot } from '../types';

export const slotApi = {
  async getConfig(eventId: number): Promise<MeetingSlotConfig | null> {
    const data = await directus.request(
      readItems('meeting_slot_configs' as any, {
        filter: { event_id: { _eq: eventId }, status: { _eq: 'active' } },
        fields: ['id', 'status', 'mode', 'event_id', 'meeting_category', 'slot_duration_minutes', 'break_minutes', 'max_per_exhibitor', 'max_per_visitor', 'date_updated'] as any,
        limit: 1,
      })
    ) as MeetingSlotConfig[];
    return data[0] ?? null;
  },

  async upsertConfig(eventId: number, payload: Partial<MeetingSlotConfig>): Promise<MeetingSlotConfig> {
    const existing = await slotApi.getConfig(eventId);
    if (existing) {
      const updated = await directus.request(updateItem('meeting_slot_configs' as any, existing.id, payload));
      return updated as MeetingSlotConfig;
    }
    const created = await directus.request(createItem('meeting_slot_configs' as any, { ...payload, event_id: eventId, status: 'active' }));
    return created as MeetingSlotConfig;
  },

  async getSlots(eventId: number, options?: { status?: string; date?: string }): Promise<MeetingSlot[]> {
    const filter: any = { event_id: { _eq: eventId } };
    if (options?.status) filter.status = { _eq: options.status };
    if (options?.date) {
      filter.start_at = { _between: [`${options.date}T00:00:00`, `${options.date}T23:59:59`] };
    }
    const [slots, meetingCounts] = await Promise.all([
      directus.request(
        readItems('meeting_slots' as any, {
          filter,
          fields: ['id', 'status', 'label', 'start_at', 'end_at', 'location', 'date_created'] as any,
          sort: ['start_at'] as any,
          limit: -1,
        })
      ) as Promise<MeetingSlot[]>,
      directus.request(
        aggregate('meetings' as any, {
          aggregate: { count: ['id'] },
          query: {
            filter: { event_id: { _eq: eventId }, slot_id: { _nnull: true } },
            groupBy: ['slot_id'],
          },
        } as any)
      ).catch(() => [] as any[]),
    ]);

    const countMap = new Map<string, number>();
    for (const row of (meetingCounts as any[])) {
      const slotId = typeof row.slot_id === 'string' ? row.slot_id : row.slot_id?.id;
      if (slotId) countMap.set(slotId, Number(row.count?.id ?? 0));
    }

    return (slots as MeetingSlot[]).map(s => ({ ...s, meeting_count: countMap.get(s.id) ?? 0 }));
  },

  async checkConflicts(eventId: number, slotId: string, exhibitorId: string, visitorRegistrationId: string, maxPerExhibitor: number | null, maxPerVisitor: number | null): Promise<{ blocked: false } | { blocked: true; reason: string }> {
    const [visitorInSlot, exhibitorInSlot, visitorTotal] = await Promise.all([
      // visitor already has a meeting in this slot?
      directus.request(aggregate('meetings' as any, {
        aggregate: { count: ['id'] },
        query: { filter: { event_id: { _eq: eventId }, slot_id: { _eq: slotId }, registration_id: { _eq: visitorRegistrationId } } },
      } as any)),
      // how many meetings does this exhibitor have in this slot?
      maxPerExhibitor != null
        ? directus.request(aggregate('meetings' as any, {
            aggregate: { count: ['id'] },
            query: { filter: { event_id: { _eq: eventId }, slot_id: { _eq: slotId }, exhibitor_id: { _eq: exhibitorId } } },
          } as any))
        : Promise.resolve([{ count: { id: 0 } }]),
      // total meetings for this visitor?
      maxPerVisitor != null
        ? directus.request(aggregate('meetings' as any, {
            aggregate: { count: ['id'] },
            query: { filter: { event_id: { _eq: eventId }, registration_id: { _eq: visitorRegistrationId } } },
          } as any))
        : Promise.resolve([{ count: { id: 0 } }]),
    ]);

    if (Number((visitorInSlot as any)[0]?.count?.id ?? 0) > 0)
      return { blocked: true, reason: 'Visitor đã có meeting trong khung giờ này' };

    if (maxPerExhibitor != null && Number((exhibitorInSlot as any)[0]?.count?.id ?? 0) >= maxPerExhibitor)
      return { blocked: true, reason: `Exhibitor đã đạt giới hạn ${maxPerExhibitor} meeting/slot` };

    if (maxPerVisitor != null && Number((visitorTotal as any)[0]?.count?.id ?? 0) >= maxPerVisitor)
      return { blocked: true, reason: `Visitor đã đạt giới hạn ${maxPerVisitor} meetings` };

    return { blocked: false };
  },

  async createSlots(slots: Partial<MeetingSlot>[]): Promise<MeetingSlot[]> {
    const results = await Promise.all(
      slots.map(s => directus.request(createItem('meeting_slots' as any, s)))
    );
    return results as MeetingSlot[];
  },

  async updateSlot(id: string, payload: Partial<MeetingSlot>): Promise<MeetingSlot> {
    const data = await directus.request(updateItem('meeting_slots' as any, id, payload));
    return data as MeetingSlot;
  },

  async bulkUpdateSlots(ids: string[], payload: Partial<MeetingSlot>): Promise<void> {
    await directus.request(updateItems('meeting_slots' as any, ids, payload));
  },

  async deleteSlots(ids: string[]): Promise<void> {
    await directus.request(deleteItems('meeting_slots' as any, ids));
  },

  /** Generate slots from time window */
  generateSlotTimes(date: string, startTime: string, endTime: string, durationMin: number, breakMin: number): { start_at: string; end_at: string }[] {
    const slots: { start_at: string; end_at: string }[] = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let cursor = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const step = durationMin + breakMin;
    while (cursor + durationMin <= endMinutes) {
      const startH = String(Math.floor(cursor / 60)).padStart(2, '0');
      const startM = String(cursor % 60).padStart(2, '0');
      const endC = cursor + durationMin;
      const endH = String(Math.floor(endC / 60)).padStart(2, '0');
      const endM = String(endC % 60).padStart(2, '0');
      slots.push({
        start_at: `${date}T${startH}:${startM}:00`,
        end_at: `${date}T${endH}:${endM}:00`,
      });
      cursor += step;
    }
    return slots;
  },
};
