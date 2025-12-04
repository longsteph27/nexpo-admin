'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { BlockHero, BlockHeroTranslation } from '@/types/directus-collections';

interface HeroBlockEditorProps {
  formData: BlockHero | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockHeroTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function HeroBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: HeroBlockEditorProps) {
  console.log('[HeroBlockEditor] Rendering with:', {
    currentTranslation,
    headline: currentTranslation.headline,
    content: currentTranslation.content,
    formData
  });

  const handleHeadlineChange = (value: string | null) => {
    console.log('[HeroBlockEditor] Headline changed to:', value);
    updateTranslation('headline', value);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    console.log('[HeroBlockEditor] Content changed to:', value);
    updateTranslation('content', value);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={(currentTranslation.headline as string) || ''}
          onChange={handleHeadlineChange}
          placeholder="Enter your hero headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={(currentTranslation.content as string) || ''}
          onChange={handleContentChange}
          placeholder="Describe your product or service..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image Position
        </label>
        <div className="flex items-center space-x-3">
          {(['left', 'right'] as const).map((position) => (
            <button
              key={position}
              type="button"
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${formData.image_position === position
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-neutral-200 hover:border-neutral-300'
                }`}
              onClick={() => {
                console.log('[HeroBlockEditor] Image position changed to:', position);
                updateField('image_position', position);
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={`lucide:align-${position === 'left' ? 'left' : 'right'}`} className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{position}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image
        </label>
        <ImageUpload
          value={(formData.image as string) || ''}
          onChange={(assetId) => {
            console.log('[HeroBlockEditor] Image changed to:', assetId);
            updateField('image', assetId);
          }}
          folderId={folderId}
        />
      </div>
    </div>
  );
}




