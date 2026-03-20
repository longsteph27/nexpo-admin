import directus from '@/lib/directus';
import { readItems, createItem, updateItem, updateItems, deleteItems } from '@directus/sdk';
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
    const data = await directus.request(
      readItems('meeting_slots' as any, {
        filter,
        fields: [
          'id', 'status', 'label', 'start_at', 'end_at', 'location', 'date_created',
          'meeting_id.id',
          'meeting_id.registration_id.full_name',
          'meeting_id.registration_id.email',
          'meeting_id.exhibitor_id.translations.company_name',
          'meeting_id.exhibitor_id.translations.languages_code',
        ] as any,
        sort: ['start_at'] as any,
        limit: -1,
      })
    );
    return data as MeetingSlot[];
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
