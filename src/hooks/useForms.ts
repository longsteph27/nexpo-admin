import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi } from '@/lib/api';

// Query keys
export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (eventId: string) => [...formKeys.lists(), { eventId }] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
};

// Get forms by event hook
export function useFormsByEvent(eventId: string) {
  return useQuery({
    queryKey: formKeys.list(eventId),
    queryFn: () => formsApi.getFormsByEvent(eventId),
    enabled: !!eventId,
    select: (data) => data.data || [],
  });
}

// Get single form hook
export function useForm(formId: string) {
  return useQuery({
    queryKey: formKeys.detail(formId),
    queryFn: () => formsApi.getForm(formId),
    enabled: !!formId,
    select: (data) => data.data,
  });
}

// Save form mutation
export function useSaveForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, eventId, formData }: { formId: string; eventId: string; formData: unknown }) => 
      formsApi.saveForm(formId, eventId, formData),
    onSuccess: (data, variables) => {
      // Update the specific form in cache
      queryClient.setQueryData(formKeys.detail(variables.formId), data);
      // Invalidate forms list for the event
      queryClient.invalidateQueries({ queryKey: formKeys.list(variables.eventId) });
    },
  });
}

// Create form mutation
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, formData }: { eventId: string; formData: unknown }) => 
      formsApi.createForm(eventId, formData),
    onSuccess: (data, variables) => {
      // Invalidate forms list for the event
      queryClient.invalidateQueries({ queryKey: formKeys.list(variables.eventId) });
    },
  });
}
