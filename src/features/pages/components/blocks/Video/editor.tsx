'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { BlockVideo, BlockVideoTranslation } from '@/types/directus-collections';

interface VideoBlockEditorProps {
  formData: BlockVideo | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockVideoTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function VideoBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
}: VideoBlockEditorProps) {
  const blockData = formData as BlockVideo;

  // -- RHF Setup --
  const { control, setValue, watch } = useForm({
    defaultValues: {
      title: (currentTranslation.title as string) || '',
      headline: (currentTranslation.headline as string) || '',
      type: blockData.type || 'url',
      video_url: blockData.video_url || '',
      video_file: blockData.video_file || '',
    },
    mode: 'onChange',
  });

  // Sync with external props
  useEffect(() => {
    setValue('title', (currentTranslation.title as string) || '');
    setValue('headline', (currentTranslation.headline as string) || '');
    setValue('type', blockData.type || 'url');
    setValue('video_url', blockData.video_url || '');
    setValue('video_file', blockData.video_file || '');
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

  const handleHeadlineChange = (val: string | null) => {
    setValue('headline', val || '');
    debouncedUpdateTranslation('headline', val);
  };

  const handleTypeChange = (val: 'url' | 'file') => {
    setValue('type', val);
    updateField('type', val);
  };

  const handleVideoUrlChange = (val: string) => {
    setValue('video_url', val);
    debouncedUpdateField('video_url', val);
  };

  const handleVideoFileChange = (val: string | string[]) => {
    const value = Array.isArray(val) ? val[0] : val;
    setValue('video_file', value);
    updateField('video_file', value);
  };

  const videoType = watch('type');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title
        </label>
        <Input
          value={watch('title')}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Video title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline
        </label>
        <RichTextEditor
          value={watch('headline')}
          onChange={handleHeadlineChange}
          placeholder="Enter video headline..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Rich text editor for video headline
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Video Type
        </label>
        <div className="flex items-center space-x-3">
          {[
            { value: 'url', label: 'URL', icon: 'lucide:link' },
            { value: 'file', label: 'File Upload', icon: 'lucide:upload' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${videoType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
                }`}
              onClick={() => handleTypeChange(option.value as 'url' | 'file')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={option.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {videoType === 'url' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Video URL <span className="text-red-500">*</span>
          </label>
          <Input
            value={watch('video_url')}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <p className="text-xs text-neutral-500 mt-1">
            Supports YouTube, Vimeo, and direct video links
          </p>
        </div>
      )}

      {videoType === 'file' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Video File <span className="text-red-500">*</span>
          </label>
          <ImageUpload
            value={(watch('video_file') as string) || ''}
            onChange={handleVideoFileChange}
            folderId={folderId}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Upload a video file (MP4, WebM, etc.)
          </p>
        </div>
      )}
    </div>
  );
}




