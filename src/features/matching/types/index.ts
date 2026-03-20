export type MatchRequestStatus =
  | 'pending'
  | 'organizer_approved'
  | 'exhibitor_agreed'
  | 'exhibitor_declined'
  | 'organizer_rejected'
  | 'converted_to_meeting';

export type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type MeetingSource = 'manual' | 'ai_matching' | 'visitor_request' | 'organizer_shortlist';
export type MeetingType = 'physical' | 'virtual';
export type MeetingCategory = 'talent' | 'business';

export type MatchRequestType = 'business' | 'interview';

export interface VisitorMatchRequest {
  id: string;
  status: MatchRequestStatus;
  request_type?: MatchRequestType;
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

export interface MeetingSlotConfig {
  id: string;
  status: 'active' | 'inactive';
  mode: 'flexible' | 'slot';
  event_id?: number;
  meeting_category?: 'all' | 'talent' | 'business' | null;
  slot_duration_minutes?: number | null;
  break_minutes?: number | null;
  max_per_exhibitor?: number | null;
  max_per_visitor?: number | null;
  date_created?: string;
  date_updated?: string;
  slots?: MeetingSlot[];
}

export interface MeetingSlot {
  id: string;
  status: 'available' | 'booked' | 'disabled';
  config_id?: string;
  event_id?: number;
  label?: string | null;
  start_at: string;
  end_at: string;
  location?: string | null;
  meeting_id?: string | { id: string; registration_id?: { full_name?: string; email?: string } | string } | null;
  date_created?: string;
}

export interface Meeting {
  id: string;
  status: MeetingStatus;
  source?: MeetingSource;
  meeting_category?: MeetingCategory;
  date_created?: string;
  match_request_id?: string;
  match_suggestion_id?: string;
  business_requirement_id?: string | { id: string; requirement_type?: string; summary?: string };
  business_match_suggestion_id?: string;
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
  visitor_note?: string;
  outcome_note?: string;
  slot_id?: string | MeetingSlot | null;
}

export interface MatchListOptions {
  page?: number;
  limit?: number;
  status?: MatchRequestStatus | '';
  sort?: string;
  search?: string;
  request_type?: MatchRequestType;
}

export interface MatchListResponse {
  requests: VisitorMatchRequestWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}
