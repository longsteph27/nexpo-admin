'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import Image from 'next/image';

interface EventRecognitionStepProps {
  logoFileId: string;
  setLogoFileId: (value: string | null) => void;
  bannerFileId: string;
  setBannerFileId: (value: string | null) => void;
  selectedTenant: { folder_files_id?: string } | null; // For ImageUploadField folderId
}

export default function EventRecognitionStep({
  logoFileId,
  setLogoFileId,
  bannerFileId,
  setBannerFileId,
  selectedTenant,
}: EventRecognitionStepProps) {
  return (
    <div className="bg-white p-8 relative h-full">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-content-primary">Event recognization</h2>
            <p className="text-xs text-content-tertiary mt-2">* indicates a required field</p>
          </div>

          <div className="space-y-10">
            <div>
              <label className="text-xs font-medium text-content-secondary mb-2 block">Event Logo</label>
              <ImageUploadField value={logoFileId} onChange={setLogoFileId} folderId={selectedTenant?.folder_files_id}>
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-start space-x-3">
                    <Button
                      variant="ghost"
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden p-1.5 bg-white flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      {hasImage && imageUrl ? (
                        <Image src={imageUrl} alt="Event logo" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-nexpo-bg-gray flex flex-col items-center justify-center">
                          <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-1">
                            <Icon icon="lucide:plus" className="w-2 h-2 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Upload</span>
                        </div>
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="space-y-1.5 text-xs text-content-tertiary">
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                          <span>File Size: Up to 5mb</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                          <span>Optimal Dimension: 600px x 600px</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                          <span>Supported file type: PNG, JPG, WEBP, SVG.</span>
                        </div>
                      </div>
                      {hasImage && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={removeImage}
                            disabled={isUploading}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ImageUploadField>
            </div>

            <div>
              <label className="text-xs font-medium text-content-secondary mb-2 block">Event Banner</label>
              <ImageUploadField value={bannerFileId} onChange={setBannerFileId} folderId={selectedTenant?.folder_files_id}>
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <>
                    <Button
                      variant="ghost"
                      className="relative overflow-hidden w-full h-40 sm:h-80 border border-gray-300 rounded-sm p-1.5 bg-white hover:border-gray-400 transition-colors"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      <div className="w-full h-full rounded-md overflow-hidden">
                        {hasImage && imageUrl ? (
                          <Image src={imageUrl} alt="Event banner" width={300} height={160} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex bg-nexpo-bg-gray flex-col items-center justify-center">
                            <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-2">
                              <Icon icon="lucide:plus" className="w-2 h-2 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Upload</span>
                          </div>
                        )}
                      </div>
                      {hasImage && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            disabled={isUploading}
                            className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                    </Button>
                    <div className="mt-1.5 text-xs text-content-tertiary">
                      <div className="flex items-center space-x-2">
                        <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                        <span>Recommended: 1920x600px, max 5MB</span>
                      </div>
                    </div>
                  </>
                )}
              </ImageUploadField>
            </div>

            <div className="text-xs text-content-tertiary flex items-center gap-2">
              <Icon icon="lucide:info" className="w-4 h-4" />
              3/3 – How to recognize your Event
            </div>
            <div className="hidden" />
          </div>
        </div>
    </div>
  );
}
