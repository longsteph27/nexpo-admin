export interface SessionTranslation {
  id?: number;
  languages_code: string;
  title?: string;
  description?: string | null;
}

export interface Session {
  id: string;
  status?: string;
  sort?: number;
  event_id?: number;
  agenda_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  session_type?: string | null;
  speaker_name?: string | null;
  speaker_title?: string | null;
  speaker_company?: string | null;
  speaker_photo?: string | null;
  speaker_id?: string | null;
  translations?: SessionTranslation[];
  date_created?: string;
  date_updated?: string;
}

export interface SessionPayload {
  status?: string;
  sort?: number;
  event_id: number;
  agenda_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  session_type?: string | null;
  speaker_name?: string | null;
  speaker_title?: string | null;
  speaker_company?: string | null;
  speaker_id?: string | null;
  translations?: {
    create?: Array<{ languages_code: { code: string }; title?: string; description?: string }>;
    update?: Array<{ id: number; title?: string; description?: string }>;
    delete?: number[];
  };
}

export interface SessionListOptions {
  page?: number;
  limit?: number;
  search?: string;
  agendaId?: string;
}
