'use client';

import React, { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { assetsApi } from '@/lib/api';

interface ImageUploadProps {
  value?: string; // Asset ID or URL
  onChange: (assetId: string) => void;
  className?: string;
  folderId?: string; // Folder ID for upload
  eventId?: string; // Event ID to tag file
}

export function ImageUpload({ value, onChange, className = '', folderId, eventId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Directus with folder and event_id
    setUploading(true);
    try {
      const result = await assetsApi.uploadFile(file, folderId, eventId);
      if (result.success && result.data) {
        const assetId = (result.data as { id: string }).id;
        onChange(assetId);
      } else {
        alert(result.error || 'Upload failed');
        setPreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const imageUrl = value 
    ? (value.startsWith('http') ? value : assetsApi.getAssetUrl(value))
    : preview;

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 inline mr-1" />
              Change
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              onClick={handleRemove}
              disabled={uploading}
            >
              <Icon icon="lucide:trash-2" className="w-4 h-4 inline mr-1" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-600">Uploading...</p>
            </>
          ) : (
            <>
              <Icon icon="lucide:upload-cloud" className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
              <p className="text-xs text-neutral-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </>
          )}
        </button>
      )}
    </div>
  );
}

