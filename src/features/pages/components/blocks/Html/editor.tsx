'use client';

import React from 'react';
import type { BlockHtml, BlockHtmlTranslation } from '@/types/directus-collections';

interface HtmlBlockEditorProps {
  formData: BlockHtml | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  currentTranslation: BlockHtmlTranslation | Record<string, unknown>;
}

export default function HtmlBlockEditor({
  formData, // eslint-disable-line @typescript-eslint/no-unused-vars
  updateTranslation,
  currentTranslation,
}: HtmlBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Custom HTML <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
          rows={12}
          value={((currentTranslation as Record<string, unknown>).raw_html as string) || ''}
          onChange={(event) => updateTranslation('raw_html', event.target.value)}
          placeholder="<div>Your HTML here...</div>"
        />
        <p className="text-xs text-neutral-500 mt-2">
          ⚠️ Be careful with custom HTML. Ensure your code is safe and valid.
        </p>
      </div>
    </div>
  );
}




