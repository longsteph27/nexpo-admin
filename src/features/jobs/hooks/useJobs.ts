import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api';
import type { JobListOptions, ApplicationListOptions } from '../types';

export function useJobs(eventId: number, options: JobListOptions = {}) {
  return useQuery({
    queryKey: ['jobs', eventId, options],
    queryFn: () => jobsApi.getJobs(eventId, options),
    enabled: !!eventId,
  });
}

export function useJobApplications(eventId: number, options: ApplicationListOptions = {}) {
  return useQuery({
    queryKey: ['job-applications', eventId, options],
    queryFn: () => jobsApi.getApplications(eventId, options),
    enabled: !!eventId,
  });
}

export function useUpdateJobApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof jobsApi.updateApplication>[1] }) =>
      jobsApi.updateApplication(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job-applications'] }); },
  });
}

export function useBulkUpdateJobApplications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Parameters<typeof jobsApi.bulkUpdateApplications>[1] }) =>
      jobsApi.bulkUpdateApplications(ids, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job-applications'] }); },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof jobsApi.updateJob>[1] }) =>
      jobsApi.updateJob(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); },
  });
}
