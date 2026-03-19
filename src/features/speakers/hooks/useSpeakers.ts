import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSpeaker,
  deleteSpeakers,
  getSpeaker,
  getSpeakers,
  updateSpeaker,
} from '../api';
import type { SpeakerListOptions, SpeakerPayload } from '../types';

const SPEAKERS_KEY = 'speakers';

export function useSpeakers(eventId: number | undefined, options: SpeakerListOptions = {}) {
  return useQuery({
    queryKey: [SPEAKERS_KEY, eventId, options],
    queryFn: () => getSpeakers(eventId!, options),
    enabled: !!eventId,
  });
}

export function useSpeaker(id: string | undefined) {
  return useQuery({
    queryKey: [SPEAKERS_KEY, 'detail', id],
    queryFn: () => getSpeaker(id!),
    enabled: !!id,
  });
}

export function useCreateSpeaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: SpeakerPayload }) =>
      createSpeaker(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPEAKERS_KEY] });
    },
  });
}

export function useUpdateSpeaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SpeakerPayload> }) =>
      updateSpeaker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPEAKERS_KEY] });
    },
  });
}

export function useDeleteSpeakers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteSpeakers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPEAKERS_KEY] });
    },
  });
}

export function useBulkUpdateSpeakerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      payload,
    }: {
      ids: string[];
      payload: Partial<SpeakerPayload>;
    }) => {
      await Promise.all(ids.map((id) => updateSpeaker(id, payload)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPEAKERS_KEY] });
    },
  });
}
