import type { Agenda, AgendaListOptions, AgendaPayload, AgendaTrack, AgendaWithDetails } from '../types';
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItems, aggregate } from '@directus/sdk';

// GET /agendas/:id
export async function getAgendaEvent(id: string): Promise<Agenda> {
  const items = await directus.request(
    readItems('agendas' as any, {
      fields: [
        'id',
        'status',
        'sort',
        'event_id',
        'date',
        'day_number',
        'start_time',
        'end_time',
        'location',
        'session_type',
        'is_featured',
        'track_id',
        'speakers.speakers_id.id',
        'speakers.speakers_id.name',
        'speakers.speakers_id.photo',
        'speakers.speakers_id.avatar',
        'translations.id',
        'translations.languages_code',
        'translations.title',
        'translations.description',
        'date_created',
        'date_updated',
      ],
      filter: { id: { _eq: id } },
      limit: 1,
    })
  );
  return items[0] as Agenda;
}

// GET /events/:eventId/agendas
export async function getAgendaEvents(
  eventId: number,
  options: AgendaListOptions = {}
): Promise<{ agendaEvents: Agenda[]; total: number }> {
  const { search, page = 1, limit = 10 } = options;

  const offset = (page - 1) * limit;

  const filter: Record<string, unknown> = { event_id: { _eq: eventId } };

  if (search) {
    filter._or = [
      { translations: { title: { _icontains: search } } },
      { translations: { description: { _icontains: search } } },
    ];
  }

  const [agendaEvents, countResult] = await Promise.all([
    directus.request(
      readItems('agendas' as any, {
        fields: [
          'id',
          'status',
          'sort',
          'event_id',
          'date',
          'day_number',
          'start_time',
          'end_time',
          'location',
          'session_type',
          'is_featured',
          'track_id',
          'translations.id',
          'translations.languages_code',
          'translations.title',
          'translations.description',
          'date_created',
          'date_updated',
        ],
        filter,
        limit,
        offset,
        sort: ['sort', 'date_created'],
      })
    ),
    directus.request(
      aggregate('agendas' as any, {
        aggregate: { count: ['id'] },
        query: { filter },
      })
    ),
  ]).catch((err) => {
    console.error('[agendas] getAgendaEvents error:', err?.errors ?? err?.message ?? err);
    throw err;
  });

  const total = Number((countResult as any)[0]?.count?.id ?? agendaEvents.length);

  return { agendaEvents: agendaEvents as Agenda[], total };
}

// POST /events/:eventId/agendas
export async function createAgendaEvent(eventId: number, data: AgendaPayload): Promise<Agenda> {
  const payload = { ...data, event_id: eventId };
  return directus.request(createItem('agendas' as any, payload as any)).catch((err) => {
    console.error('[agendas] createAgendaEvent error:', err);
    throw err;
  }) as Promise<Agenda>;
}

// PATCH /events/:eventId/agendas/:id
export async function updateAgendaEvent(id: string, data: Partial<AgendaPayload>): Promise<Agenda> {
  return directus
    .request(updateItem('agendas' as any, id, data as any))
    .catch((err) => {
      console.error('[agendas] updateAgendaEvent error:', id, err);
      throw err;
    }) as Promise<Agenda>;
}

// DELETE /events/:eventId/agendas/:id
export async function deleteAgendaEvent(ids: string[]): Promise<void> {
  return directus.request(deleteItems('agendas' as any, ids)).catch((err) => {
    console.error('[agendas] deleteAgendaEvent error:', ids, err);
    throw err;
  });
}

// GET agenda_tracks for an event
export async function getAgendaTracks(eventId: number): Promise<AgendaTrack[]> {
  return directus.request(
    readItems('agenda_tracks' as any, {
      fields: ['id', 'track_slug', 'default_name', 'track_color', 'sort', 'event_id', 'translations.languages_code', 'translations.name'],
      filter: { event_id: { _eq: eventId } } as any,
      sort: ['sort', 'default_name'],
      limit: 50,
    })
  ).catch((err) => {
    console.error('[agendas] getAgendaTracks error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    return [];
  }) as Promise<AgendaTrack[]>;
}

// GET all agendas for schedule view (no pagination)
export async function getAllAgendaEvents(eventId: number): Promise<Agenda[]> {
  return directus.request(
    readItems('agendas' as any, {
      fields: [
        'id', 'status', 'sort', 'event_id', 'date',
        'day_number', 'start_time', 'end_time', 'location',
        'session_type', 'is_featured', 'track_id',
        // M2M: speakers alias → agendas_speakers junction → speakers table
        'speakers.speakers_id.id',
        'speakers.speakers_id.name',
        'speakers.speakers_id.photo',
        'speakers.speakers_id.avatar',
        'translations.id', 'translations.languages_code', 'translations.title', 'translations.description',
      ],
      filter: { event_id: { _eq: eventId } } as any,
      sort: ['day_number', 'start_time', 'sort'],
      limit: -1,
    })
  ).catch((err) => {
    console.error('[agendas] getAllAgendaEvents error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  }) as Promise<Agenda[]>;
}

// GET agendas_speakers junction records for a given agenda
export async function getAgendaSpeakerJunctions(agendaId: string): Promise<Array<{ id: number; speakers_id: string }>> {
  return directus.request(
    readItems('agendas_speakers' as any, {
      fields: ['id', 'speakers_id'],
      filter: { agendas_id: { _eq: agendaId } } as any,
      limit: -1,
    })
  ).catch((err) => {
    console.error('[agendas] getAgendaSpeakerJunctions error:', err?.errors ?? err?.message ?? err);
    return [];
  }) as Promise<Array<{ id: number; speakers_id: string }>>;
}

// PATCH /events/:eventId/agendas/:id/status
export async function updateAgendaEventStatus(
  id: string,
  status: string
): Promise<Agenda> {
  return directus
    .request(updateItem('agendas' as any, id, { status } as any))
    .catch((err) => {
      console.error('[agendas] updateAgendaEventStatus error:', id, status, err);
      throw err;
    }) as Promise<Agenda>;
}
