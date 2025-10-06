import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Event } from '@/lib/directus';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (tenantId: string, status?: string) => [...eventKeys.lists(), { tenantId, status }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Get events hook
export function useEvents(status?: string) {
  const { selectedTenant } = useAuth();
  
  return useQuery({
    queryKey: eventKeys.list(String(selectedTenant?.id || ''), status),
    queryFn: () => eventsApi.getEvents(String(selectedTenant?.id || ''), status, ['id','name','start_date','end_date','location','status','logo'] as (keyof Event)[]),
    enabled: !!selectedTenant?.id,
    select: (data) => data.data || [],
  });
}

// Get single event hook
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventsApi.getEvent(eventId),
    enabled: !!eventId,
    select: (data) => data.data,
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { selectedTenant } = useAuth();

  return useMutation({
    mutationFn: (eventData: Partial<Event>) => eventsApi.createEvent(eventData),
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: Partial<Event> }) => 
      eventsApi.updateEvent(eventId, eventData),
    onSuccess: (data, variables) => {
      // Update the specific event in cache
      queryClient.setQueryData(eventKeys.detail(variables.eventId), data);
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}
