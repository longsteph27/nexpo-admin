import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import type {
  BlockSteps,
  BlockStepItem,
  BlockStepsTranslation,
  LanguageCode
} from '@/types/directus-collections';
import { generateTempId } from '@/lib/payload';

interface StepsBlockEditorProps {
  formData: BlockSteps | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockStepsTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

interface FormValues {
  steps: BlockStepItem[];
}

export default function StepsBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: StepsBlockEditorProps) {
  const blockData = formData as BlockSteps;

  const currentLangCodeRaw = useMemo(
    () => (currentTranslation as BlockStepsTranslation).languages_code as string | { code: string },
    [currentTranslation]
  );

  const currentLangCode = useMemo(
    () => (typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US')),
    [currentLangCodeRaw]
  );

  // Initial data parsing
  const initialSteps = useMemo(() => {
    return (blockData.steps || []).filter(
      (step): step is BlockStepItem => typeof step !== 'string'
    );
  }, [blockData.steps]);

  // Initialize React Hook Form
  const { control, reset, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      steps: initialSteps,
    },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
    keyName: 'key',
  });

  // Watch for changes
  const formSteps = useWatch({
    control,
    name: 'steps',
  });

  // Track initialization to prevent loops
  const hasInitialized = useRef(false);

  // Initialize form when steps data becomes available
  const stepsLength = useMemo(() => {
    const steps = (formData as Record<string, unknown>).steps as (BlockStepItem | string)[] | undefined;
    return steps?.length || 0;
  }, [formData]);

  useEffect(() => {
    // Only init once when data becomes available or length significantly changes (manual reset check)
    // Actually standard pattern: if !initialized && length > 0 -> reset.
    // If length becomes 0 externally, maybe also reset? 
    // Stick to standard pattern:

    // If we haven't initialized and there is data
    // If we haven't initialized and there is data
    if (!hasInitialized.current && stepsLength > 0) {
      const formStepsData = (formData as Record<string, unknown>).steps as (BlockStepItem | string)[] | undefined;
      const validSteps = (formStepsData || []).filter((s): s is BlockStepItem => typeof s !== 'string');
      reset({ steps: validSteps });
      hasInitialized.current = true;
    }
  }, [stepsLength, formData, reset]);

  // Debounced update to parent
  const debouncedUpdate = useMemo(
    () => debounce((currentSteps: BlockStepItem[]) => {
      // Ensure specific fields are preserved/updated
      const stepsToSave = currentSteps.map((step, index) => ({
        ...step,
        sort: index, // Ensure sort order is correct
      }));
      updateField('steps', stepsToSave);

      console.log('[StepsEditor] Debounced update triggered', {
        count: stepsToSave.length,
        items: stepsToSave.map(s => ({ id: s.id, trans: s.translations?.length }))
      });
    }, 500),
    [updateField]
  );

  // Trigger update when form data changes
  useEffect(() => {
    if (formSteps) {
      debouncedUpdate(formSteps as BlockStepItem[]);
    }
  }, [formSteps, debouncedUpdate]);


  /* EXPANSION & FOCUS STATE */
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const addStep = useCallback(() => {
    const newId = generateTempId();
    append({
      id: newId,
      sort: fields.length,
      // No button_group in current UI, keep null/undefined
      translations: [
        { languages_code: 'en-US' as LanguageCode, title: '', content: '' },
        { languages_code: 'vi-VN' as LanguageCode, title: '', content: '' },
      ],
    } as BlockStepItem);

    // Auto-expand and focus new item
    setExpandedItems(prev => ({ ...prev, [newId]: true }));
    setFocusId(newId);
  }, [append, fields.length]);

  const removeStep = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const updateStepField = useCallback((index: number, field: string, value: unknown, isTranslation = false) => {
    if (isTranslation) {
      const currentStep = getValues(`steps.${index}`);
      const translations = currentStep.translations || [];

      const transIndex = translations.findIndex(t => {
        const code = typeof t.languages_code === 'string'
          ? t.languages_code
          : (t.languages_code as { code: string })?.code;
        return code === currentLangCode;
      });

      if (transIndex >= 0) {
        setValue(`steps.${index}.translations.${transIndex}.${field}` as any, value, { shouldDirty: true });
      } else {
        // Add new translation
        const newTrans = {
          languages_code: currentLangCode,
          title: '',
          content: '',
          [field]: value
        };
        setValue(`steps.${index}.translations`, [...translations, newTrans], { shouldDirty: true });
      }
    } else {
      setValue(`steps.${index}.${field}` as any, value, { shouldDirty: true });
    }
  }, [getValues, setValue, currentLangCode]);

  const trans = currentTranslation as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">Title</label>
        <Input
          value={(trans.title as string) || ''}
          onChange={e => updateTranslation('title', e.target.value)}
          placeholder="How it works..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">Headline</label>
        <RichTextEditor
          value={(trans.headline as string) || ''}
          onChange={v => updateTranslation('headline', v)}
          placeholder="Add headline..."
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={((formData as any).show_step_numbers as boolean) ?? true}
            onChange={e => updateField('show_step_numbers', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-content-primary">Show step numbers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={((formData as any).alternate_image_position as boolean) || false}
            onChange={e => updateField('alternate_image_position', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-content-primary">Alternate image position</span>
        </label>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-content-primary">Steps ({fields.length})</h3>
          <Button size="sm" variant="outline" onClick={addStep}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-center py-8 text-sm text-content-secondary">No steps</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              // Access current value (reactive) or fallback to field (snapshot)
              // We need reactive for inputs value
              const step = formSteps?.[index] || field;

              const stepTrans = step.translations?.find((t: any) => {
                const code = typeof t.languages_code === 'string' ? t.languages_code : t.languages_code?.code;
                return code === currentLangCode;
              });
              const stepTitle = stepTrans?.title || '';
              const stepContent = stepTrans?.content || '';

              const stepId = String(step.id || field.id);
              const isExpanded = expandedItems[stepId] ?? false;

              return (
                <div key={field.key} className="bg-neutral-50 border rounded-lg overflow-hidden">
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => toggleExpand(stepId)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Icon
                        icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                        className="w-4 h-4 text-neutral-500 flex-shrink-0"
                      />
                      <span className="text-sm font-semibold truncate select-none">
                        {stepTitle || `Step ${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(index);
                        }}
                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        <Icon icon="lucide:trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t border-neutral-200 mt-2">
                      <Input
                        placeholder="Title..."
                        value={stepTitle}
                        onChange={e => updateStepField(index, 'title', e.target.value, true)}
                        autoFocus={stepId === focusId}
                      />
                      <div className="mt-3">
                        <RichTextEditor
                          value={stepContent}
                          onChange={v => updateStepField(index, 'content', v, true)}
                          placeholder="Content..."
                        />
                      </div>
                      {step.image ? (
                        <div className="relative mt-3">
                          <img
                            src={assetsApi.getAssetUrl(step.image)}
                            alt=""
                            className="w-full h-40 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => updateStepField(index, 'image', null, false)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            <Icon icon="lucide:x" className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <ImageUpload
                            value=""
                            onChange={id => updateStepField(index, 'image', id, false)}
                            folderId={folderId}
                          // eventId not supported in ImageUploadProps
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

