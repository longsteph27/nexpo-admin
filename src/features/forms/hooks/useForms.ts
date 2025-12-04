import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi } from '../api';
import type { Form, FormPayload, FormSummary } from '../types';

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
  return useQuery<FormSummary[]>({
    queryKey: formKeys.list(eventId),
    queryFn: async () => {
      const response = await formsApi.getFormsByEvent(eventId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get forms by event');
      }
      return response.data ?? [];
    },
    enabled: !!eventId,
  });
}

// Get single form hook
export function useForm(formId: string) {
  return useQuery<Form | null>({
    queryKey: formKeys.detail(formId),
    queryFn: async () => {
      const response = await formsApi.getForm(formId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to get form');
      }
      return response.data ?? null;
    },
    enabled: !!formId,
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
    mutationFn: ({ formId, eventId, tenantId, formData }: { formId: string; eventId: string; tenantId: number; formData: FormPayload }) =>
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
    mutationFn: ({ eventId, tenantId, formData }: { eventId: string; tenantId: number; formData: Partial<FormPayload> }) =>
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
