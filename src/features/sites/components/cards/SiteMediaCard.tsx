'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';
import { siteApi } from '@/features/sites';
import { toast } from 'sonner';
import Image from 'next/image';
import type { FeatureSite } from '../../types';

interface SiteMediaCardProps {
  site?: FeatureSite | null;
  siteId: string;
  onUpdateSite?: (field: 'logo' | 'favicon', value: string | null) => void;
}

export default function SiteMediaCard({ site, siteId, onUpdateSite }: SiteMediaCardProps) {
  const { selectedTenant } = useAuthStore();
  const folderId = selectedTenant?.folder_files_id;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoId, setLogoId] = useState<string | null>(site?.logo ?? null);
  const [faviconId, setFaviconId] = useState<string | null>(site?.favicon ?? null);
  const [logoDraft, setLogoDraft] = useState<string | null>(site?.logo ?? null);
  const [faviconDraft, setFaviconDraft] = useState<string | null>(site?.favicon ?? null);
  const [initialMedia, setInitialMedia] = useState<{ logo: string | null; favicon: string | null }>({
    logo: site?.logo ?? null,
    favicon: site?.favicon ?? null,
  });
  const prevSiteLogo = useRef<string | null>(site?.logo ?? null);
  const prevSiteFavicon = useRef<string | null>(site?.favicon ?? null);

  useEffect(() => {
    const nextLogo = site?.logo ?? null;
    const nextFavicon = site?.favicon ?? null;
    const logoChanged = prevSiteLogo.current !== nextLogo;
    const faviconChanged = prevSiteFavicon.current !== nextFavicon;

    if (logoChanged) {
      setLogoId(nextLogo);
      if (!isEditing) {
        setLogoDraft(nextLogo);
      }
      prevSiteLogo.current = nextLogo;
    }

    if (faviconChanged) {
      setFaviconId(nextFavicon);
      if (!isEditing) {
        setFaviconDraft(nextFavicon);
      }
      prevSiteFavicon.current = nextFavicon;
    }

    if (!isEditing && (logoChanged || faviconChanged)) {
      setInitialMedia({ logo: nextLogo, favicon: nextFavicon });
    }
  }, [isEditing, site?.logo, site?.favicon]);

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
    if (!folderId) {
      toast.error('Please configure a tenant media folder before uploading images.');
      return;
    }
    setInitialMedia({ logo: logoId, favicon: faviconId });
    setLogoDraft(logoId);
    setFaviconDraft(faviconId);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setLogoDraft(initialMedia.logo);
    setFaviconDraft(initialMedia.favicon);
    setIsEditing(false);
  };

  const handleErrorToast = useCallback((defaultMessage: string, error: unknown) => {
    console.error(defaultMessage, error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message)
        : undefined;
    toast.error(message || defaultMessage);
  }, []);

  const handleLogoChange = useCallback((assetId: string | null) => {
    setLogoDraft(assetId ?? null);
  }, []);

  const handleFaviconChange = useCallback((assetId: string | null) => {
    setFaviconDraft(assetId ?? null);
  }, []);

  const currentLogoUrl = useMemo(() => {
    if (!logoId) return null;
    if (logoId.startsWith('http')) return logoId;
    return `${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${logoId}`;
  }, [logoId]);

  const currentFaviconUrl = useMemo(() => {
    if (!faviconId) return null;
    if (faviconId.startsWith('http')) return faviconId;
    return `${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${faviconId}`;
  }, [faviconId]);

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const payload: Partial<{ logo: string | null; favicon: string | null }> = {};
    if (logoDraft !== initialMedia.logo) {
      payload.logo = logoDraft ?? null;
    }
    if (faviconDraft !== initialMedia.favicon) {
      payload.favicon = faviconDraft ?? null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No media changes to save.');
      setIsEditing(false);
      return;
    }

    if (!siteId) {
      handleErrorToast('Missing site identifier, unable to save media changes.', new Error('Missing siteId'));
      return;
    }

    setIsSaving(true);
    try {
      const result = await siteApi.updateSite(Number(siteId), payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update site media');
      }

      if (payload.logo !== undefined) {
        const nextLogo = payload.logo ?? null;
        setLogoId(nextLogo);
        onUpdateSite?.('logo', nextLogo);
      }
      if (payload.favicon !== undefined) {
        const nextFavicon = payload.favicon ?? null;
        setFaviconId(nextFavicon);
        onUpdateSite?.('favicon', nextFavicon);
      }

      setInitialMedia({
        logo: payload.logo !== undefined ? payload.logo : initialMedia.logo,
        favicon: payload.favicon !== undefined ? payload.favicon : initialMedia.favicon,
      });
      setIsEditing(false);

      const successFields = [
        payload.logo !== undefined ? 'logo' : null,
        payload.favicon !== undefined ? 'favicon' : null,
      ].filter(Boolean);
      toast.success(`Updated ${successFields.join(' & ')} successfully!`);
    } catch (error) {
      handleErrorToast('Failed to save media changes. Please try again.', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    faviconDraft,
    handleErrorToast,
    initialMedia.favicon,
    initialMedia.logo,
    isSaving,
    logoDraft,
    onUpdateSite,
    siteId,
  ]);

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
                value={logoDraft}
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
                        if (isEditing && !isSaving && !isUploading) {
                          openPicker();
                        }
                      }}
                      disabled={isSaving || isUploading}
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
                {currentLogoUrl ? (
                  <div className="space-y-2">
                    <Image 
                      src={currentLogoUrl} 
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
                value={faviconDraft}
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
                        if (isEditing && !isSaving && !isUploading) {
                          openPicker();
                        }
                      }}
                      disabled={isSaving || isUploading}
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
                {currentFaviconUrl ? (
                  <div className="space-y-2">
                    <Image 
                      src={currentFaviconUrl} 
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
