'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import type { BlockGallery, BlockGalleryTranslation } from '@/types/directus-collections';

interface DirectusFile {
  id: string;
  type?: string;
  title?: string;
  modified_on?: string;
  filename_download?: string;
}

interface GalleryItem {
  id: string;
  directus_files_id: string | DirectusFile;
  sort: number;
}

interface GalleryBlockEditorProps {
  formData: BlockGallery | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockGalleryTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

interface GalleryImageData {
  id: string;
  file?: DirectusFile;
}

export default function GalleryBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: GalleryBlockEditorProps) {
  // Extract gallery items with both ID and file metadata
  const galleryItemsData = ((formData as Record<string, unknown>).gallery_items as GalleryItem[]) || [];
  const initialGalleryImages: GalleryImageData[] = galleryItemsData.map((item) => {
    const fileId = typeof item.directus_files_id === 'string'
      ? item.directus_files_id
      : item.directus_files_id?.id;

    const fileMetadata = typeof item.directus_files_id === 'object' && item.directus_files_id !== null
      ? (item.directus_files_id as DirectusFile)
      : undefined;

    return {
      id: fileId,
      file: fileMetadata,
    };
  });

  const [galleryImages, setGalleryImages] = useState<GalleryImageData[]>(initialGalleryImages);

  // Sync gallery items when formData changes
  useEffect(() => {
    const currentItems = ((formData as Record<string, unknown>).gallery_items as GalleryItem[]) || [];
    const newGalleryImages: GalleryImageData[] = currentItems.map((item) => {
      const fileId = typeof item.directus_files_id === 'string'
        ? item.directus_files_id
        : item.directus_files_id?.id;

      const fileMetadata = typeof item.directus_files_id === 'object' && item.directus_files_id !== null
        ? (item.directus_files_id as DirectusFile)
        : undefined;

      return {
        id: fileId,
        file: fileMetadata,
      };
    });

    // Only update if the gallery items have actually changed
    if (JSON.stringify(newGalleryImages) !== JSON.stringify(galleryImages)) {
      setGalleryImages(newGalleryImages);
    }
  }, [formData, galleryImages]);

  const persistGalleryItems = (items: GalleryImageData[]) => {
    setGalleryImages(items);
    updateField(
      'gallery_items',
      items.map((img, index) => ({
        id: `temp-${index}`,
        directus_files_id: img.id,
        sort: index,
      })) satisfies GalleryItem[]
    );
  };

  const handleAddImage = (assetIds: string | string[]) => {
    const idsArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const newImages: GalleryImageData[] = idsArray.map(id => ({
      id,
      file: undefined, // File metadata will be loaded on next fetch
    }));
    persistGalleryItems([...galleryImages, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    const filtered = galleryImages.filter((_, itemIndex) => itemIndex !== index);
    persistGalleryItems(filtered);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          Gallery Title
        </label>
        <Input
          value={((currentTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Gallery title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          Headline Block
        </label>
        <RichTextEditor
          value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Add a headline above the gallery..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          Images ({galleryImages.length})
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {galleryImages.map((imageData, index) => (
            <div
              key={imageData.id}
              className="relative rounded-lg border border-neutral-200 overflow-hidden h-32 hover:shadow-md transition-shadow duration-200 group"
            >
              {/* Image Container */}
              <img
                src={assetsApi.getAssetUrl(imageData.id)}
                alt={imageData.file?.title || `Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay on hover - only for image container */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* File metadata tooltip - only shows on hover */}
              {imageData.file && (
                <div className="absolute top-2 left-2 bg-black text-white text-xs rounded px-2 py-1 max-w-[calc(100%-2rem)] truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {imageData.file.title || imageData.file.filename_download || 'Image'}
                </div>
              )}

              {/* Delete button - theme-aware color, only shows on hover */}
              <button
                type="button"
                className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={() => handleRemoveImage(index)}
                title="Remove image"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <ImageUpload value="" onChange={handleAddImage} folderId={folderId} eventId={eventId} multiple={true} />
      </div>
    </div>
  );
}




