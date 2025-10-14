'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { siteApi } from '@/lib/api';
import { toast } from 'sonner';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';

interface SiteBasicInfoProps {
  site: {
    id: number;
    slug?: string;
    domain?: string;
    status?: string;
    logo?: string | null;
    favicon?: string | null;
    tenant_id?: number;
    translations?: Array<{
      id?: number;
      languages_code: string;
      title?: string;
      description?: string;
    }>;
  };
  onUpdate: () => void;
}

export default function SiteBasicInfo({ site, onUpdate }: SiteBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedTenant = useAuthStore((state) => state.selectedTenant);
  const folderId = (selectedTenant as any)?.folder_files_id;

  const [formData, setFormData] = useState({
    slug: site.slug || '',
    domain: site.domain || '',
    status: site.status || 'draft',
    logo: site.logo || null,
    favicon: site.favicon || null,
    translations: {
      'en-US': {
        id: site.translations?.find(t => t.languages_code === 'en-US')?.id,
        title: site.translations?.find(t => t.languages_code === 'en-US')?.title || '',
        description: site.translations?.find(t => t.languages_code === 'en-US')?.description || '',
      },
      'vi-VN': {
        id: site.translations?.find(t => t.languages_code === 'vi-VN')?.id,
        title: site.translations?.find(t => t.languages_code === 'vi-VN')?.title || '',
        description: site.translations?.find(t => t.languages_code === 'vi-VN')?.description || '',
      }
    }
  });

  useEffect(() => {
    setFormData({
      slug: site.slug || '',
      domain: site.domain || '',
      status: site.status || 'draft',
      logo: site.logo || null,
      favicon: site.favicon || null,
      translations: {
        'en-US': {
          id: site.translations?.find(t => t.languages_code === 'en-US')?.id,
          title: site.translations?.find(t => t.languages_code === 'en-US')?.title || '',
          description: site.translations?.find(t => t.languages_code === 'en-US')?.description || '',
        },
        'vi-VN': {
          id: site.translations?.find(t => t.languages_code === 'vi-VN')?.id,
          title: site.translations?.find(t => t.languages_code === 'vi-VN')?.title || '',
          description: site.translations?.find(t => t.languages_code === 'vi-VN')?.description || '',
        }
      }
    });
  }, [site]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare translations payload
      const translationsUpdate = [];
      const translationsCreate = [];

      // English translation
      if (formData.translations['en-US'].id) {
        translationsUpdate.push({
          id: formData.translations['en-US'].id,
          title: formData.translations['en-US'].title,
          description: formData.translations['en-US'].description,
        });
      } else if (formData.translations['en-US'].title || formData.translations['en-US'].description) {
        translationsCreate.push({
          languages_code: { code: 'en-US' },
          title: formData.translations['en-US'].title,
          description: formData.translations['en-US'].description,
        });
      }

      // Vietnamese translation
      if (formData.translations['vi-VN'].id) {
        translationsUpdate.push({
          id: formData.translations['vi-VN'].id,
          title: formData.translations['vi-VN'].title,
          description: formData.translations['vi-VN'].description,
        });
      } else if (formData.translations['vi-VN'].title || formData.translations['vi-VN'].description) {
        translationsCreate.push({
          languages_code: { code: 'vi-VN' },
          title: formData.translations['vi-VN'].title,
          description: formData.translations['vi-VN'].description,
        });
      }

      const payload: any = {
        slug: formData.slug,
        domain: formData.domain,
        status: formData.status,
        logo: formData.logo || undefined,
        favicon: formData.favicon || undefined,
      };

      // Add translations if any
      if (translationsUpdate.length > 0 || translationsCreate.length > 0) {
        payload.translations = {};
        if (translationsUpdate.length > 0) {
          payload.translations.update = translationsUpdate;
        }
        if (translationsCreate.length > 0) {
          payload.translations.create = translationsCreate;
        }
      }

      const result = await siteApi.updateSite(site.id, payload);
      
      if (result.success) {
        toast.success('Site updated successfully');
        setIsEditing(false);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to update site');
      }
    } catch (error) {
      toast.error('Failed to update site');
      console.error('Update site error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Basic Information</h2>
          <p className="text-xs text-content-tertiary mt-0.5">Site configuration and identity</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    slug: site.slug || '',
                    domain: site.domain || '',
                    status: site.status || 'draft',
                    logo: site.logo || null,
                    favicon: site.favicon || null,
                    translations: {
                      'en-US': {
                        id: site.translations?.find(t => t.languages_code === 'en-US')?.id,
                        title: site.translations?.find(t => t.languages_code === 'en-US')?.title || '',
                        description: site.translations?.find(t => t.languages_code === 'en-US')?.description || '',
                      },
                      'vi-VN': {
                        id: site.translations?.find(t => t.languages_code === 'vi-VN')?.id,
                        title: site.translations?.find(t => t.languages_code === 'vi-VN')?.title || '',
                        description: site.translations?.find(t => t.languages_code === 'vi-VN')?.description || '',
                      }
                    }
                  });
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Site ID */}
        <div>
          <label className="text-sm font-medium text-content-primary block mb-2">Site ID</label>
          <div className="text-content-secondary">#{site.id}</div>
        </div>

        {/* Slug and Domain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-content-primary block mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="my-event-site"
                className="w-full"
              />
            ) : (
              <div className="text-content-primary font-mono text-sm">{site.slug || '—'}</div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-content-primary block mb-2">Domain</label>
            {isEditing ? (
              <Input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="myevent.com"
                className="w-full"
              />
            ) : (
              <div className="text-content-primary font-mono text-sm">{site.domain || '—'}</div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-content-primary block mb-2">Status</label>
          {isEditing ? (
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              site.status === 'published' ? 'bg-green-100 text-green-800' : 
              site.status === 'archived' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-content-primary'
            }`}>
              {site.status || 'draft'}
            </span>
          )}
        </div>

        {/* Translations - English */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon icon="lucide:globe" className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-content-primary">English Content</h3>
          </div>
          <div className="space-y-4 pl-7">
            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Title (English)</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.translations['en-US'].title}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      'en-US': { ...formData.translations['en-US'], title: e.target.value }
                    }
                  })}
                  placeholder="Site title in English"
                  className="w-full"
                />
              ) : (
                <div className="text-content-primary">{formData.translations['en-US'].title || '—'}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Description (English)</label>
              {isEditing ? (
                <textarea
                  value={formData.translations['en-US'].description}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      'en-US': { ...formData.translations['en-US'], description: e.target.value }
                    }
                  })}
                  placeholder="Site description in English"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <div className="text-content-primary">{formData.translations['en-US'].description || '—'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Translations - Vietnamese */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon icon="lucide:globe" className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-semibold text-content-primary">Vietnamese Content</h3>
          </div>
          <div className="space-y-4 pl-7">
            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Title (Vietnamese)</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.translations['vi-VN'].title}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      'vi-VN': { ...formData.translations['vi-VN'], title: e.target.value }
                    }
                  })}
                  placeholder="Tiêu đề trang bằng tiếng Việt"
                  className="w-full"
                />
              ) : (
                <div className="text-content-primary">{formData.translations['vi-VN'].title || '—'}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Description (Vietnamese)</label>
              {isEditing ? (
                <textarea
                  value={formData.translations['vi-VN'].description}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      'vi-VN': { ...formData.translations['vi-VN'], description: e.target.value }
                    }
                  })}
                  placeholder="Mô tả trang bằng tiếng Việt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <div className="text-content-primary">{formData.translations['vi-VN'].description || '—'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Site Media */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-content-primary mb-4">Site Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="text-sm font-medium text-content-primary block mb-3">Site Logo</label>
              {isEditing && folderId ? (
                <ImageUploadField
                  value={formData.logo}
                  onChange={(assetId) => setFormData({ ...formData, logo: assetId })}
                  folderId={folderId}
                >
                  {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                    <div className="space-y-2">
                      <div
                        onClick={openPicker}
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                            <span className="text-sm text-gray-500">Uploading...</span>
                          </div>
                        ) : hasImage ? (
                          <img src={imageUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-2">
                              <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Upload</span>
                          </div>
                        )}
                      </div>
                      {hasImage && (
                        <Button variant="ghost" size="sm" onClick={removeImage} className="w-full">
                          <Icon icon="lucide:trash-2" className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </ImageUploadField>
              ) : (
                <div className="w-full h-40 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
                  {site.logo ? (
                    <img src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${site.logo}`} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Icon icon="lucide:image" className="w-8 h-8 text-content-tertiary" />
                  )}
                </div>
              )}
            </div>

            {/* Favicon */}
            <div>
              <label className="text-sm font-medium text-content-primary block mb-3">Favicon</label>
              {isEditing && folderId ? (
                <ImageUploadField
                  value={formData.favicon}
                  onChange={(assetId) => setFormData({ ...formData, favicon: assetId })}
                  folderId={folderId}
                >
                  {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                    <div className="space-y-2">
                      <div
                        onClick={openPicker}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Icon icon="lucide:loader-2" className="w-6 h-6 text-gray-400 animate-spin mb-1" />
                            <span className="text-xs text-gray-500">Uploading...</span>
                          </div>
                        ) : hasImage ? (
                          <img src={imageUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center mb-1">
                              <Icon icon="lucide:plus" className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Upload</span>
                          </div>
                        )}
                      </div>
                      {hasImage && (
                        <Button variant="ghost" size="sm" onClick={removeImage} className="w-full">
                          <Icon icon="lucide:trash-2" className="w-3 h-3 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </ImageUploadField>
              ) : (
                <div className="w-32 h-32 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
                  {site.favicon ? (
                    <img src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${site.favicon}`} alt="Favicon" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Icon icon="lucide:image" className="w-6 h-6 text-content-tertiary" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

