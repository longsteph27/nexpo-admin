'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { assetsApi } from '@/lib/api';
import { Button } from './button';
import ImagePickerDialog from './ImagePickerDialog';

interface ImageUploadProps {
  value?: string | string[]; // Single asset ID or array of IDs for multiple
  onChange: (assetId: string | string[]) => void;
  className?: string;
  folderId?: string; // Folder ID for upload
  multiple?: boolean; // Allow multiple file selection
}

export function ImageUpload({ value, onChange, className = '', folderId, multiple = false }: ImageUploadProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (assetId: string | string[]) => {
    onChange(assetId);
  };

  const handleRemove = (indexOrId?: number | string) => {
    if (multiple && Array.isArray(value)) {
      // For multiple mode, remove by index
      const newValue = value.filter((_, i) => i !== indexOrId);
      onChange(newValue);
    } else {
      // For single mode
      onChange('');
    }
  };

  // Get array of values for consistent handling
  const values = Array.isArray(value) ? value : (value ? [value] : []);

  // If single mode, just show first image
  if (!multiple) {
    const singleValue = typeof value === 'string' ? value : undefined;
    const imageUrl = singleValue
      ? (singleValue.startsWith('http') ? singleValue : assetsApi.getAssetUrl(singleValue))
      : null;

    return (
      <>
        <div className={className}>
          {imageUrl ? (
            <div className="relative group overflow-hidden">
              <Image
                src={imageUrl}
                alt="Upload preview"
                width={400}
                height={200}
                className="w-full h-48 object-cover rounded-lg border-2 border-neutral-200"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
                  onClick={() => setShowPicker(true)}
                >
                  <Icon icon="lucide:refresh-cw" className="w-4 h-4 inline mr-1" />
                  {/* Change */}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  onClick={() => handleRemove()}
                >
                  <Icon icon="lucide:trash-2" className="w-4 h-4 inline mr-1" />
                  {/* Remove */}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full border border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-100/50 transition-all bg-gray-50 h-auto"
              onClick={() => setShowPicker(true)}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-3">
                  <Icon icon="lucide:plus" className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Upload</p>
              </div>
            </Button>
          )}
        </div>

        <ImagePickerDialog
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={handleSelect}
          folderId={folderId}
          currentValue={singleValue}
          multiple={false}
        />
      </>
    );
  }

  // Multiple mode - show grid of images
  return (
    <>
      <div className={`${className} space-y-3`}>
        {/* Image Grid */}
        {values.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {values.map((id, idx) => {
              const imageUrl = id.startsWith('http') ? id : assetsApi.getAssetUrl(id);
              return (
                <div key={`${id}-${idx}`} className="relative group">
                  <Image
                    src={imageUrl}
                    alt={`Upload preview ${idx + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-40 object-cover rounded-lg border-2 border-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full border border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-100/50 transition-all bg-gray-50 h-auto"
          onClick={() => setShowPicker(true)}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-3">
              <Icon icon="lucide:plus" className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {values.length > 0 ? 'Add more images' : 'Upload images'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{values.length} selected</p>
          </div>
        </Button>
      </div>

      <ImagePickerDialog
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelect}
        folderId={folderId}
        currentValue={Array.isArray(value) ? value : []}
        multiple={true}
      />
    </>
  );
}

