import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAgendaEvent,
  deleteAgendaEvent,
  getAgendaEvent,
  getAgendaEvents,
  getAllAgendaEvents,
  getAgendaTracks,
  getAgendaSpeakerJunctions,
  updateAgendaEvent,
  updateAgendaEventStatus,
} from '../api';
import type { Agenda, AgendaListOptions, AgendaPayload, AgendaTrack } from '../types';

const AGENDA_EVENTS_KEY = 'agenda_events';

export function useAgendaEvent(id: string | undefined) {
  return useQuery({
    queryKey: [AGENDA_EVENTS_KEY, 'detail', id],
    queryFn: () => getAgendaEvent(id!),
    enabled: !!id,
  });
}

export function useAgendaEvents(eventId: number | undefined, options: AgendaListOptions = {}) {
  return useQuery({
    queryKey: [AGENDA_EVENTS_KEY, eventId, options],
    queryFn: () => getAgendaEvents(eventId!, options),
    enabled: !!eventId,
  });
}

export function useCreateAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: AgendaPayload }) =>
      createAgendaEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_EVENTS_KEY] });
    },
  });
}

export function useUpdateAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgendaPayload> }) =>
      updateAgendaEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_EVENTS_KEY] });
    },
  });
}

export function useDeleteAgendaEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAgendaEvent(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_EVENTS_KEY] });
    },
  });
}

export function useBulkUpdateAgendaEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      payload,
    }: {
      ids: string[];
      payload: Partial<AgendaPayload>;
    }) => {
      await Promise.all(ids.map((id) => updateAgendaEvent(id, payload)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_EVENTS_KEY] });
    },
  });
}

export function useAgendaTracks(eventId: number | undefined) {
  return useQuery({
    queryKey: [AGENDA_EVENTS_KEY, 'tracks', eventId],
    queryFn: () => getAgendaTracks(eventId!),
    enabled: !!eventId,
  });
}

export function useAllAgendaEvents(eventId: number | undefined) {
  return useQuery({
    queryKey: [AGENDA_EVENTS_KEY, 'all', eventId],
    queryFn: () => getAllAgendaEvents(eventId!),
    enabled: !!eventId,
  });
}

export function useAgendaSpeakerJunctions(agendaId: string | undefined) {
  return useQuery({
    queryKey: [AGENDA_EVENTS_KEY, 'speaker-junctions', agendaId],
    queryFn: () => getAgendaSpeakerJunctions(agendaId!),
    enabled: !!agendaId,
  });
}

export function useUpdateAgendaEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAgendaEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_EVENTS_KEY] });
    },
  });
}
