'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import {
  SITE_LANGUAGE_CODES,
  siteApi,
  type FeatureSite,
  type SiteBasicInfoFormData,
} from '@/features/sites';
import type { LanguageCode } from '@/types/directus-collections';

interface SiteBasicInfoProps {
  site?: FeatureSite | null;
  onUpdate: () => void;
}

const resolveLanguageCode = (code: LanguageCode | string | { code?: string }): LanguageCode => {
  if (typeof code === 'string') {
    return code as LanguageCode;
  }
  if (code && typeof code === 'object' && 'code' in code) {
    return (code.code ?? 'en-US') as LanguageCode;
  }
  return 'en-US';
};

const buildInitialFormData = (site: FeatureSite): SiteBasicInfoFormData => {
  const translationsMap = SITE_LANGUAGE_CODES.reduce<SiteBasicInfoFormData['translations']>((acc, language) => {
    const match = site.translations?.find(
      (translation) => resolveLanguageCode(translation.languages_code) === language
    );

    acc[language] = {
      id: match?.id,
      title: match?.title ?? '',
      description: match?.description ?? '',
    };

    return acc;
  }, {} as SiteBasicInfoFormData['translations']);

  return {
    slug: site.slug ?? '',
    domain: site.domain ?? '',
    status: site.status ?? 'draft',
    logo: site.logo ?? null,
    favicon: site.favicon ?? null,
    translations: translationsMap,
  };
};

export default function SiteBasicInfo({ site, onUpdate }: SiteBasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedTenant = useAuthStore((state) => state.selectedTenant);
  const folderId = (selectedTenant as { folder_files_id?: string } | null)?.folder_files_id;

  const formDataInitializer = useMemo<SiteBasicInfoFormData>(() => {
    if (site) {
      return buildInitialFormData(site);
    }
    return {
      slug: '',
      domain: '',
      status: 'draft',
      logo: null,
      favicon: null,
      translations: SITE_LANGUAGE_CODES.reduce<SiteBasicInfoFormData['translations']>((acc, language) => {
        acc[language] = { title: '', description: '' };
        return acc;
      }, {} as SiteBasicInfoFormData['translations']),
    };
  }, [site]);

  const [formData, setFormData] = useState<SiteBasicInfoFormData>(formDataInitializer);

  useEffect(() => {
    if (site) {
      setFormData(buildInitialFormData(site));
    }
  }, [site]);

  if (!site) {
    return null;
  }

  const updateTranslation = (language: LanguageCode, field: 'title' | 'description', value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [language]: {
          ...prev.translations[language],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const translationsUpdate: Array<{ id: number; title: string; description: string }> = [];
      const translationsCreate: Array<{ languages_code: { code: LanguageCode }; title: string; description: string }> = [];

      SITE_LANGUAGE_CODES.forEach((language) => {
        const translation = formData.translations[language];
        const hasContent = Boolean(translation.title?.trim() || translation.description?.trim());

        if (translation.id) {
          translationsUpdate.push({
            id: translation.id,
            title: translation.title,
            description: translation.description,
          });
        } else if (hasContent) {
          translationsCreate.push({
            languages_code: { code: language },
            title: translation.title,
            description: translation.description,
          });
        }
      });

      const payload: Record<string, unknown> = {
        slug: formData.slug,
        domain: formData.domain,
        status: formData.status,
        logo: formData.logo || undefined,
        favicon: formData.favicon || undefined,
      };

      if (translationsUpdate.length > 0 || translationsCreate.length > 0) {
        payload.translations = {};
        if (translationsUpdate.length > 0) {
          (payload.translations as { update?: typeof translationsUpdate }).update = translationsUpdate;
        }
        if (translationsCreate.length > 0) {
          (payload.translations as { create?: typeof translationsCreate }).create = translationsCreate;
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

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(buildInitialFormData(site));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
          )}
        </div>
      </div>

      <div className="p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            {!isEditing ? (
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                {formData.slug || '—'}
              </div>
            ) : (
              <Input
                value={formData.slug}
                onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="event-site-2024"
              />
            )}
            <p className="text-xs text-content-tertiary mt-1">
              Used in URLs to identify your site. Keep it short and descriptive.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">Domain</label>
            {!isEditing ? (
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                {formData.domain || '—'}
              </div>
            ) : (
              <Input
                value={formData.domain}
                onChange={(event) => setFormData((prev) => ({ ...prev, domain: event.target.value }))}
                placeholder="example.com"
              />
            )}
            <p className="text-xs text-content-tertiary mt-1">Optional custom domain for your site (e.g., example.com)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            {!isEditing ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {formData.status}
              </div>
            ) : (
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">Logo</label>
            {isEditing ? (
              <ImageUploadField
                value={formData.logo}
                onChange={(assetId) => setFormData((prev) => ({ ...prev, logo: assetId }))}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      {hasImage && imageUrl ? (
                        <img src={imageUrl} alt="Site logo" className="max-w-[48px] max-h-[48px]" />
                      ) : (
                        <Icon icon="lucide:plus" className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {hasImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeImage}
                        disabled={isUploading}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </ImageUploadField>
            ) : (
              <div className="flex items-center space-x-4">
                {formData.logo ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${formData.logo}`}
                    alt="Site logo"
                    className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-2"
                  />
                ) : (
                  <div className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Icon icon="lucide:image" className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="text-xs text-content-tertiary">
                  Recommended size: 600x600px PNG with transparent background
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">Favicon</label>
            {isEditing ? (
              <ImageUploadField
                value={formData.favicon}
                onChange={(assetId) => setFormData((prev) => ({ ...prev, favicon: assetId }))}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      className="w-12 h-12 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      {hasImage && imageUrl ? (
                        <img src={imageUrl} alt="Site favicon" className="max-w-[32px] max-h-[32px]" />
                      ) : (
                        <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {hasImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeImage}
                        disabled={isUploading}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </ImageUploadField>
            ) : (
              <div className="flex items-center space-x-4">
                {formData.favicon ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${formData.favicon}`}
                    alt="Site favicon"
                    className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-2"
                  />
                ) : (
                  <div className="w-12 h-12 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Icon icon="lucide:star" className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="text-xs text-content-tertiary">
                  Recommended size: 32x32px ICO or PNG
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {SITE_LANGUAGE_CODES.map((language) => (
            <div key={language} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    {language === 'en-US' ? 'English' : 'Vietnamese'}
                  </p>
                  <p className="text-xs text-content-tertiary">
                    Title and description for the {language === 'en-US' ? 'English' : 'Vietnamese'} locale
                  </p>
                </div>
                {!isEditing ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-content-primary">
                    {formData.translations[language]?.title ? 'Configured' : 'Not set'}
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-content-primary mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  {!isEditing ? (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm">
                      {formData.translations[language]?.title || '—'}
                    </div>
                  ) : (
                    <Input
                      value={formData.translations[language]?.title || ''}
                      onChange={(event) => updateTranslation(language, 'title', event.target.value)}
                      placeholder={`Site title (${language === 'en-US' ? 'English' : 'Vietnamese'})`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-content-primary mb-1.5">
                    Description
                  </label>
                  {!isEditing ? (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm min-h-[80px]">
                      {formData.translations[language]?.description || '—'}
                    </div>
                  ) : (
                    <textarea
                      value={formData.translations[language]?.description || ''}
                      onChange={(event) => updateTranslation(language, 'description', event.target.value)}
                      placeholder={`Site description (${language === 'en-US' ? 'English' : 'Vietnamese'})`}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
