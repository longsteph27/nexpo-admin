import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm, useSaveFormWithFields } from '@/hooks/useForms';
import { useAuth } from '@/contexts/AuthContext';

export type FormField = {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown>;
  is_group_field?: boolean;
  translations?: {
    'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
    'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
  };
};

export type FormLanguage = {
  'en-US': { id?: string; title?: string; submit_label?: string; success_message?: string };
  'vi-VN': { id?: string; title?: string; submit_label?: string; success_message?: string };
};

export type FormSettings = {
  status?: string;
  on_success?: string;
  redirect_url?: string;
  is_allow_group?: boolean;
  template_email_group?: string;
};

export type FieldChanges = {
  create: any[];
  update: any[];
  delete: string[];
};

export type FormTranslationChanges = {
  create: any[];
  update: any[];
  delete: string[];
};

export function useFormBuilder(formId: string, eventId: string) {
  const router = useRouter();
  const { selectedTenant } = useAuth();
  const tenantId = selectedTenant?.id;
  const queryClient = useQueryClient();

  // State management
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [formLang, setFormLang] = useState<FormLanguage>({ 'en-US': {}, 'vi-VN': {} });
  const [formSettings, setFormSettings] = useState<FormSettings>({});

  // Field changes tracking
  const [fieldChanges, setFieldChanges] = useState<FieldChanges>({
    create: [],
    update: [],
    delete: [],
  });

  // Form translation changes tracking
  const [formTranslationChanges, setFormTranslationChanges] = useState<FormTranslationChanges>({
    create: [],
    update: [],
    delete: [],
  });

  // Original data for comparison
  const [originalParsedFields, setOriginalParsedFields] = useState<any[]>([]);
  const [originalFormTranslations, setOriginalFormTranslations] = useState<any[]>([]);

  // API hooks
  const { data: formData, refetch: refetchForm } = useForm(formId);
  const saveFormWithFieldsMutation = useSaveFormWithFields();

  const isSaving = saveFormWithFieldsMutation.isPending;

  // Helper function to parse field translations
  const parseFieldTranslations = useCallback((field: unknown) => {
    const f = field as { 
      id: string; 
      name?: string; 
      type?: string; 
      width?: string; 
      sort?: number; 
      is_required?: boolean; 
      validation?: string; 
      conditions?: any; 
      is_group_field?: boolean;
      translations?: Array<{ 
        id?: string; 
        languages_code: string; 
        label?: string; 
        placeholder?: string; 
        help?: string; 
        options?: string | null 
      }> 
    };
    
    const fieldTranslations = f.translations || [];
    const enFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'en-US');
    const viFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'vi-VN');

    // Parse options if they exist
    const parseOptions = (optionsStr: string | null) => {
      if (!optionsStr) return undefined;
      try {
        return JSON.parse(optionsStr);
      } catch {
        return undefined;
      }
    };

    return {
      id: f.id,
      name: f.name,
      type: f.type,
      width: f.width,
      sort: f.sort,
      is_required: f.is_required,
      validation: f.validation,
      conditions: f.conditions,
      is_group_field: f.is_group_field,
      translations: {
        'en-US': {
          id: enFieldTranslation?.id,
          label: enFieldTranslation?.label || '',
          placeholder: enFieldTranslation?.placeholder || '',
          help: enFieldTranslation?.help || '',
          options: parseOptions(enFieldTranslation?.options || null)
        },
        'vi-VN': {
          id: viFieldTranslation?.id,
          label: viFieldTranslation?.label || '',
          placeholder: viFieldTranslation?.placeholder || '',
          help: viFieldTranslation?.help || '',
          options: parseOptions(viFieldTranslation?.options || null)
        },
      }
    };
  }, []);

  // Helper function to process field translations (object format) with create/update/delete structure
  const processFieldTranslations = useCallback((currentTranslations: any, originalTranslations: any = {}) => {
    if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
      return {
        create: [],
        update: [],
        delete: [],
      };
    }

    const translationsPayload: any = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[]
    };

    const languages = ['en-US', 'vi-VN'];

    for (const lang of languages) {
      const current = currentTranslations[lang];
      const original = originalTranslations[lang];

      if (current) {
        // Convert object format to array format for API
        const translationData = {
          languages_code: { code: lang },
          label: current.label || '',
          placeholder: current.placeholder || '',
          help: current.help || '',
          options: current.options || []
        };

        if (original && original.id) {
          // Update existing translation
          translationsPayload.update.push({
            id: original.id,
            ...translationData
          });
        } else {
          // Create new translation
          translationsPayload.create.push(translationData);
        }
      }
    }

    return translationsPayload;
  }, []);

  // Helper function to compare field objects deeply
  const areFieldsEqual = useCallback((field1: any, field2: any) => {
    if (!field1 || !field2) return false;

    // Compare basic fields
    const basicFieldsEqual = (
      field1.name === field2.name &&
      field1.type === field2.type &&
      field1.width === field2.width &&
      field1.sort === field2.sort &&
      field1.is_required === field2.is_required &&
      field1.validation === field2.validation &&
      field1.is_group_field === field2.is_group_field &&
      JSON.stringify(field1.conditions || null) === JSON.stringify(field2.conditions || null)
    );

    // Compare translations deeply
    const translationsEqual = JSON.stringify(field1.translations || {}) === JSON.stringify(field2.translations || {});

    return basicFieldsEqual && translationsEqual;
  }, []);

  // Form translation changes tracking
  const updateFormTranslationChanges = useCallback(() => {
    const newTranslationChanges = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[],
    };

    // Process each language
    const languages = ['en-US', 'vi-VN'] as const;

    for (const lang of languages) {
      const currentTranslation = formLang[lang];
      const originalTranslation = originalFormTranslations.find((t: any) => t.languages_code === lang);

      if (currentTranslation && Object.keys(currentTranslation).length > 0) {
        if (originalTranslation) {
          // Check if translation has changes (normalize empty strings and undefined)
          const normalizeValue = (value: any) => value || '';
          const hasChanges = (
            normalizeValue(currentTranslation.title) !== normalizeValue(originalTranslation.title) ||
            normalizeValue(currentTranslation.submit_label) !== normalizeValue(originalTranslation.submit_label) ||
            normalizeValue(currentTranslation.success_message) !== normalizeValue(originalTranslation.success_message)
          );

          if (hasChanges) {
            newTranslationChanges.update.push({
              id: currentTranslation.id,
              languages_code: lang,
              title: currentTranslation.title || '',
              submit_label: currentTranslation.submit_label || '',
              success_message: currentTranslation.success_message || '',
            });
          }
        } else if (currentTranslation.title || currentTranslation.submit_label || currentTranslation.success_message) {
          // New translation
          newTranslationChanges.create.push({
            languages_code: lang,
            title: currentTranslation.title || '',
            submit_label: currentTranslation.submit_label || '',
            success_message: currentTranslation.success_message || '',
          });
        }
      } else if (originalTranslation) {
        // Translation was deleted
        newTranslationChanges.delete.push(originalTranslation.id);
      }
    }

    setFormTranslationChanges(newTranslationChanges);
  }, [formLang, originalFormTranslations]);

  // Optimized field changes tracking
  const updateFieldChanges = useCallback(() => {
    const newFieldChanges = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[],
    };

    // Track processed field IDs to avoid duplicates
    const processedIds = new Set<string>();

    // 1. Process new fields (have _payload) - these are always creates
    for (const field of fields) {
      if ((field as any)._payload) {
        // Ensure payload uses current field data (basic fields + translations)
        let finalPayload = (field as any)._payload;

        // Check if payload needs to be synced with current field state
        const payloadNeedsSync = (
          (field as any)._payload.name !== field.name ||
          (field as any)._payload.type !== field.type ||
          (field as any)._payload.width !== field.width ||
          (field as any)._payload.sort !== field.sort ||
          (field as any)._payload.is_required !== field.is_required ||
          (field as any)._payload.validation !== field.validation ||
          (field as any)._payload.is_group_field !== field.is_group_field ||
          JSON.stringify((field as any)._payload.conditions) !== JSON.stringify(field.conditions)
        );

        if (payloadNeedsSync) {
          // Update payload with current field data (basic fields)
          finalPayload = {
            ...(field as any)._payload,
            name: field.name,
            type: field.type,
            width: field.width,
            sort: field.sort,
            is_required: field.is_required,
            validation: field.validation,
            conditions: field.conditions,
            is_group_field: field.is_group_field,
          };
        }

        // If field has translations but payload translations are outdated, update them
        if (field.translations && (field as any)._payload.translations) {
          const updatedPayloadTranslations = {
            ...(field as any)._payload.translations,
            create: (field as any)._payload.translations.create.map((t: any) => {
              const langCode = t.languages_code?.code;
              const currentTranslation = field.translations[langCode];

              return {
                ...t,
                label: currentTranslation?.label !== undefined ? currentTranslation.label : t.label,
                placeholder: currentTranslation?.placeholder !== undefined ? currentTranslation.placeholder : t.placeholder,
                help: currentTranslation?.help !== undefined ? currentTranslation.help : t.help,
                options: currentTranslation?.options !== undefined ? currentTranslation.options : t.options,
              };
            })
          };

          finalPayload = {
            ...finalPayload,
            translations: updatedPayloadTranslations
          };
        }

        newFieldChanges.create.push(finalPayload);
        processedIds.add(field.id);
      }
    }

    // 2. Process existing fields - check for changes
    const originalFieldIds = new Set(originalParsedFields.map((f: any) => f.id));

    for (const field of fields) {
      if (field.id && originalFieldIds.has(field.id) && !processedIds.has(field.id)) {
        const originalField = originalParsedFields.find((f: any) => f.id === field.id);
        if (originalField) {
          const fieldHasChanges = !areFieldsEqual(field, originalField);

          if (fieldHasChanges) {
            const fieldData = {
              id: field.id,
              name: field.name,
              type: field.type,
              width: field.width,
              sort: field.sort,
              is_required: field.is_required,
              validation: field.validation,
              conditions: field.conditions,
              is_group_field: field.is_group_field,
              event_id: Number(eventId),
              tenant_id: Number(tenantId),
              translations: processFieldTranslations(field.translations || {}, originalField.translations || {}),
            };
            newFieldChanges.update.push(fieldData);
          }
          processedIds.add(field.id);
        }
      }
    }

    // 3. Find deleted fields
    for (const originalField of originalParsedFields) {
      if (!processedIds.has(originalField.id)) {
        newFieldChanges.delete.push(originalField.id);
      }
    }

    console.log('[FormBuilder] Updating field changes:', { 
      fields: fields.length, 
      originalParsedFields: originalParsedFields.length,
      newFieldChanges 
    });
    setFieldChanges(newFieldChanges);
  }, [fields, originalParsedFields, eventId, tenantId, areFieldsEqual, processFieldTranslations]);

  // Reset all state after successful save
  const resetFormState = useCallback(() => {
    setFields([]);
    setSelectedId(null);
    setFormLang({ 'en-US': {}, 'vi-VN': {} });
    setFormSettings({});
    setFieldChanges({ create: [], update: [], delete: [] });
    setFormTranslationChanges({ create: [], update: [], delete: [] });
    setOriginalParsedFields([]);
    setOriginalFormTranslations([]);
    setActiveLang('en-US');
  }, []);

  // Process form data when it loads
  useEffect(() => {
    console.log('[FormBuilder] Processing form data:', { formData, formId });
    if (formData) {
      // Properly handle form translations by languages_code with IDs
      const translations = ((formData as { translations?: Array<{ id?: string; languages_code: string; title?: string; submit_label?: string; success_message?: string }> })?.translations || []);
      const enTranslation = translations.find((t) => t.languages_code === 'en-US');
      const viTranslation = translations.find((t) => t.languages_code === 'vi-VN');

      // Store original form translations for comparison
      setOriginalFormTranslations(translations);

      setFormLang({
        'en-US': {
          id: enTranslation?.id,
          title: enTranslation?.title || '',
          submit_label: enTranslation?.submit_label || '',
          success_message: enTranslation?.success_message || ''
        },
        'vi-VN': {
          id: viTranslation?.id,
          title: viTranslation?.title || '',
          submit_label: viTranslation?.submit_label || '',
          success_message: viTranslation?.success_message || ''
        },
      });

      setFormSettings({
        status: (formData as { status?: string; on_success?: string; redirect_url?: string; is_allow_group?: boolean; template_email_group?: string }).status,
        on_success: (formData as { status?: string; on_success?: string; redirect_url?: string; is_allow_group?: boolean; template_email_group?: string }).on_success,
        redirect_url: (formData as { status?: string; on_success?: string; redirect_url?: string; is_allow_group?: boolean; template_email_group?: string }).redirect_url,
        is_allow_group: (formData as { status?: string; on_success?: string; redirect_url?: string; is_allow_group?: boolean; template_email_group?: string }).is_allow_group,
        template_email_group: (formData as { status?: string; on_success?: string; redirect_url?: string; is_allow_group?: boolean; template_email_group?: string }).template_email_group
      });
      
      // Process form fields first
      const formFields = (formData as { fields?: unknown[] })?.fields || [];
      const processedFields = formFields.map(parseFieldTranslations);
      setFields(processedFields);

      // Store original parsed fields for comparison
      setOriginalParsedFields(processedFields);

      // Initialize field changes as empty (will be updated when changes occur)
      setFieldChanges({
        create: [],
        update: [],
        delete: [],
      });
    }
  }, [formData, parseFieldTranslations]);

  // Auto-update field changes when fields change (debounced)
  useEffect(() => {
    if (fields.length > 0) {
      const timeoutId = setTimeout(() => {
        updateFieldChanges();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [fields, originalParsedFields, updateFieldChanges]);

  // Auto-update form translation changes when formLang changes (debounced)
  useEffect(() => {
    if (originalFormTranslations.length >= 0) {
      const timeoutId = setTimeout(() => {
        updateFormTranslationChanges();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [formLang, originalFormTranslations, updateFormTranslationChanges]);

  // Save form
  const handleSave = useCallback(() => {
    if (!formId || !eventId || !tenantId) return;

    console.log('[FormBuilder] Saving form:', { 
      formId, 
      eventId, 
      tenantId, 
      fields: fields.length, 
      fieldChanges 
    });

    // Calculate form translation changes directly in handleSave to ensure latest state
    const directFormTranslationChanges = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[],
    };

    // Process each language
    const languages = ['en-US', 'vi-VN'] as const;

    for (const lang of languages) {
      const currentTranslation = formLang[lang];
      const originalTranslation = originalFormTranslations.find((t: any) =>
        t.languages_code === lang && t.id === currentTranslation?.id
      );

      if (currentTranslation && Object.keys(currentTranslation).length > 0) {
        if (originalTranslation) {
          // Check if translation has changes (normalize empty strings and undefined)
          const normalizeValue = (value: any) => value || '';
          const hasChanges = (
            normalizeValue(currentTranslation.title) !== normalizeValue(originalTranslation.title) ||
            normalizeValue(currentTranslation.submit_label) !== normalizeValue(originalTranslation.submit_label) ||
            normalizeValue(currentTranslation.success_message) !== normalizeValue(originalTranslation.success_message)
          );

          if (hasChanges) {
            directFormTranslationChanges.update.push({
              id: currentTranslation.id,
              languages_code: lang,
              title: currentTranslation.title || '',
              submit_label: currentTranslation.submit_label || '',
              success_message: currentTranslation.success_message || '',
            });
          }
        } else if (currentTranslation.title || currentTranslation.submit_label || currentTranslation.success_message) {
          // New translation
          directFormTranslationChanges.create.push({
            languages_code: lang,
            title: currentTranslation.title || '',
            submit_label: currentTranslation.submit_label || '',
            success_message: currentTranslation.success_message || '',
          });
        }
      } else if (originalTranslation) {
        // Translation was deleted
        directFormTranslationChanges.delete.push(originalTranslation.id);
      }
    }

    const finalFormTranslationChanges = (
      directFormTranslationChanges.create.length > 0 ||
      directFormTranslationChanges.update.length > 0 ||
      directFormTranslationChanges.delete.length > 0
    ) ? directFormTranslationChanges : formTranslationChanges;

    const safeFinalFormTranslationChanges = finalFormTranslationChanges || {
      create: [],
      update: [],
      delete: [],
    };

    const formDataWithFields = {
      status: (formSettings.status as 'draft' | 'published' | 'archived') || 'draft',
      on_success: (formSettings.on_success as 'redirect' | 'message') || 'message',
      redirect_url: formSettings.redirect_url || undefined,
      is_allow_group: formSettings.is_allow_group || false,
      template_email_group: formSettings.template_email_group || undefined,
      event_id: Number(eventId),
      tenant_id: Number(tenantId),
      translations: safeFinalFormTranslationChanges,
      fields: fieldChanges,
    };

    saveFormWithFieldsMutation.mutate(
      {
        formId,
        eventId,
        tenantId: Number(tenantId),
        formData: formDataWithFields
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
  }, [formId, eventId, tenantId, formLang, originalFormTranslations, formTranslationChanges, formSettings, fieldChanges, saveFormWithFieldsMutation, resetFormState, refetchForm, queryClient]);

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
    fieldChanges,
    formTranslationChanges,
    originalParsedFields,
    originalFormTranslations,
    
    // Computed
    selected,
    isSaving,
    
    // Actions
    handleSave,
    setFields,
    resetFormState,
    
    // Helpers
    parseFieldTranslations,
    processFieldTranslations,
    areFieldsEqual,
    updateFieldChanges,
    updateFormTranslationChanges,
  };
}
