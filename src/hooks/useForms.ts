import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi } from '@/lib/api/forms';

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
  // Debug: Log formId to check if it's a string or object
  if (typeof formId !== 'string') {
    console.error('[useForm] ERROR: formId is not a string!', { formId, type: typeof formId });
  } else {
    console.log('[useForm] Using formId:', formId);
  }
  
  return useQuery({
    queryKey: formKeys.detail(formId),
    queryFn: () => {
      console.log('[useForm] queryFn called with formId:', formId, 'type:', typeof formId);
      return formsApi.getForm(formId);
    },
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
      // Invalidate the specific form in cache to force refetch
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.formId) });
      // Invalidate forms list for the event
      queryClient.invalidateQueries({ queryKey: formKeys.list(variables.eventId) });
    },
  });
}

// Save form with fields mutation (new create/update/delete mechanism)
export function useSaveFormWithFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, eventId, tenantId, formData }: { formId: string; eventId: string; tenantId: number; formData: unknown }) => 
      formsApi.saveFormWithFields(formId, eventId, tenantId, formData),
    onSuccess: (data, variables) => {
      // Invalidate the specific form in cache to force refetch
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.formId) });
      // Invalidate forms list for the event
      queryClient.invalidateQueries({ queryKey: formKeys.list(variables.eventId) });
    },
  });
}

// Create form mutation
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, tenantId, formData }: { eventId: string; tenantId: number; formData: unknown }) => 
      formsApi.createForm(eventId, tenantId, formData),
    onSuccess: (data, variables) => {
      // Invalidate forms list for the event
      queryClient.invalidateQueries({ queryKey: formKeys.list(variables.eventId) });
    },
  });
}

// Update email template mutation
export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, templateEmail, qrCodeField, templateEmailGroup }: { formId: string; templateEmail?: string; qrCodeField?: string; templateEmailGroup?: string }) => 
      formsApi.updateEmailTemplate(formId, templateEmail, qrCodeField, templateEmailGroup),
    onSuccess: (data, variables) => {
      // Invalidate the specific form in cache to force refetch
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.formId) });
    },
  });
}
