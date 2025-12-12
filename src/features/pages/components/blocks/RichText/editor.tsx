import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import Input from '@/components/ui/input';
import type { BlockRichtext } from './preview'; // Importing types from preview or define locally if needed

interface RichtextBlockEditorProps {
  formData: Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function RichtextBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
}: RichtextBlockEditorProps) {
  const blockData = formData as BlockRichtext;

  // -- RHF Setup --
  const { control, setValue, watch } = useForm({
    defaultValues: {
      title: (currentTranslation.title as string) || '',
      headline: (currentTranslation.headline as string) || '',
      content: (currentTranslation.content as string) || '',
      alignment: blockData.alignment || 'center',
    },
    mode: 'onChange',
  });

  // Sync with external props
  useEffect(() => {
    setValue('title', (currentTranslation.title as string) || '');
    setValue('headline', (currentTranslation.headline as string) || '');
    setValue('content', (currentTranslation.content as string) || '');
    setValue('alignment', blockData.alignment || 'center');
  }, [currentTranslation, blockData, setValue]);

  // -- Debounced Updaters --
  const debouncedUpdateTranslation = useMemo(
    () =>
      debounce((field: string, value: string | null) => {
        updateTranslation(field, value);
      }, 500),
    [updateTranslation]
  );

  const debouncedUpdateField = useMemo(
    () =>
      debounce((field: string, value: unknown) => {
        updateField(field, value);
      }, 500),
    [updateField]
  );

  // -- Handlers --
  const handleTitleChange = (val: string) => {
    setValue('title', val);
    debouncedUpdateTranslation('title', val);
  };

  const handleHeadlineChange = (val: string) => {
    setValue('headline', val);
    debouncedUpdateTranslation('headline', val);
  };

  const handleContentChange = (val: string | null) => {
    setValue('content', val || '');
    debouncedUpdateTranslation('content', val);
  };

  const handleAlignmentChange = (val: 'left' | 'center' | 'right') => {
    setValue('alignment', val);
    updateField('alignment', val); // Direct update for alignment typically fine, or use debouncedUpdateField
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title (Optional)
        </label>
        <Input
          value={watch('title')}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline
        </label>
        <Input
          value={watch('headline')}
          onChange={(e) => handleHeadlineChange(e.target.value)}
          placeholder="Enter headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content
        </label>
        <RichTextEditor
          value={watch('content')}
          onChange={handleContentChange}
          placeholder="Enter content..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Text Alignment
        </label>
        <div className="flex items-center space-x-3">
          {(['left', 'center', 'right'] as const).map((position) => (
            <button
              key={position}
              type="button"
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${watch('alignment') === position
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
                }`}
              onClick={() => handleAlignmentChange(position)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon
                  icon={`lucide:align-${position}`}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium capitalize">{position}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


