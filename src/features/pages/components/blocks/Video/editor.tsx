'use client';

import React from 'react';
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
  const videoType = (formData as BlockVideo).type || '';
  const videoUrl = (formData as BlockVideo).video_url || '';
  const videoFile = (formData as BlockVideo).video_file || null;
  const title = (currentTranslation as BlockVideoTranslation).title || '';
  const headline = (currentTranslation as BlockVideoTranslation).headline || '';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title
        </label>
        <Input
          value={title}
          onChange={(event) => updateTranslation('title', event.target.value || null)}
          placeholder="Video title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline
        </label>
        <RichTextEditor
          value={headline}
          onChange={(value) => updateTranslation('headline', value || null)}
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
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${
                videoType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateField('type', option.value)}
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
            value={videoUrl}
            onChange={(event) => updateField('video_url', event.target.value || null)}
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
            value={videoFile as string | null}
            onChange={(fileId) => updateField('video_file', fileId || null)}
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




