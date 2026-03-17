import directus from '@/lib/directus';
import { readItems, updateItem, updateItems, aggregate } from '@directus/sdk';
import type { JobRequirement, JobApplication, JobListOptions, JobListResponse, ApplicationListOptions, ApplicationListResponse } from '../types';

export const jobsApi = {
  async getJobs(eventId: number, options: JobListOptions = {}): Promise<JobListResponse> {
    const { page = 1, limit = 20, search, status } = options;
    const offset = (page - 1) * limit;
    const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) filter.status = { _eq: status };
    if (search) filter._or = [
      { job_title: { _icontains: search } },
      { exhibitor_id: { translations: { company_name: { _icontains: search } } } },
    ];
    const [data, countResult] = await Promise.all([
      directus.request(readItems('job_requirements', {
        filter,
        fields: [
          'id', 'status', 'job_title', 'employment_type', 'quantity', 'salary_range',
          'date_created', 'event_id',
          'exhibitor_id.id',
          'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name',
        ] as any,
        sort: ['-date_created' as any],
        limit,
        offset,
      })),
      directus.request(aggregate('job_requirements', { aggregate: { count: ['id'] }, query: { filter } })),
    ]);
    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return { jobs: data as unknown as JobRequirement[], total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateJob(id: string, payload: Partial<JobRequirement>): Promise<JobRequirement> {
    const data = await directus.request(updateItem('job_requirements', id, payload));
    return data as unknown as JobRequirement;
  },

  async getApplications(eventId: number, options: ApplicationListOptions = {}): Promise<ApplicationListResponse> {
    const { page = 1, limit = 20, status, jobId } = options;
    const offset = (page - 1) * limit;
    const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) filter.status = { _eq: status };
    if (jobId) filter.job_id = { _eq: jobId };
    const [data, countResult] = await Promise.all([
      directus.request(readItems('job_applications', {
        filter,
        fields: [
          'id', 'status', 'notes', 'date_created', 'event_id',
          'job_id.id', 'job_id.job_title', 'job_id.employment_type',
          'exhibitor_id.id',
          'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name',
          'registration_id.id', 'registration_id.full_name',
          'registration_id.email', 'registration_id.phone_number',
          'registration_id.submissions.answers.value', 'registration_id.submissions.answers.field.name',
        ] as any,
        sort: ['-date_created' as any],
        limit,
        offset,
      })),
      directus.request(aggregate('job_applications', { aggregate: { count: ['id'] }, query: { filter } })),
    ]);
    const total = Number((countResult as any)[0]?.count?.id ?? 0);
    return { applications: data as unknown as JobApplication[], total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateApplication(id: string, payload: Partial<JobApplication>): Promise<JobApplication> {
    const data = await directus.request(updateItem('job_applications', id, payload));
    return data as unknown as JobApplication;
  },

  async bulkUpdateApplications(ids: string[], payload: Partial<JobApplication>): Promise<void> {
    await directus.request(updateItems('job_applications', ids, payload));
  },
};
