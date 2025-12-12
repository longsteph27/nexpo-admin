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
import type { BlockLogoCloud, LogoCloudTranslation, LogoCloudLogo } from './types';

interface DirectusFile {
    id: string;
    type?: string;
    title?: string;
    modified_on?: string;
    filename_download?: string;
}

interface FormValues {
    logos: LogoCloudLogo[];
}

interface LogoCloudBlockEditorProps {
    formData: BlockLogoCloud | Record<string, unknown>;
    updateTranslation: (field: string, value: string | null) => void;
    updateField: (field: string, value: unknown) => void;
    currentTranslation: LogoCloudTranslation | Record<string, unknown>;
    folderId?: string;
    eventId?: string;
}

export default function LogoCloudBlockEditor({
    formData,
    updateTranslation,
    updateField,
    currentTranslation,
    folderId,
    eventId,
}: LogoCloudBlockEditorProps) {
    const blockData = formData as BlockLogoCloud;

    // Initial data parsing
    const initialLogos = useMemo(() => {
        const items = blockData.logos || [];
        return items.map((item) => {
            // Ensure structure matches LogoCloudLogo interface
            return {
                id: item.id,
                block_logocloud_id: item.block_logocloud_id,
                directus_files_id: item.directus_files_id,
                sort: item.sort
            } as LogoCloudLogo;
        });
    }, [blockData.logos]);

    // Initialize React Hook Form
    const { control, setValue, getValues, reset } = useForm<FormValues>({
        defaultValues: {
            logos: initialLogos,
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'logos',
        keyName: 'key',
    });

    // Watch for changes
    const formLogos = useWatch({
        control,
        name: 'logos',
    });

    // Debounced update to parent
    const debouncedUpdate = useMemo(
        () =>
            debounce((currentLogos: LogoCloudLogo[]) => {
                // Send the array of items to updateField
                // PagePayloadManager will handle the diffing logic (processM2M)
                updateField('logos', currentLogos);
            }, 500),
        [updateField]
    );

    // Sync form with parent state changes (handling initialization)
    const hasInitialized = useRef(false);
    const logosLength = (blockData.logos || []).length;

    useEffect(() => {
        // Only re-initialize if we haven't yet, or if external data changes significantly (length check)
        // This prevents the infinite loop where updateField triggers formData change -> reset -> updateField
        if (!hasInitialized.current && logosLength > 0) {
            reset({ logos: initialLogos });
            hasInitialized.current = true;
        } else if (logosLength === 0 && !hasInitialized.current) {
            hasInitialized.current = true;
        }
    }, [initialLogos, logosLength, reset]);

    const handleUpdate = useCallback(() => {
        const currentLogos = getValues('logos');
        debouncedUpdate(currentLogos);
    }, [debouncedUpdate, getValues]);

    // Cleanup debounce
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel();
        };
    }, [debouncedUpdate]);

    const handleAddLogo = (assetIds: string | string[]) => {
        const idsArray = Array.isArray(assetIds) ? assetIds : [assetIds];
        const currentCount = fields.length;

        const newLogos = idsArray.map((fileId, index) => ({
            id: generateTempId(),
            directus_files_id: fileId, // Store ID directly or object? Types say string | DirectusFile.
            // When referencing a file in M2M, we usually store the object status or just ID. 
            // Here, we store just the ID or partial object.
            // For display, we might need the full object, but the ImageUpload gives us IDs.
            // We'll store formatted object if needed, but for now let's store the ID as that's what we get.
            // Actually, type definition says `directus_files_id: string | DirectusFile`.
            sort: currentCount + index,
        } as LogoCloudLogo));

        append(newLogos);
        handleUpdate();
    };

    const handleRemoveLogo = (index: number) => {
        remove(index);
        // After remove, we should probably re-sort? Or let the sort be implicity by index?
        // Usually better to re-normalize sort order, but strict sort isn't always required if just a list.
        // We'll trigger update.
        handleUpdate();
    };

    // Helper to get file ID for rendering
    const getFileId = (file: string | DirectusFile): string => {
        return typeof file === 'string' ? file : file.id;
    };

    // Helper to get file title for alt text
    const getFileTitle = (file: string | DirectusFile): string => {
        if (typeof file === 'string') return 'Logo';
        return file.title || file.filename_download || 'Logo';
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                    Title
                </label>
                <Input
                    value={((currentTranslation as Record<string, unknown>).title as string) || ''}
                    onChange={(event) => updateTranslation('title', event.target.value)}
                    placeholder="Logo cloud title..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                    Headline
                </label>
                <RichTextEditor
                    value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
                    onChange={(value) => updateTranslation('headline', value)}
                    placeholder="Add a headline for the logo section..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                    Company Logos ({fields.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-3">
                    {fields.map((field, index) => {
                        // Access the actual data from the form state for rendering to ensure updates reflect immediately
                        // fields array from useFieldArray is for structure, but values might lag if not watched? 
                        // Actually fields contains default values + updates.
                        // But for complex objects like deep file refs, sometimes `field` is enough.
                        // However, `directus_files_id` might be just an ID string if added via `handleAddLogo`.
                        // If loaded from DB, it might be an object.
                        // We handle both via helper.

                        const fileData = field.directus_files_id;
                        const fileId = getFileId(fileData);

                        return (
                            <div
                                key={field.key}
                                className="relative rounded-xl border border-neutral-200 overflow-hidden aspect-square hover:shadow-md transition-shadow duration-200 group bg-white"
                            >
                                {/* Logo Container */}
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <img
                                        src={assetsApi.getAssetUrl(fileId)}
                                        alt={getFileTitle(fileData)}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                                {/* File metadata tooltip (only if object available) */}
                                {typeof fileData !== 'string' && (
                                    <div className="absolute top-2 left-2 bg-black text-white text-xs rounded px-2 py-1 max-w-[calc(100%-2rem)] truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {getFileTitle(fileData)}
                                    </div>
                                )}

                                {/* Delete button */}
                                <button
                                    type="button"
                                    className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:shadow-lg"
                                    onClick={() => handleRemoveLogo(index)}
                                    title="Remove logo"
                                >
                                    <Icon icon="lucide:x" className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <ImageUpload
                    value=""
                    onChange={handleAddLogo}
                    folderId={folderId}
                    multiple={true}
                />
            </div>
        </div>
    );
}
