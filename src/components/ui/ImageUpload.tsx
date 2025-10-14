'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { assetsApi } from '@/lib/api';
import { Button } from './button';
import ImagePickerDialog from './ImagePickerDialog';

interface ImageUploadProps {
  value?: string; // Asset ID or URL
  onChange: (assetId: string) => void;
  className?: string;
  folderId?: string; // Folder ID for upload
  // eventId?: string; // Event ID to tag file - not used currently
}

export function ImageUpload({ value, onChange, className = '', folderId }: ImageUploadProps) {
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
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                onClick={handleRemove}
              >
                <Icon icon="lucide:trash-2" className="w-4 h-4 inline mr-1" />
                Remove
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
        currentValue={value}
      />
    </>
  );
}

