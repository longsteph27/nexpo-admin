import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm, useSaveFormWithFields } from './useForms';
import { useAuth } from '@/contexts/AuthContext';
import type { BuilderFormField, BuilderFormLanguage, BuilderFormSettings, Form as FormResponse } from '../types';
import {
  parseFormBuilderData,
  buildFormSavePayload,
  FormBuilderOriginalState,
} from '../services/formBuilderService';

export function useFormBuilder(formId: string, eventId: string) {
  const { selectedTenant } = useAuth();
  const tenantId = selectedTenant?.id;
  const queryClient = useQueryClient();

  // State management
  const [fields, setFields] = useState<BuilderFormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [formLang, setFormLang] = useState<BuilderFormLanguage>({ 'en-US': {}, 'vi-VN': {} });
  const [formSettings, setFormSettings] = useState<BuilderFormSettings>({});
  const [originalState, setOriginalState] = useState<FormBuilderOriginalState>({
    fields: [],
    formTranslations: [],
  });
  const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null);

  // API hooks
  const { data: formData, refetch: refetchForm } = useForm(formId);
  const saveFormWithFieldsMutation = useSaveFormWithFields();

  const isSaving = saveFormWithFieldsMutation.isPending;

  // Reset all state after successful save
  const resetFormState = useCallback(() => {
    setFields([]);
    setSelectedId(null);
    setFormLang({ 'en-US': {}, 'vi-VN': {} });
    setFormSettings({});
    setOriginalState({ fields: [], formTranslations: [] });
    setBaselineSnapshot(null);
    setActiveLang('en-US');
  }, []);

  // Process form data when it loads
  useEffect(() => {
    if (formData === undefined) return;

    const parsed = parseFormBuilderData(formData as FormResponse | null);
    setFields(parsed.fields);
    setFormLang(parsed.formLang);
    setFormSettings(parsed.formSettings);
    setOriginalState({
      fields: parsed.originalFields,
      formTranslations: parsed.originalFormTranslations,
    });
    const snapshot = JSON.stringify({
      fields: parsed.fields,
      formLang: parsed.formLang,
      formSettings: parsed.formSettings,
    });
    setBaselineSnapshot(snapshot);
  }, [formData]);

  // Save form
  const handleSave = useCallback(() => {
    if (!formId || !eventId || !tenantId) return;

    const payload = buildFormSavePayload({
      eventId,
      tenantId: Number(tenantId),
      formLang,
      formSettings,
      fields,
      originalFields: originalState.fields,
      originalFormTranslations: originalState.formTranslations,
    });

    saveFormWithFieldsMutation.mutate(
      {
        formId,
        eventId,
        tenantId: Number(tenantId),
        formData: payload,
      },
      {
        onSuccess: async () => {
          toast.success('Form saved successfully!', {
            description: 'All changes have been saved to Directus.',
          });

          resetFormState();

          try {
            await refetchForm();
            queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
            queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
          } catch {
            toast.error('Form saved but failed to reload data', {
              description: 'Please refresh the page to see the latest changes.',
            });
          }
        },
        onError: (error) => {
          toast.error('Failed to save form', {
            description: error.message,
          });
        },
      }
    );
  }, [formId, eventId, tenantId, formLang, formSettings, fields, originalState, saveFormWithFieldsMutation, resetFormState, refetchForm, queryClient]);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ fields, formLang, formSettings }),
    [fields, formLang, formSettings]
  );
  const hasChanges = baselineSnapshot !== null && currentSnapshot !== baselineSnapshot;
  const canSave =
    Boolean(formId && eventId && tenantId) &&
    baselineSnapshot !== null &&
    hasChanges &&
    !isSaving;

  // Computed values
  const selected = useMemo(() => fields.find((f) => f.id === selectedId) || null, [fields, selectedId]);

  return {
    // State
    fields,
    selectedId,
    setSelectedId,
    activeLang,
    setActiveLang,
    formLang,
    setFormLang,
    formSettings,
    setFormSettings,
    // Computed
    selected,
    isSaving,
    savedForm: formData ?? null,
    canSave,
    
    // Actions
    handleSave,
    setFields,
    resetFormState,
  };
}
