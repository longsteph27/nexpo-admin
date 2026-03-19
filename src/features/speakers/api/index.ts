import type { Speaker, SpeakerListOptions, SpeakerPayload } from '../types';
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItems, aggregate } from '@directus/sdk';

export async function getSpeakers(
  eventId: number,
  options: SpeakerListOptions = {}
): Promise<{ speakers: Speaker[]; total: number }> {
  const { search, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const filter: Record<string, unknown> = { event_id: { _eq: eventId } };

  if (search) {
    filter._or = [
      { name: { _icontains: search } },
      { position: { _icontains: search } },
      { company: { _icontains: search } },
      { translations: { bio: { _icontains: search } } },
    ];
  }

  const fields = [
    'id', 'status', 'sort', 'event_id', 'name', 'position', 'company',
    'photo', 'avatar', 'linkedin_url', 'bio', 'social_links',
    'translations.id', 'translations.languages_code', 'translations.bio',
    'translations.name', 'translations.title', 'translations.company',
    'date_created', 'date_updated',
  ];

  const [speakers, countResult] = await Promise.all([
    directus.request(
      readItems('speakers' as any, { fields, filter, limit, offset, sort: ['sort', 'name'] })
    ),
    directus.request(
      aggregate('speakers' as any, { aggregate: { count: ['id'] }, query: { filter } })
    ),
  ]).catch((err) => {
    console.error('[speakers] getSpeakers error:', err?.errors ?? err?.message ?? err);
    throw err;
  });

  const total = Number((countResult as any)[0]?.count?.id ?? speakers.length);

  return { speakers: speakers as Speaker[], total };
}

export async function getSpeaker(id: string): Promise<Speaker> {
  const item = await directus.request(
    readItems('speakers' as any, {
      fields: [
        'id',
        'status',
        'sort',
        'event_id',
        'name',
        'position',
        'company',
        'photo',
        'avatar',
        'linkedin_url',
        'bio',
        'social_links',
        'translations.id',
        'translations.languages_code',
        'translations.bio',
        'translations.name',
        'translations.title',
        'translations.company',
        'date_created',
        'date_updated',
      ],
      filter: { id: { _eq: id } },
      limit: 1,
    })
  );
  return item[0] as Speaker;
}

export async function createSpeaker(eventId: number, data: SpeakerPayload): Promise<Speaker> {
  const payload = { ...data, event_id: eventId };
  return directus.request(createItem('speakers' as any, payload as any)).catch((err) => {
    console.error('[speakers] createSpeaker error:', err);
    throw err;
  }) as Promise<Speaker>;
}

export async function updateSpeaker(id: string, data: Partial<SpeakerPayload>): Promise<Speaker> {
  return directus
    .request(updateItem('speakers' as any, id, data as any))
    .catch((err) => {
      console.error('[speakers] updateSpeaker error:', id, err);
      throw err;
    }) as Promise<Speaker>;
}

export async function deleteSpeakers(ids: string[]): Promise<void> {
  return directus.request(deleteItems('speakers' as any, ids)).catch((err) => {
    console.error('[speakers] deleteSpeakers error:', ids, err);
    throw err;
  });
}
