import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Event } from '@/lib/directus';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (tenantId: string, status?: string) => [...eventKeys.lists(), { tenantId, status }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export function useEvents(status?: string) {
  const { selectedTenant } = useAuth();
  return useQuery({
    queryKey: eventKeys.list(String(selectedTenant?.id || ''), status),
    queryFn: async () => {
      const result = await eventsApi.getEvents(String(selectedTenant?.id || ''), status, ['id','name','start_date','end_date','location','status','logo'] as (keyof Event)[]);
      return result;
    },
    enabled: !!selectedTenant?.id,
    select: (data) => data.data || [],
  });
}

export function useEvent(eventId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventsApi.getEvent(eventId),
    enabled: !!eventId && isAuthenticated,
    select: (data) => data.data,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventData: Partial<Event>) => eventsApi.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: Partial<Event> }) => 
      eventsApi.updateEvent(eventId, eventData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(eventKeys.detail(variables.eventId), data);
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}



