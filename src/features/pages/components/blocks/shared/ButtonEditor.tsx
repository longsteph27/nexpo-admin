'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BlockButton, BlockButtonTranslation } from '@/types/directus-collections';

interface ButtonEditorProps {
  button: BlockButton;
  buttonIndex: number;
  currentLangCode: string;
  buttonTrans: BlockButtonTranslation | Record<string, unknown>;
  onUpdate: (field: string, value: unknown) => void;
  onRemove: () => void;
}

export default function ButtonEditor({
  button,
  buttonIndex,
  currentLangCode, // eslint-disable-line @typescript-eslint/no-unused-vars
  buttonTrans,
  onUpdate,
  onRemove,
}: ButtonEditorProps) {
  const handleTypeChange = (value: 'pages' | 'posts' | 'external') => {
    // Update type and clear other link fields to avoid conflicts
    onUpdate('type', value);
    if (value === 'pages') {
      onUpdate('post', null);
      onUpdate('external_url', null);
    } else if (value === 'posts') {
      onUpdate('page', null);
      onUpdate('external_url', null);
    } else if (value === 'external') {
      onUpdate('page', null);
      onUpdate('post', null);
    }
  };

  return (
    <div className="p-3 bg-white border border-neutral-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-600">Button {buttonIndex + 1}</span>
        <button type="button" className="text-red-600 hover:text-red-700" onClick={onRemove}>
          <Icon icon="lucide:trash-2" className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Label (translation) */}
        <Input
          placeholder="Button label..."
          value={((buttonTrans as Record<string, unknown>).label as string) || ''}
          onChange={(event) => onUpdate('label', event.target.value)}
        />

        {/* Link type */}
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Link Type</label>
          <Select value={(button.type as any) || 'external'} onValueChange={handleTypeChange as any}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pages">Internal - Page</SelectItem>
              <SelectItem value="posts">Internal - Post</SelectItem>
              <SelectItem value="external">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional link target inputs */}
        {button.type === 'pages' && (
          <Input
            placeholder="Page ID (UUID)"
            value={(button.page as string) || ''}
            onChange={(e) => onUpdate('page', e.target.value)}
          />
        )}
        {button.type === 'posts' && (
          <Input
            placeholder="Post ID (UUID)"
            value={(button.post as string) || ''}
            onChange={(e) => onUpdate('post', e.target.value)}
          />
        )}
        {(button.type === 'external' || !button.type) && (
          <Input
            placeholder="https://example.com"
            value={(button.external_url as string) || ((buttonTrans as any)?.href as string) || ''}
            onChange={(e) => onUpdate('external_url', e.target.value)}
          />
        )}

        {/* Style */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Variant</label>
            <Select
              value={(button.variant as any) || 'solid'}
              onValueChange={(value: 'solid' | 'outline' | 'soft' | 'ghost' | 'link') => onUpdate('variant', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Color</label>
            <Select
              value={(button.color as any) || 'primary'}
              onValueChange={(value: 'primary' | 'gray' | 'black' | 'white') => onUpdate('color', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Open in new window */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`open-new-${button.id}`}
            checked={!!button.open_in_new_window}
            onChange={(event) => onUpdate('open_in_new_window', event.target.checked)}
            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
          />
          <label htmlFor={`open-new-${button.id}`} className="text-xs text-neutral-600 cursor-pointer">
            Open in new window
          </label>
        </div>
      </div>
    </div>
  );
}

