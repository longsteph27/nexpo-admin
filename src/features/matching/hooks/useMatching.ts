import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '../api';
import type { VisitorMatchRequest, Meeting, MatchListOptions } from '../types';

export function useMatchRequests(eventId: number, options: MatchListOptions = {}) {
  return useQuery({
    queryKey: ['match_requests', eventId, options],
    queryFn: () => matchingApi.getMatchRequests(eventId, options),
    enabled: !!eventId,
  });
}

export function useMatchRequest(id: string) {
  return useQuery({
    queryKey: ['match_request', id],
    queryFn: () => matchingApi.getMatchRequest(id),
    enabled: !!id,
  });
}

export function useUpdateMatchRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<VisitorMatchRequest> }) =>
      matchingApi.updateMatchRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match_requests'] });
      queryClient.invalidateQueries({ queryKey: ['match_request'] });
    },
  });
}

export function useBulkUpdateMatchRequests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Partial<VisitorMatchRequest> }) =>
      matchingApi.bulkUpdateMatchRequests(ids, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match_requests'] }),
  });
}

export function useBulkDeleteMatchRequests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => matchingApi.bulkDeleteMatchRequests(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match_requests'] }),
  });
}

export function useMeetings(eventId: number) {
  return useQuery({
    queryKey: ['meetings', eventId],
    queryFn: () => matchingApi.getMeetings(eventId),
    enabled: !!eventId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Meeting>) => matchingApi.createMeeting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Meeting> }) =>
      matchingApi.updateMeeting(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}
