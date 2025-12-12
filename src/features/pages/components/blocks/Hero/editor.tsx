'use client';

import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import Input from '@/components/ui/input';
import ButtonGroupEditor from '../Columns/ButtonGroupEditor';
import type {
  BlockHero,
  BlockHeroTranslation,
  BlockButtonGroup,
  BlockButtonTranslation,
  LanguageCode
} from '@/types/directus-collections';

interface HeroBlockEditorProps {
  formData: BlockHero | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockHeroTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function HeroBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: HeroBlockEditorProps) {
  const blockData = formData as BlockHero;

  const currentLangCodeRaw = useMemo(
    () => (currentTranslation as BlockHeroTranslation).languages_code as string | { code: string },
    [currentTranslation]
  );

  const currentLangCode = useMemo(
    () => (typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US')),
    [currentLangCodeRaw]
  );

  // -- RHF Setup --
  const { control, setValue, getValues, watch } = useForm<BlockHero & {
    title: string;
    headline: string;
    content: string;
  }>({
    defaultValues: {
      title: (currentTranslation.title as string) || '',
      headline: (currentTranslation.headline as string) || '',
      content: (currentTranslation.content as string) || '',
      image: blockData.image,
      image_position: blockData.image_position || 'right',
      button_group: blockData.button_group,
    },
    mode: 'onChange',
  });

  // Watch for local state to ensure UI responsiveness if needed,
  // though we mostly update parent on change.
  // Actually, for RHF we usually let RHF handle local state and debounce update parents.

  // Initialize form when data changes externally (e.g. switching lang)
  // Logic similar to Steps/Faqs but handling both translation and root fields
  useEffect(() => {
    setValue('title', (currentTranslation.title as string) || '');
    setValue('headline', (currentTranslation.headline as string) || '');
    setValue('content', (currentTranslation.content as string) || '');
    setValue('image_position', blockData.image_position || 'right');
    setValue('image', blockData.image);
    setValue('button_group', blockData.button_group);
  }, [currentTranslation, blockData, setValue]);


  // Debounced updaters
  const debouncedUpdateTranslation = useMemo(
    () => debounce((field: string, value: string | null) => {
      updateTranslation(field, value);
    }, 500),
    [updateTranslation]
  );

  const debouncedUpdateField = useMemo(
    () => debounce((field: string, value: unknown) => {
      updateField(field, value);
    }, 500),
    [updateField]
  );

  // Field Handlers
  const handleHeadlineChange = (val: string | null) => {
    setValue('headline', val || '');
    debouncedUpdateTranslation('headline', val);
  };

  const handleContentChange = (val: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = val.target.value;
    setValue('content', value);
    debouncedUpdateTranslation('content', value);
  };

  const handleImagePositionChange = (val: 'left' | 'right') => {
    setValue('image_position', val);
    updateField('image_position', val); // Immediate update for UI toggles usually feels better? Or debounce? kept immediate for boolean/enum
  };

  const handleImageChange = (val: string | string[]) => {
    const value = Array.isArray(val) ? val[0] : val;
    setValue('image', value);
    updateField('image', value);
  };

  // -- Button Group Logic (from Cta/editor.tsx) --
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
    // Immediate update for buttons structure
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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title
        </label>
        <Input
          value={watch('title')}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={watch('headline')}
          onChange={handleHeadlineChange}
          placeholder="Enter your hero headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={watch('content')}
          onChange={handleContentChange}
          placeholder="Describe your product or service..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image Position
        </label>
        <div className="flex items-center space-x-3">
          {(['left', 'right'] as const).map((position) => (
            <button
              key={position}
              type="button"
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${watch('image_position') === position
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-neutral-200 hover:border-neutral-300'
                }`}
              onClick={() => handleImagePositionChange(position)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={`lucide:align-${position === 'left' ? 'left' : 'right'}`} className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{position}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image
        </label>
        <ImageUpload
          value={(watch('image') as string) || ''}
          onChange={handleImageChange}
          folderId={folderId}
        />
      </div>

      {/* Button Group Integration */}
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




