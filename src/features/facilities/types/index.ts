export type FacilityStatus = 'published' | 'draft' | 'archived';

export interface FacilityCategory {
  id: string;
  name: string;
  status: string;
}

export interface Facility {
  id: string;
  status: FacilityStatus;
  event_id?: number;
  tenant_id?: number;
  category_id?: string | FacilityCategory;
  sub_category_id?: string | FacilityCategory;
  name: string;
  name_vi?: string;
  description?: string;
  description_vi?: string;
  image?: string | { id: string } | null;
  dimension?: string;
  price?: number;       // VND — tenant admin sets this
  price_usd?: number;   // USD — portal displays this
  date_created?: string;
  date_updated?: string;
}

export interface FacilityListOptions {
  page?: number;
  limit?: number;
  status?: FacilityStatus | '';
  category_id?: string;
  search?: string;
}

export interface FacilityListResponse {
  facilities: Facility[];
  total: number;
  page: number;
  totalPages: number;
}
