'use client';

import React from 'react';
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
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Quote Content <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={(currentTranslation.content as string) || ''}
          onChange={(value) => updateTranslation('content', value)}
          placeholder="Enter the quote content..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author Name
        </label>
        <Input
          value={(currentTranslation.title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Quote author name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author Title / Position
        </label>
        <Input
          value={(currentTranslation.subtitle as string) || ''}
          onChange={(event) => updateTranslation('subtitle', event.target.value)}
          placeholder="e.g., CEO, Product Manager..."
        />
      </div>
    </div>
  );
}




