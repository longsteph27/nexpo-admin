export interface FormAnswer {
  id: string;
  value?: string;
  field?: {
    id: string;
    name: string;
    type: string;
    translations?: Array<{
      languages_code: string;
      label?: string;
    }>;
  };
}

export interface FormSubmission {
  id: string;
  date_sumitted?: string;
  status?: string;
  form?: {
    id: string;
    translations?: Array<{
      languages_code: string;
      title?: string;
    }>;
  };
  answers?: FormAnswer[];
}

export interface Registration {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  checkin_status?: boolean;
  date_created?: string;
  badge_id?: string;
  redeem_id?: string;
  submissions?: FormSubmission | null;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RegistrationsResponse {
  registrations: Registration[];
  pagination: PaginationData;
}

