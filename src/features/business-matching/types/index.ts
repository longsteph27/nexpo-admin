export type BusinessRequirementStatus = 'draft' | 'published' | 'closed' | 'archived';
export type BusinessRequirementType = 'buyer' | 'distributor' | 'supplier' | 'partner' | 'investor' | 'other';

export type BusinessMatchSuggestionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'converted_to_meeting'
  | 'archived';

export interface BusinessRequirement {
  id: string;
  status: BusinessRequirementStatus;
  event_id: number;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  form_submission_id?: string;
  requirement_type: BusinessRequirementType;
  target_markets?: string[];
  industry_focus?: string[];
  company_size_preference?: string[];
  partnership_goals?: string;
  must_have_criteria?: unknown;
  nice_to_have_criteria?: unknown;
  summary?: string;
  date_created?: string;
  date_updated?: string;
}

export interface BusinessMatchSuggestion {
  id: string;
  status: BusinessMatchSuggestionStatus;
  event_id: number;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  registration_id?: string | { id: string; full_name?: string; email?: string; phone_number?: string };
  business_requirement_id?: string | { id: string; requirement_type?: string; summary?: string };
  source?: 'ai_matching';
  score?: number;
  matched_criteria?: unknown;
  ai_reasoning?: string;
  organizer_note?: string;
  date_reviewed?: string;
  date_created?: string;
  date_updated?: string;
}
