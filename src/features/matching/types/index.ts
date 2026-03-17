export type MatchRequestStatus =
  | 'pending'
  | 'organizer_approved'
  | 'exhibitor_agreed'
  | 'exhibitor_declined'
  | 'organizer_rejected';

export type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type MeetingSource = 'manual' | 'ai_matching';
export type MeetingType = 'physical' | 'virtual';

export interface VisitorMatchRequest {
  id: string;
  status: MatchRequestStatus;
  date_created?: string;
  date_updated?: string;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  registration_id?: string | { id: string; form_answers?: unknown };
  event_id?: number;
  message?: string;
  preferred_meeting_time?: string;
  organizer_note?: string;
  organizer_approved_at?: string;
  exhibitor_responded_at?: string;
}

export interface VisitorMatchRequestWithDetails extends VisitorMatchRequest {
  exhibitor_id: {
    id: string;
    translations?: { languages_code?: string; company_name?: string }[];
    logo?: { id: string } | string | null;
  };
  registration_id: {
    id: string;
    submissions?: {
      answers?: { value?: string; field?: { translations?: { languages_code?: string; label?: string }[] } }[];
    };
  };
}

export interface Meeting {
  id: string;
  status: MeetingStatus;
  source?: MeetingSource;
  date_created?: string;
  match_request_id?: string;
  match_suggestion_id?: string;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  registration_id?: string | { id: string; full_name?: string; email?: string; phone_number?: string; submissions?: { answers?: { value: string; field: { name?: string } }[] } | null };
  job_requirement_id?: string | { id: string; job_title?: string };
  event_id?: number;
  scheduled_at?: string;
  location?: string;
  meeting_type?: MeetingType;
  duration_minutes?: number;
  notes?: string;
  organizer_note?: string;
  exhibitor_note?: string;
}

export interface MatchListOptions {
  page?: number;
  limit?: number;
  status?: MatchRequestStatus | '';
  sort?: string;
  search?: string;
}

export interface MatchListResponse {
  requests: VisitorMatchRequestWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}
