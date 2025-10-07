'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { assetsApi } from '@/lib/api';
import ImagePickerDialog from './ImagePickerDialog';

interface ImageUploadProps {
  value?: string; // Asset ID or URL
  onChange: (assetId: string) => void;
  className?: string;
  folderId?: string; // Folder ID for upload
  eventId?: string; // Event ID to tag file
}

export function ImageUpload({ value, onChange, className = '', folderId, eventId }: ImageUploadProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (assetId: string) => {
    onChange(assetId);
  };

  const handleRemove = () => {
    onChange('');
  };

  const imageUrl = value 
    ? (value.startsWith('http') ? value : assetsApi.getAssetUrl(value))
    : null;

  return (
    <>
      <div className={className}>
        {imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Upload preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-neutral-200"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
              <button
                type="button"
                className="px-3 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
                onClick={() => setShowPicker(true)}
              >
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 inline mr-1" />
                Change
              </button>
              <button
                type="button"
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                onClick={handleRemove}
              >
                <Icon icon="lucide:trash-2" className="w-4 h-4 inline mr-1" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all"
            onClick={() => setShowPicker(true)}
          >
            <Icon icon="lucide:image-plus" className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-600">Click to select image</p>
            <p className="text-xs text-neutral-500 mt-1">Choose from library or upload new</p>
          </button>
        )}
      </div>

      <ImagePickerDialog
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelect}
        folderId={folderId}
        currentValue={value}
      />
    </>
  );
}

