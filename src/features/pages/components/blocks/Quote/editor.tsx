'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { BlockQuote, BlockQuoteTranslation } from '@/types/directus-collections';

interface QuoteBlockEditorProps {
  formData: BlockQuote | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  currentTranslation: BlockQuoteTranslation | Record<string, unknown>;
}

export default function QuoteBlockEditor({
  formData, // eslint-disable-line @typescript-eslint/no-unused-vars
  updateTranslation,
  currentTranslation,
}: QuoteBlockEditorProps) {

  // -- RHF Setup --
  const { control, setValue, watch } = useForm({
    defaultValues: {
      content: (currentTranslation.content as string) || '',
      title: (currentTranslation.title as string) || '',
      subtitle: (currentTranslation.subtitle as string) || '',
    },
    mode: 'onChange',
  });

  // Sync with external props
  useEffect(() => {
    setValue('content', (currentTranslation.content as string) || '');
    setValue('title', (currentTranslation.title as string) || '');
    setValue('subtitle', (currentTranslation.subtitle as string) || '');
  }, [currentTranslation, setValue]);

  // -- Debounced Updaters --
  const debouncedUpdateTranslation = useMemo(
    () =>
      debounce((field: string, value: string | null) => {
        updateTranslation(field, value);
      }, 500),
    [updateTranslation]
  );

  // -- Handlers --
  const handleContentChange = (val: string | null) => {
    setValue('content', val || '');
    debouncedUpdateTranslation('content', val);
  };

  const handleTitleChange = (val: string) => {
    setValue('title', val);
    debouncedUpdateTranslation('title', val);
  };

  const handleSubtitleChange = (val: string) => {
    setValue('subtitle', val);
    debouncedUpdateTranslation('subtitle', val);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Quote Content <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={watch('content')}
          onChange={handleContentChange}
          placeholder="Enter the quote content..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author Name
        </label>
        <Input
          value={watch('title')}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Quote author name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author Title / Position
        </label>
        <Input
          value={watch('subtitle')}
          onChange={(e) => handleSubtitleChange(e.target.value)}
          placeholder="e.g., CEO, Product Manager..."
        />
      </div>
    </div>
  );
}




