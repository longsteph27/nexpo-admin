'use client';

import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { debounce } from 'lodash';
import type { BlockHtml } from '@/types/directus-collections';




export default function HtmlBlockEditor({
  formData,
  updateField,
}: {
  formData: any;
  updateField: (field: string, value: unknown) => void;
  updateTranslation: (field: string, value: string | null) => void;
  currentTranslation: any;
}) {
  const { control } = useForm({
    defaultValues: {
      raw_html: formData.raw_html || '',
    },
    mode: 'onChange',
  });

  const rawHtml = useWatch({ control, name: 'raw_html' });

  // Debounced update
  const debouncedUpdate = useCallback(
    debounce((value: string) => {
      updateField('raw_html', value);
    }, 500),
    [updateField]
  );

  useEffect(() => {
    debouncedUpdate(rawHtml);
  }, [rawHtml, debouncedUpdate]);


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Custom HTML <span className="text-red-500">*</span>
        </label>
        <textarea
          {...control.register('raw_html')}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
          rows={12}
          placeholder="<div>Your HTML here...</div>"
        />
        <p className="text-xs text-neutral-500 mt-2">
          ⚠️ Be careful with custom HTML. Ensure your code is safe and valid.
        </p>
      </div>
    </div>
  );
}




