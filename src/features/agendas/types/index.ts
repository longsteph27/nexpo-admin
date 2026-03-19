import type { LanguageCode } from '@/types/directus-collections';

export interface AgendaTrack {
  id: string;
  track_slug: string;
  default_name: string;
  track_color?: string | null;
  sort?: number;
  event_id?: number | null;
  translations?: Array<{ languages_code: string; name: string }>;
}

export interface AgendaTranslation {
  id?: number;
  languages_code: LanguageCode | string;
  title?: string;
  description?: string | null;
}

export interface AgendaSpeaker {
  id: string;
  name: string;
  photo?: string | null;
  avatar?: string | null;
  position?: string | null;
}

export interface Agenda {
  id: string;
  status?: string;
  sort?: number;
  event_id?: number;
  date?: string | null;
  day_number?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  session_type?: string | null;
  is_featured?: boolean;
  track_id?: string | null;
  speakers?: AgendaSpeaker[];
  translations?: AgendaTranslation[];
  date_created?: string;
  date_updated?: string;
}

export interface AgendaListOptions {
  search?: string;
  page?: number;
  limit?: number;
  eventId?: number;
}

export interface AgendaPayload {
  id?: string;
  status?: string;
  sort?: number;
  date?: string | null;
  day_number?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  session_type?: string | null;
  is_featured?: boolean;
  track_id?: string | null;
  event_id: number;
  speakers?: {
    create?: Array<{ speakers_id: { id: string } }>;
    delete?: number[];
  };
  translations?: {
    create?: Array<{
      languages_code: { code: LanguageCode | string };
      title?: string;
      description?: string;
    }>;
    update?: Array<{
      id: number;
      title?: string;
      description?: string;
    }>;
    delete?: number[];
  };
}

export type AgendaWithDetails = Agenda & {
  // resolved fields can be added here as needed
};
