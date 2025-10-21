'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';
import { siteApi } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';

interface SiteMediaCardProps {
  site: any;
  siteId: string;
  onUpdateSite?: (field: string, value: string | null) => void;
}

export default function SiteMediaCard({ site, siteId, onUpdateSite }: SiteMediaCardProps) {
  const { selectedTenant } = useAuthStore();
  const folderId = selectedTenant?.folder_files_id;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('[SiteMediaCard] Debug info:', {
      isEditing,
      folderId,
      selectedTenant,
      siteId,
      hasSite: !!site,
      canUpload: isEditing && folderId,
      tenantFolderId: selectedTenant?.folder_files_id
    });
  }, [isEditing, folderId, selectedTenant, siteId, site]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Handle logo change
  const handleLogoChange = async (assetId: string | null) => {
    if (!siteId) return;

    setIsSaving(true);
    try {
      const result = await siteApi.updateSite(Number(siteId), { logo: assetId || undefined });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update logo');
      }

      toast.success(assetId ? "Logo updated successfully!" : "Logo removed successfully!");
      
      // Call parent callback if provided
      if (onUpdateSite) {
        onUpdateSite('logo', assetId);
      }

    } catch (error) {
      console.error("Error updating logo:", error);
      toast.error("Failed to update logo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle favicon change
  const handleFaviconChange = async (assetId: string | null) => {
    if (!siteId) return;

    setIsSaving(true);
    try {
      const result = await siteApi.updateSite(Number(siteId), { favicon: assetId || undefined });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update favicon');
      }

      toast.success(assetId ? "Favicon updated successfully!" : "Favicon removed successfully!");
      
      // Call parent callback if provided
      if (onUpdateSite) {
        onUpdateSite('favicon', assetId);
      }

    } catch (error) {
      console.error("Error updating favicon:", error);
      toast.error("Failed to update favicon. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // Save is now handled by individual change handlers
    setIsEditing(false);
  };
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-content-primary">Site Media</h2>
            <p className="text-xs text-content-tertiary">
              {isEditing ? 'Upload or change logo and favicon' : 'Logo and favicon for your site'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <label className="text-sm font-medium text-content-primary mb-2 block">Logo</label>
            {isEditing ? (
              <ImageUploadField
                value={site.logo}
                onChange={handleLogoChange}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-start space-x-3">
                    <Button
                      variant="ghost"
                      className={`relative w-20 h-20 rounded-lg overflow-hidden p-2 bg-white flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors ${!isEditing ? 'pointer-events-none' : ''}`}
                      onClick={() => {
                        console.log('[SiteMediaCard] Logo button clicked:', { isEditing, folderId, openPicker });
                        if (isEditing) {
                          openPicker();
                        }
                      }}
                    >
                      {hasImage && imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt="Site logo"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
                          <div className="w-6 h-6 rounded border border-gray-400 flex items-center justify-center mb-1">
                            <Icon
                              icon="lucide:plus"
                              className="w-3 h-3 text-gray-500"
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Upload</span>
                        </div>
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="space-y-1.5 text-xs text-content-tertiary">
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>File Size: Up to 5mb</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>Optimal Dimension: 600px x 600px</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>Supported: PNG, JPG, WEBP, SVG</span>
                        </div>
                      </div>
                      {isEditing && hasImage && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={removeImage}
                            disabled={isSaving || isUploading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ImageUploadField>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {site.logo ? (
                  <div className="space-y-2">
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${site.logo}`} 
                      alt="Site logo" 
                      width={64}
                      height={64}
                      className="mx-auto h-16 w-auto object-contain"
                    />
                    <p className="text-sm text-content-secondary">Current logo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon icon="lucide:image" className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-sm text-content-secondary">No logo uploaded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Favicon */}
          <div>
            <label className="text-sm font-medium text-content-primary mb-2 block">Favicon</label>
            {isEditing ? (
              <ImageUploadField
                value={site.favicon}
                onChange={handleFaviconChange}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-start space-x-3">
                    <Button
                      variant="ghost"
                      className={`relative w-16 h-16 rounded-lg overflow-hidden p-2 bg-white flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors ${!isEditing ? 'pointer-events-none' : ''}`}
                      onClick={() => {
                        console.log('[SiteMediaCard] Favicon button clicked:', { isEditing, folderId, openPicker });
                        if (isEditing) {
                          openPicker();
                        }
                      }}
                    >
                      {hasImage && imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt="Site favicon"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
                          <div className="w-5 h-5 rounded border border-gray-400 flex items-center justify-center mb-1">
                            <Icon
                              icon="lucide:plus"
                              className="w-2.5 h-2.5 text-gray-500"
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Upload</span>
                        </div>
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="space-y-1.5 text-xs text-content-tertiary">
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>File Size: Up to 1mb</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>Optimal Dimension: 32px x 32px</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon icon="lucide:info" className="w-3 h-3" />
                          <span>Supported: ICO, PNG, JPG</span>
                        </div>
                      </div>
                      {isEditing && hasImage && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={removeImage}
                            disabled={isSaving || isUploading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ImageUploadField>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {site.favicon ? (
                  <div className="space-y-2">
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${site.favicon}`} 
                      alt="Site favicon" 
                      width={32}
                      height={32}
                      className="mx-auto h-8 w-8 object-contain"
                    />
                    <p className="text-sm text-content-secondary">Current favicon</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon icon="lucide:star" className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-content-secondary">No favicon uploaded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
