'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { directusHelpers } from '@/lib/directus';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';

interface DirectusFile {
  id: string;
  filename_download: string;
  type: string;
  filesize: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  uploaded_on: string;
}

interface ImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string | string[]) => void;
  folderId?: string;
  currentValue?: string | string[];
  multiple?: boolean; // Allow multiple selection
}

export default function ImagePickerDialog({
  isOpen,
  onClose,
  onSelect,
  folderId,
  currentValue,
  multiple = false,
}: ImagePickerDialogProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [files, setFiles] = useState<DirectusFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(() => {
    if (multiple && Array.isArray(currentValue)) {
      return new Set(currentValue);
    } else if (!multiple && typeof currentValue === 'string') {
      return new Set([currentValue]);
    }
    return new Set();
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files from library when dialog opens
  useEffect(() => {
    if (isOpen && activeTab === 'library' && folderId) {
      loadLibraryFiles();
    }
  }, [isOpen, activeTab, folderId]);

  const loadLibraryFiles = async () => {
    if (!folderId) {
      console.warn('No folderId provided');
      return;
    }

    setLoading(true);
    try {
      const result = await directusHelpers.getFilesByFolder(folderId, 100);
      if (result.success && result.data) {
        // Filter only image files
        const imageFiles = result.data.filter((file: DirectusFile) => 
          file.type?.startsWith('image/')
        );
        setFiles(imageFiles);
      } else {
        console.error('Failed to load files:', result.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // In multiple mode, upload all files. In single mode, upload only the first one.
    const filesToUpload = multiple ? Array.from(fileList) : [fileList[0]];

    setUploading(true);
    try {
      const uploadedIds: string[] = [];

      for (const file of filesToUpload) {
        try {
          const result = await directusHelpers.uploadFile(file, folderId);
          if (result.success && result.data) {
            uploadedIds.push(result.data.id);
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      if (uploadedIds.length > 0) {
        // Reload library to show new files
        await loadLibraryFiles();

        if (multiple) {
          // Add to existing selection
          const newSelection = new Set(selectedFiles);
          uploadedIds.forEach(id => newSelection.add(id));
          setSelectedFiles(newSelection);
        } else {
          // Replace selection with first uploaded file
          setSelectedFiles(new Set([uploadedIds[0]]));
        }

        // Switch to library tab to show them
        setActiveTab('library');
        toast.success(`${uploadedIds.length} image(s) uploaded successfully`, {
          description: 'The images have been added to your library.',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Failed to upload images.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelect = () => {
    if (multiple) {
      if (selectedFiles.size > 0) {
        onSelect(Array.from(selectedFiles));
        onClose();
      }
    } else {
      const firstSelected = Array.from(selectedFiles)[0];
      if (firstSelected) {
        onSelect(firstSelected);
        onClose();
      }
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      if (!multiple) {
        // Single mode: clear previous selection
        newSelection.clear();
      }
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const getAssetUrl = (assetId: string) => {
    return `https://app.nexpo.vn/assets/${assetId}?width=200&height=200&fit=cover`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-content-primary">
                    Select Image
                  </Dialog.Title>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                  >
                    <Icon icon="lucide:x" className="w-5 h-5" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex px-6">
                    <Button
                      onClick={() => setActiveTab('library')}
                      variant="ghost"
                      className={`px-4 py-3 text-sm font-medium border-b-2 rounded-none ${
                        activeTab === 'library'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-content-tertiary'
                      }`}
                    >
                      <Icon icon="lucide:images" className="w-4 h-4 inline mr-2" />
                      Library
                    </Button>
                    <Button
                      onClick={() => setActiveTab('upload')}
                      variant="ghost"
                      className={`px-4 py-3 text-sm font-medium border-b-2 rounded-none ${
                        activeTab === 'upload'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-content-tertiary'
                      }`}
                    >
                      <Icon icon="lucide:upload" className="w-4 h-4 inline mr-2" />
                      Upload New
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4" style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
                  {activeTab === 'library' && (
                    <>
                      {!folderId ? (
                        <div className="flex flex-col items-center justify-center h-64 text-content-tertiary">
                          <Icon icon="lucide:folder-x" className="w-16 h-16 mb-4" />
                          <p>No folder selected for this tenant</p>
                        </div>
                      ) : loading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-content-secondary">Loading images...</p>
                          </div>
                        </div>
                      ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-content-tertiary">
                          <Icon icon="lucide:image-off" className="w-16 h-16 mb-4" />
                          <p className="text-lg font-medium mb-2">No images in library</p>
                          <p className="text-sm">Upload your first image to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-4">
                          {files.map((file) => {
                            const isSelected = selectedFiles.has(file.id);
                            return (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => toggleFileSelection(file.id)}
                                className={`relative group rounded-lg overflow-hidden border-2 transition ${
                                  isSelected
                                    ? 'border-blue-600 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="aspect-square bg-gray-100 relative">
                                  <Image
                                    src={getAssetUrl(file.id)}
                                    alt={file.title || file.filename_download}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Icon icon="lucide:check" className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 bg-white">
                                  <p className="text-xs text-content-secondary truncate" title={file.filename_download}>
                                    {file.filename_download}
                                  </p>
                                  <p className="text-xs text-content-tertiary">
                                    {formatFileSize(file.filesize)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'upload' && (
                    <div className="flex flex-col items-center justify-center h-64">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={multiple}
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-content-secondary font-medium">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Icon icon="lucide:upload-cloud" className="w-16 h-16 text-content-tertiary mb-4" />
                            <p className="text-lg font-medium text-content-primary mb-2">
                              Click to upload {multiple ? 'images' : 'image'}
                            </p>
                            <p className="text-sm text-content-tertiary">
                              PNG, JPG, WEBP, SVG up to 5MB {multiple ? '(multiple files allowed)' : ''}
                            </p>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <Button
                    onClick={onClose}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSelect}
                    disabled={selectedFiles.size === 0}
                    variant="default"
                  >
                    Select {multiple && selectedFiles.size > 1 ? `${selectedFiles.size} Images` : 'Image'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
