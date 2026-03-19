import type { Session, SessionListOptions, SessionPayload } from '../types';
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItems, aggregate } from '@directus/sdk';

const FIELDS = [
  'id', 'status', 'sort', 'event_id', 'agenda_id',
  'start_time', 'end_time', 'location', 'session_type',
  'speaker_name', 'speaker_title', 'speaker_company', 'speaker_photo',
  'speaker_id',
  'translations.id', 'translations.languages_code', 'translations.title', 'translations.description',
  'date_created', 'date_updated',
];

export async function getSessions(
  eventId: number,
  options: SessionListOptions = {}
): Promise<{ sessions: Session[]; total: number }> {
  const { page = 1, limit = 20, search, agendaId } = options;
  const offset = (page - 1) * limit;

  const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
  if (agendaId) filter.agenda_id = { _eq: agendaId };
  if (search) {
    filter._or = [
      { translations: { title: { _icontains: search } } },
      { speaker_name: { _icontains: search } },
      { location: { _icontains: search } },
    ];
  }

  const [sessions, countResult] = await Promise.all([
    directus.request(readItems('sessions' as any, { fields: FIELDS as any, filter, limit, offset, sort: ['start_time', 'sort'] as any })),
    directus.request(aggregate('sessions' as any, { aggregate: { count: ['id'] }, query: { filter } })),
  ]).catch((err) => {
    console.error('[sessions] getSessions error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  });

  return {
    sessions: sessions as Session[],
    total: Number((countResult as any)[0]?.count?.id ?? sessions.length),
  };
}

export async function getAllSessionsForEvent(eventId: number): Promise<Session[]> {
  return directus.request(
    readItems('sessions' as any, {
      fields: FIELDS as any,
      filter: { event_id: { _eq: eventId } } as any,
      sort: ['start_time', 'sort'] as any,
      limit: -1,
    })
  ).catch((err) => {
    console.error('[sessions] getAllSessionsForEvent error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  }) as Promise<Session[]>;
}

export async function getSession(id: string): Promise<Session> {
  const items = await directus.request(
    readItems('sessions' as any, { fields: FIELDS as any, filter: { id: { _eq: id } }, limit: 1 })
  );
  return (items as Session[])[0];
}

export async function createSession(eventId: number, data: SessionPayload): Promise<Session> {
  return directus.request(createItem('sessions' as any, { ...data, event_id: eventId } as any)).catch((err) => {
    console.error('[sessions] createSession error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  }) as Promise<Session>;
}

export async function updateSession(id: string, data: Partial<SessionPayload>): Promise<Session> {
  return directus.request(updateItem('sessions' as any, id, data as any)).catch((err) => {
    console.error('[sessions] updateSession error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  }) as Promise<Session>;
}

export async function deleteSessions(ids: string[]): Promise<void> {
  return directus.request(deleteItems('sessions' as any, ids)).catch((err) => {
    console.error('[sessions] deleteSessions error:', JSON.stringify(err?.errors ?? err?.message ?? err));
    throw err;
  });
}
