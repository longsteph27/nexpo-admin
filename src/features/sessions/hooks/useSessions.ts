import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSession,
  deleteSessions,
  getAllSessionsForEvent,
  getSession,
  getSessions,
  updateSession,
} from '../api';
import type { SessionListOptions, SessionPayload } from '../types';

const KEY = 'sessions';

export function useSessions(eventId: number | undefined, options: SessionListOptions = {}) {
  return useQuery({
    queryKey: [KEY, eventId, options],
    queryFn: () => getSessions(eventId!, options),
    enabled: !!eventId,
  });
}

export function useAllSessionsForEvent(eventId: number | undefined) {
  return useQuery({
    queryKey: [KEY, 'all', eventId],
    queryFn: () => getAllSessionsForEvent(eventId!),
    enabled: !!eventId,
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => getSession(id!),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: SessionPayload }) => createSession(eventId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SessionPayload> }) => updateSession(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteSessions(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
