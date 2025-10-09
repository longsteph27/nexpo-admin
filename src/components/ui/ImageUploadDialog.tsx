'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { directusHelpers } from '@/lib/directus';
import Image from 'next/image';
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

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
  folderId?: string;
}

type UploadMode = 'select' | 'url' | 'local' | 'library';

export function ImageUploadDialog({ open, onClose, onImageSelected, folderId }: ImageUploadDialogProps) {
  const [mode, setMode] = useState<UploadMode>('select');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<DirectusFile[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Load library files when switching to library mode
  useEffect(() => {
    if (mode === 'library' && folderId) {
      loadLibraryFiles();
    }
  }, [mode, folderId]);

  const loadLibraryFiles = async () => {
    if (!folderId) return;

    setLoadingLibrary(true);
    try {
      const result = await directusHelpers.getFilesByFolder(folderId, 100);
      if (result.success && result.data) {
        // Filter only image files
        const imageFiles = result.data.filter((file: DirectusFile) => 
          file.type?.startsWith('image/')
        );
        setLibraryFiles(imageFiles);
      } else {
        console.error('Failed to load files:', result.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setMode('select');
    setUrlInput('');
    setIsLoading(false);
    setLibraryFiles([]);
    onClose();
  };

  // Handle URL input submission
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      // Validate URL
      new URL(urlInput);
      onImageSelected(urlInput);
      handleClose();
    } catch (error) {
      toast.error('Invalid URL', {
        description: 'Please enter a valid image URL.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get Directus file URL
  const getDirectusFileUrl = (fileId: string) => {
    return `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${fileId}`;
  };

  // Handle local file upload to Directus
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select a valid image file.',
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'File size must be less than 10MB.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (folderId) {
        // Upload to Directus if folderId is available
        const result = await directusHelpers.uploadFile(file, folderId);
        if (result.success && result.data) {
          const fileId = result.data.id;
          const fileUrl = getDirectusFileUrl(fileId);
          onImageSelected(fileUrl);
          handleClose();
          toast.success('Image uploaded successfully', {
            description: 'The image has been uploaded to your library.',
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        // Fallback to base64 if no folderId
        const reader = new FileReader();
        reader.onload = () => {
          onImageSelected(reader.result as string);
          handleClose();
        };
        reader.onerror = () => {
          throw new Error('Error reading file');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle library image selection from Directus
  const handleLibrarySelect = (fileId: string) => {
    const fileUrl = getDirectusFileUrl(fileId);
    onImageSelected(fileUrl);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {mode === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Image</DialogTitle>
              <DialogDescription>
                Choose how you want to add an image to your content.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {/* Upload from computer */}
              <button
                onClick={() => setMode('local')}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Icon icon="lucide:upload" className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Upload from Computer</div>
                  <div className="text-sm text-gray-500">Select an image from your device</div>
                </div>
                <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </button>

              {/* Add from URL */}
              <button
                onClick={() => setMode('url')}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Icon icon="lucide:link" className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Add from URL</div>
                  <div className="text-sm text-gray-500">Enter an image URL from the web</div>
                </div>
                <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
              </button>

              {/* Choose from library */}
              <button
                onClick={() => setMode('library')}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Icon icon="lucide:library" className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Choose from Library</div>
                  <div className="text-sm text-gray-500">Select from your uploaded images</div>
                </div>
                <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
              </button>
            </div>
          </>
        )}

        {mode === 'url' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setMode('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Icon icon="lucide:arrow-left" className="w-5 h-5" />
                </button>
                Add Image from URL
              </DialogTitle>
              <DialogDescription>
                Enter the URL of the image you want to add.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>

              {urlInput && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Preview URL:</div>
                  <div className="text-sm text-gray-700 break-all">{urlInput}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                    Add Image
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {mode === 'local' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setMode('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Icon icon="lucide:arrow-left" className="w-5 h-5" />
                </button>
                Upload from Computer
              </DialogTitle>
              <DialogDescription>
                Select an image file from your device to upload.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex flex-col items-center justify-center py-6">
                  <Icon icon="lucide:upload-cloud" className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-3" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP (MAX. 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </>
        )}

        {mode === 'library' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setMode('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Icon icon="lucide:arrow-left" className="w-5 h-5" />
                </button>
                Choose from Library
              </DialogTitle>
              <DialogDescription>
                Select an image from your media library.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {!folderId ? (
                <div className="p-6 text-center">
                  <Icon icon="lucide:folder-x" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No folder selected for this tenant</p>
                  <p className="text-sm text-gray-500">Please configure a media folder for this tenant.</p>
                </div>
              ) : loadingLibrary ? (
                <div className="flex items-center justify-center py-12">
                  <Icon icon="lucide:loader-2" className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading images...</span>
                </div>
              ) : libraryFiles.length === 0 ? (
                <div className="p-6 text-center">
                  <Icon icon="lucide:image-off" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No images in library</p>
                  <p className="text-sm text-gray-500">Upload some images to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {libraryFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleLibrarySelect(file.id)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all group relative"
                      title={file.title || file.filename_download}
                    >
                      <Image
                        src={getDirectusFileUrl(file.id)}
                        alt={file.title || file.filename_download}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                        sizes="(max-width: 768px) 33vw, 150px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

