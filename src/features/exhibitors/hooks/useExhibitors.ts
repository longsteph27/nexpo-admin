import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exhibitorsApi } from '../api';
import type { ExhibitorEvent, ExhibitorListOptions } from '../types';

export function useExhibitorEvents(eventId: number, options: ExhibitorListOptions = {}) {
  return useQuery({
    queryKey: ['exhibitor_events', eventId, options],
    queryFn: () => exhibitorsApi.getExhibitorEvents(eventId, options),
    enabled: !!eventId,
  });
}

export function useExhibitorEvent(id: string) {
  return useQuery({
    queryKey: ['exhibitor_event', id],
    queryFn: () => exhibitorsApi.getExhibitorEvent(id),
    enabled: !!id,
  });
}

export function useUpdateExhibitorEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExhibitorEvent> }) =>
      exhibitorsApi.updateExhibitorEvent(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exhibitor_event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibitor_events'] });
    },
  });
}

export function useCreateExhibitorEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ExhibitorEvent>) =>
      exhibitorsApi.createExhibitorEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitor_events'] });
    },
  });
}

export function useBulkUpdateExhibitorEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Partial<ExhibitorEvent> }) =>
      exhibitorsApi.bulkUpdateExhibitorEvents(ids, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exhibitor_events'] }),
  });
}

/** Returns a map of { exhibitorId → booth_number } for a given event, cached by React Query */
export function useBoothMap(eventId: number) {
  return useQuery({
    queryKey: ['booth_map', eventId],
    queryFn: () => exhibitorsApi.getBoothMap(eventId),
    enabled: !!eventId,
    staleTime: 60_000, // 1 min — booth assignments rarely change mid-session
  });
}
