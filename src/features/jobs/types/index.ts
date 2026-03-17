export type JobStatus = 'published' | 'draft' | 'closed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'hired' | 'rejected' | 'archived';

export interface JobRequirement {
  id: string;
  status: JobStatus;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  event_id?: number;
  job_title: string;
  employment_type?: EmploymentType;
  quantity?: number;
  salary_range?: string;
  description?: string;
  requirements?: string;
  date_created?: string;
  date_updated?: string;
}

export interface JobApplication {
  id: string;
  status: ApplicationStatus;
  event_id?: number;
  job_id?: string | JobRequirement;
  registration_id?: string | {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    submissions?: { answers?: { value: string; field: { name?: string } }[] } | null;
  };
  submission_id?: string | null;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  notes?: string;
  date_created?: string;
  date_updated?: string;
}

export interface JobListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus | '';
}

export interface JobListResponse {
  jobs: JobRequirement[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApplicationListOptions {
  page?: number;
  limit?: number;
  status?: ApplicationStatus | '';
  jobId?: string;
}

export interface ApplicationListResponse {
  applications: JobApplication[];
  total: number;
  page: number;
  totalPages: number;
}
