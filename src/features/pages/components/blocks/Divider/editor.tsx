'use client';

import React from 'react';
import Input from '@/components/ui/input';
import type { BlockDivider } from '@/types/directus-collections';

interface DividerBlockEditorProps {
  formData: BlockDivider | Record<string, unknown>;
  updateField: (field: string, value: unknown) => void;
}

export default function DividerBlockEditor({
  formData,
  updateField,
}: DividerBlockEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title (Optional)
        </label>
        <Input
          value={((formData as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="Section divider..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Leave empty for a simple horizontal line
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`py-2 px-3 border-2 rounded-lg transition-all text-sm ${
                (formData as Record<string, unknown>).style === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateField('style', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}




