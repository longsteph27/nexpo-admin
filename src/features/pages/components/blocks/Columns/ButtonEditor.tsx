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
  return (
    <div className="p-3 bg-white border border-neutral-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-600">
          Button {buttonIndex + 1}
        </span>
        <button type="button" className="text-red-600 hover:text-red-700" onClick={onRemove}>
          <Icon icon="lucide:trash-2" className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Button label..."
          value={((buttonTrans as Record<string, unknown>).label as string) || ''}
          onChange={(event) => onUpdate('label', event.target.value)}
        />
        <Input
          placeholder="Button URL (href)..."
          value={((buttonTrans as Record<string, unknown>).href as string) || ''}
          onChange={(event) => onUpdate('href', event.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Variant
            </label>
            <Select
              value={button.variant || 'solid'}
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
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Color
            </label>
            <Select
              value={button.color || 'primary'}
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
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`open-new-${button.id}`}
            checked={button.open_in_new_window || false}
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


