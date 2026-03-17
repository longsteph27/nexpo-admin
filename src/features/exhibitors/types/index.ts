export interface ExhibitorTranslation {
  id?: string;
  languages_code?: string;
  company_name?: string;
  company_description?: string;
}

export interface Exhibitor {
  id: string;
  status: 'published' | 'draft' | 'archived';
  user_id?: string | { id: string; email?: string } | null;
  representative_name?: string;
  representative_email?: string;
  representative_phone?: string;
  representative_position?: string;
  address?: string;
  website?: string;
  tel?: string;
  fax?: string;
  zip_code?: string;
  introduction_video?: string;
  logo?: string | { id: string; filename_download?: string } | null;
  cover?: string | { id: string } | null;
  industry_id?: string | { id: string; translations?: { languages_code?: string; category?: string }[] } | null;
  country?: string | { id: string; name?: string } | null;
  translations?: ExhibitorTranslation[];
}

export interface ExhibitorEvent {
  id: string;
  status: 'published' | 'draft' | 'archived';
  exhibitor_id: string | Exhibitor;
  event_id: number;
  booth_number?: string;
  nameboard?: string;
  representative_name?: string;
  representative_position?: string;
  representative_email?: string;
  representative_phone?: string;
  introduction_video?: string;
  badge_quantity?: number;
  access_code?: string;
  vip_pass_quantity?: number;
  vip_pass_remain?: number;
  vip_pass_access_code?: string;
  date_created?: string;
  date_updated?: string;
}

export interface ExhibitorEventWithDetails extends Omit<ExhibitorEvent, 'exhibitor_id'> {
  exhibitor_id: Exhibitor;
}

export interface ExhibitorListOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface ExhibitorListResponse {
  exhibitorEvents: ExhibitorEventWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}
