'use client';

import React, { useEffect, useRef, memo } from 'react';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import ButtonGroupEditor from './ButtonGroupEditor';
import type {
  BlockColumnsRows,
  BlockColumnsTranslation,
  BlockButtonGroup,
} from '@/types/directus-collections';

interface ColumnRowEditorProps {
  row: BlockColumnsRows;
  rowIndex: number;
  currentTranslation: BlockColumnsTranslation | Record<string, unknown>;
  folderId?: string;
  onUpdate: (field: string, value: unknown, isTranslation?: boolean) => void;
  onRemove: () => void;
  onAddButton: () => void;
  onUpdateButton: (buttonIndex: number, field: string, value: unknown) => void;
  onRemoveButton: (buttonId: string) => void;
  autoFocus?: boolean;
  frameless?: boolean; // Hide outer container and header when used inside collapsible wrapper
}

function ColumnRowEditor({
  row,
  rowIndex,
  currentTranslation,
  folderId,
  onUpdate,
  onRemove,
  onAddButton,
  onUpdateButton,
  onRemoveButton,
  autoFocus = false,
  frameless = false,
}: ColumnRowEditorProps) {
  const currentLangCode = (
    (currentTranslation as BlockColumnsTranslation)?.languages_code as string | { code: string }
  );
  const currentLang = typeof currentLangCode === 'string' ? currentLangCode : (currentLangCode?.code || 'en-US');

  const rowTranslation = row.translations?.find((translation) => {
    const translationLang =
      typeof translation.languages_code === 'string'
        ? translation.languages_code
        : ((translation.languages_code as { code: string })?.code || '');
    return translationLang === currentLang;
  }) || {};

  const buttonGroup =
    typeof row.button_group === 'object' && row.button_group !== null
      ? (row.button_group as BlockButtonGroup)
      : null;

  // Focus handling
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      titleInputRef.current?.focus();
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [autoFocus]);

  const content = (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">Row Title</label>
        <Input
          ref={titleInputRef}
          placeholder="Row title..."
          value={((rowTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => onUpdate('title', event.target.value, true)}
          autoFocus={autoFocus}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">Row Headline</label>
        <Input
          placeholder="Row headline..."
          value={((rowTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(event) => onUpdate('headline', event.target.value, true)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          Row Content
        </label>
        <RichTextEditor
          value={((rowTranslation as Record<string, unknown>).content as string) || ''}
          onChange={(value) => onUpdate('content', value, true)}
          placeholder="Enter row content..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          Image Position
        </label>
        <div className="flex items-center space-x-2">
          {(['left', 'right'] as const).map((position) => (
            <button
              key={position}
              type="button"
              className={`flex-1 py-1.5 px-3 border-2 rounded-lg transition-all text-xs ${
                row.image_position === position
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => onUpdate('image_position', position, false)}
            >
              {position}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          Image
        </label>
        <ImageUpload
          value={(row.image as string) || ''}
          onChange={(assetId) => onUpdate('image', assetId, false)}
          folderId={folderId}
        />
      </div>

      {buttonGroup ? (
        <ButtonGroupEditor
          buttonGroup={buttonGroup}
          currentLangCode={currentLang}
          onAddButton={onAddButton}
          onUpdateButton={onUpdateButton}
          onRemoveButton={onRemoveButton}
        />
      ) : (
        <div className="border-t border-neutral-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-medium text-neutral-700">
              Button Group
            </label>
            <button
              type="button"
              className="px-2 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-100"
              onClick={onAddButton}
            >
              <Icon icon="lucide:plus" className="w-3 h-3 mr-1 inline" />
              Add Button
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (frameless) {
    return (
      <div ref={containerRef} className="">
        {content}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-700">Row {rowIndex + 1}</span>
        <button type="button" className="text-red-600 hover:text-red-700" onClick={onRemove}>
          <Icon icon="lucide:trash-2" className="w-4 h-4" />
        </button>
      </div>
      {content}
    </div>
  );
}

// Export with React.memo to prevent re-renders when props haven't changed
export default memo(ColumnRowEditor);


