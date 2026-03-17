import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export function useEventStats(eventId: number) {
  return useQuery({
    queryKey: ['event_stats', eventId],
    queryFn: () => dashboardApi.getEventStats(eventId),
    enabled: !!eventId,
    refetchInterval: 30_000, // refresh every 30s
  });
}

export function useLeads(eventId: number, options: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ['leads_all', eventId, options],
    queryFn: () => dashboardApi.getLeads(eventId, options),
    enabled: !!eventId,
  });
}

export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Record<string, unknown> }) =>
      dashboardApi.bulkUpdateLeads(ids, payload as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads_all'] }),
  });
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => dashboardApi.bulkDeleteLeads(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads_all'] }),
  });
}
