'use client';

import React, { useMemo } from 'react';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ButtonGroupEditor from '../Columns/ButtonGroupEditor';
import type { BlockCta, BlockCtaTranslation, BlockButtonGroup, BlockButtonTranslation, LanguageCode } from '@/types/directus-collections';

interface CtaBlockEditorProps {
  formData: BlockCta | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockCtaTranslation | Record<string, unknown>;
  eventId?: string;
}

export default function CtaBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  eventId,
}: CtaBlockEditorProps) {
  const blockData = formData as BlockCta;
  const currentLangCode = useMemo(() => {
    const codeRaw = (currentTranslation as BlockCtaTranslation)?.languages_code as string | { code: string };
    return typeof codeRaw === 'string' ? codeRaw : (codeRaw?.code || 'en-US');
  }, [currentTranslation]);

  const buttonGroup: BlockButtonGroup | null =
    typeof blockData.button_group === 'object' && blockData.button_group !== null
      ? (blockData.button_group as BlockButtonGroup)
      : null;

  const ensureButtonGroup = (): BlockButtonGroup => {
    let bg = buttonGroup;
    if (!bg || typeof bg === 'string') {
      bg = {
        id: `temp-button-group-${Date.now()}`,
        alignment: 'start',
        buttons: [],
        event_id: eventId ? Number(eventId) : undefined,
        tenant_id: blockData.tenant_id,
      } as unknown as BlockButtonGroup;
      updateField('button_group', bg);
    }
    return bg;
  };

  const handleAddButton = () => {
    const bg = ensureButtonGroup();
    const buttons = bg.buttons || [];
    const newButton = {
      id: `temp-button-${Date.now()}`,
      sort: buttons.length,
      variant: 'solid',
      color: 'primary',
      open_in_new_window: false,
      translations: [
        { block_button_id: '', languages_code: currentLangCode as LanguageCode, label: '' },
      ],
    };
    bg.buttons = [...buttons, newButton as any];
    updateField('button_group', { ...bg });
  };

  const handleUpdateButton = (buttonIndex: number, field: string, value: unknown) => {
    const bg = ensureButtonGroup();
    if (!bg.buttons) bg.buttons = [] as any;
    const next = { ...bg } as any;
    if (field === 'label' || field === 'href') {
      const translations = next.buttons[buttonIndex].translations || [];
      const idx = translations.findIndex((t: BlockButtonTranslation) => {
        const lc = typeof t.languages_code === 'string' ? t.languages_code : (t.languages_code as any)?.code;
        return lc === currentLangCode;
      });
      if (idx >= 0) {
        translations[idx] = { ...translations[idx], [field]: value };
      } else {
        translations.push({ block_button_id: '', languages_code: currentLangCode as LanguageCode, [field]: value } as any);
      }
      next.buttons[buttonIndex].translations = translations;
    } else {
      next.buttons[buttonIndex][field] = value;
    }
    updateField('button_group', next);
  };

  const handleRemoveButton = (buttonId: string) => {
    const bg = ensureButtonGroup();
    const next = { ...bg } as any;
    next.buttons = (next.buttons || []).filter((b: any) => b.id !== buttonId);
    updateField('button_group', next);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Title <span className="text-red-500">*</span></label>
        <Input
          value={((currentTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Ready to get started?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Headline</label>
        <RichTextEditor
          value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Catchy headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Content</label>
        <RichTextEditor
          value={((currentTranslation as Record<string, unknown>).content as string) || ''}
          onChange={(value) => updateTranslation('content', value)}
          placeholder="Describe the action you want users to take..."
        />
      </div>

      <ButtonGroupEditor
        buttonGroup={buttonGroup}
        currentLangCode={currentLangCode}
        onAddButton={handleAddButton}
        onUpdateButton={handleUpdateButton}
        onRemoveButton={handleRemoveButton}
      />
    </div>
  );
}




