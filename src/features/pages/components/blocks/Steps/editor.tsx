'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import type { BlockSteps, BlockStepItem, BlockStepsTranslation } from '@/types/directus-collections';

interface StepsBlockEditorProps {
  formData: BlockSteps | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockStepsTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function StepsBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: StepsBlockEditorProps) {
  const blockId = (formData as Record<string, unknown>).id as string | undefined;
  const parentEventId = (formData as Record<string, unknown>).event_id as number | undefined;
  const parentTenantId = (formData as Record<string, unknown>).tenant_id as number | undefined;

  const currentLangCode = useMemo(() => {
    const trans = currentTranslation as Record<string, unknown>;
    if (typeof trans.languages_code === 'string') return trans.languages_code;
    if (typeof trans.languages_code === 'object' && trans.languages_code !== null) {
      return (trans.languages_code as Record<string, unknown>).code as string;
    }
    return 'en-US';
  }, [currentTranslation]);

  const [steps, setSteps] = useState<BlockStepItem[]>(() => {
    const stepsData = (formData as Record<string, unknown>).steps;
    console.log('[StepsEditor] Initializing steps:', {
      hasSteps: 'steps' in formData,
      stepsData,
      isArray: Array.isArray(stepsData),
      length: Array.isArray(stepsData) ? stepsData.length : 'N/A',
      formDataKeys: Object.keys(formData),
      fullFormData: formData
    });
    return Array.isArray(stepsData) ? stepsData : [];
  });

  // Update steps when formData changes (data loaded from API)
  React.useEffect(() => {
    const stepsData = (formData as Record<string, unknown>).steps;
    console.log('[StepsEditor] formData changed, updating steps:', {
      stepsData,
      isArray: Array.isArray(stepsData),
      length: Array.isArray(stepsData) ? stepsData.length : 0
    });
    if (Array.isArray(stepsData) && stepsData.length > 0) {
      setSteps(stepsData);
    }
  }, [formData]);

  const persistSteps = useCallback((items: BlockStepItem[]) => {
    console.log('[StepsEditor] Persisting steps:', items);
    const withFK = items.map((item, idx) => ({
      ...item,
      block_steps: blockId,
      event_id: item.event_id ?? parentEventId,
      tenant_id: item.tenant_id ?? parentTenantId,
      sort: item.sort ?? idx,
    }));
    setSteps(withFK);
    updateField('steps', withFK);
  }, [blockId, parentEventId, parentTenantId, updateField]);

  const addStep = useCallback(() => {
    persistSteps([...steps, {
      sort: steps.length,
      block_steps: blockId,
      title: '', content: '', image: null, button_group: null,
      event_id: parentEventId, tenant_id: parentTenantId,
      translations: [
        { languages_code: 'en-US', title: '', content: '' },
        { languages_code: 'vi-VN', title: '', content: '' },
      ],
    } as BlockStepItem]);
  }, [steps.length, blockId, parentEventId, parentTenantId, persistSteps]);

  const updateStep = useCallback((idx: number, field: string, value: unknown, isTranslation = false) => {
    const next = [...steps];
    if (isTranslation) {
      if (!next[idx].translations) {
        next[idx].translations = [
          { languages_code: 'en-US', title: '', content: '' },
          { languages_code: 'vi-VN', title: '', content: '' },
        ];
      }
      const tIdx = next[idx].translations.findIndex(t => t.languages_code === currentLangCode) ?? -1;
      if (tIdx >= 0) {
        next[idx].translations[tIdx] = { ...next[idx].translations[tIdx], [field]: value };
      }
    } else {
      (next[idx] as Record<string, unknown>)[field] = value;
    }
    persistSteps(next);
  }, [steps, currentLangCode, persistSteps]);

  const removeStep = useCallback((idx: number) => {
    persistSteps(steps.filter((_, i) => i !== idx));
  }, [steps, persistSteps]);

  const handleRemoveImage = useCallback((idx: number) => {
    updateStep(idx, 'image', null, false);
  }, [updateStep]);

  const trans = currentTranslation as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">Title</label>
        <Input value={(trans.title as string) || ''} onChange={e => updateTranslation('title', e.target.value)} placeholder="How it works..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">Headline</label>
        <RichTextEditor value={(trans.headline as string) || ''} onChange={v => updateTranslation('headline', v)} placeholder="Add headline..." />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={((formData as any).show_step_numbers as boolean) ?? true} onChange={e => updateField('show_step_numbers', e.target.checked)} className="rounded" />
          <span className="text-sm text-content-primary">Show step numbers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={((formData as any).alternate_image_position as boolean) || false} onChange={e => updateField('alternate_image_position', e.target.checked)} className="rounded" />
          <span className="text-sm text-content-primary">Alternate image position</span>
        </label>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-content-primary">Steps ({steps.length})</h3>
          <Button size="sm" variant="outline" onClick={addStep}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {steps.length === 0 ? (
          <p className="text-center py-8 text-sm text-content-secondary">No steps</p>
        ) : (
          <div className="space-y-4">
            {steps.map((step, i) => {
              const stepTrans = step.translations?.find(t => t.languages_code === currentLangCode);
              const stepTitle = stepTrans?.title || '';
              const stepContent = stepTrans?.content || '';
              const key = step.id || `new-step-${i}`;
              
              return (
                <div key={key} className="p-4 bg-neutral-50 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold">Step {i + 1}</span>
                    <button type="button" onClick={() => removeStep(i)} className="text-red-600">
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </button>
                  </div>
                  <Input placeholder="Title..." value={stepTitle} onChange={e => updateStep(i, 'title', e.target.value, true)} />
                  <div className="mt-3"><RichTextEditor value={stepContent} onChange={v => updateStep(i, 'content', v, true)} placeholder="Content..." /></div>
                  {step.image ? (
                    <div className="relative mt-3">
                      <img src={assetsApi.getAssetUrl(step.image)} alt="" className="w-full h-40 object-cover rounded border" />
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded"><Icon icon="lucide:x" className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="mt-3"><ImageUpload value="" onChange={id => updateStep(i, 'image', id, false)} folderId={folderId} eventId={eventId} /></div>
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

