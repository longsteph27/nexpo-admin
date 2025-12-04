'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ButtonEditor from '../shared/ButtonEditor';
import type { BlockButtonGroup, BlockButtonTranslation } from '@/types/directus-collections';

interface ButtonGroupEditorProps {
  buttonGroup: BlockButtonGroup | null;
  currentLangCode: string;
  onAddButton: () => void;
  onUpdateButton: (buttonIndex: number, field: string, value: unknown) => void;
  onRemoveButton: (buttonId: string) => void;
}

export default function ButtonGroupEditor({
  buttonGroup,
  currentLangCode,
  onAddButton,
  onUpdateButton,
  onRemoveButton,
}: ButtonGroupEditorProps) {
  const buttons = buttonGroup?.buttons || [];

  if (buttons.length === 0) {
    return (
      <div className="border-t border-neutral-200 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-medium text-neutral-700">
            Button Group
          </label>
          <Button size="sm" variant="outline" onClick={onAddButton}>
            <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
            Add Button
          </Button>
        </div>
        <div className="text-xs text-neutral-400 italic py-2">
          No buttons added yet. Click &quot;Add Button&quot; to create one.
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-medium text-neutral-700">
          Button Group
        </label>
        <Button size="sm" variant="outline" onClick={onAddButton}>
          <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
          Add Button
        </Button>
      </div>
      <div className="space-y-3">
        {buttons
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map((button, buttonIndex) => {
            const buttonTranslation =
              button.translations?.find((translation) => {
                const translationLang =
                  typeof translation.languages_code === 'string'
                    ? translation.languages_code
                    : ((translation.languages_code as { code: string })?.code || '');
                return translationLang === currentLangCode;
              }) || button.translations?.[0] || {
                block_button_id: '',
                languages_code: currentLangCode,
                label: '',
              };

            return (
              <ButtonEditor
                key={button.id}
                button={button}
                buttonIndex={buttonIndex}
                currentLangCode={currentLangCode}
                buttonTrans={buttonTranslation as BlockButtonTranslation}
                onUpdate={(field, value) => onUpdateButton(buttonIndex, field, value)}
                onRemove={() => onRemoveButton(button.id)}
              />
            );
          })}
      </div>
    </div>
  );
}




