'use client';

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Icon } from '@iconify/react';
import debounce from 'lodash/debounce';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import { generateTempId } from '@/lib/payload/validators';
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

interface FormValues {
  gallery_items: GalleryItem[];
}

interface GalleryBlockEditorProps {
  formData: BlockGallery | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockGalleryTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

export default function GalleryBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: GalleryBlockEditorProps) {
  const blockData = formData as BlockGallery;

  // Initial data parsing
  const initialGalleryItems = useMemo(() => {
    const items = blockData.gallery_items || [];
    return items.map((item) => ({
      id: item.id,
      directus_files_id: item.directus_files_id,
      sort: item.sort
    } as GalleryItem));
  }, [blockData.gallery_items]);

  // Initialize React Hook Form
  const { control, getValues, reset } = useForm<FormValues>({
    defaultValues: {
      gallery_items: initialGalleryItems,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'gallery_items',
    keyName: 'key',
  });

  // Debounced update to parent
  const debouncedUpdate = useMemo(
    () =>
      debounce((currentItems: GalleryItem[]) => {
        updateField('gallery_items', currentItems);
      }, 500),
    [updateField]
  );

  // Sync form with parent state changes
  const galleryItemsLength = (blockData.gallery_items || []).length;

  useEffect(() => {
    // Only reset if form is empty but we have data from parent
    if (galleryItemsLength > 0 && fields.length === 0) {
      reset({ gallery_items: initialGalleryItems });
    }
  }, [initialGalleryItems, galleryItemsLength, reset, fields.length]);

  const handleUpdate = useCallback(() => {
    const currentItems = getValues('gallery_items');
    debouncedUpdate(currentItems);
  }, [debouncedUpdate, getValues]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const handleAddImage = (assetIds: string | string[]) => {
    const idsArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const currentCount = fields.length;

    const newItems = idsArray.map((fileId, index) => ({
      id: generateTempId(),
      directus_files_id: fileId,
      sort: currentCount + index,
    } as GalleryItem));

    append(newItems);
    handleUpdate();
  };

  const handleRemoveImage = (index: number) => {
    remove(index);
    handleUpdate();
  };

  // Helper to get file ID for rendering
  const getFileId = (file: string | DirectusFile): string => {
    return typeof file === 'string' ? file : file.id;
  };

  // Helper to get file title for alt text
  const getFileTitle = (file: string | DirectusFile): string => {
    if (typeof file === 'string') return 'Image';
    return file.title || file.filename_download || 'Image';
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
          Images ({fields.length})
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {fields.map((field, index) => {
            const fileData = field.directus_files_id;
            const fileId = getFileId(fileData);

            return (
              <div
                key={field.key}
                className="relative rounded-lg border border-neutral-200 overflow-hidden h-32 hover:shadow-md transition-shadow duration-200 group"
              >
                {/* Image Container */}
                <img
                  src={assetsApi.getAssetUrl(fileId)}
                  alt={getFileTitle(fileData)}
                  className="w-full h-full object-cover"
                />

                {/* Overlay on hover - only for image container */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* File metadata tooltip - only shows on hover */}
                {typeof fileData !== 'string' && (
                  <div className="absolute top-2 left-2 bg-black text-white text-xs rounded px-2 py-1 max-w-[calc(100%-2rem)] truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {getFileTitle(fileData)}
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
            );
          })}
        </div>
        <ImageUpload value="" onChange={handleAddImage} folderId={folderId} multiple={true} />
      </div>
    </div>
  );
}
