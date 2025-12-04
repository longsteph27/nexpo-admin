'use client';

import React from 'react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import type { LanguageCode } from '@/types/directus-collections';
import type {
  FeatureSite,
  SiteInfoEditState,
  SiteTranslationFormData,
} from '../../types';
import { SITE_LANGUAGE_CODES } from '../../types';

interface SiteInfoCardProps {
  site?: FeatureSite | null;
  isEditing: boolean;
  editData: SiteInfoEditState;
  activeLang: LanguageCode;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onUpdateEditData: (
    field: keyof SiteInfoEditState,
    value: SiteInfoEditState[keyof SiteInfoEditState]
  ) => void;
  onUpdateTranslation: (langCode: LanguageCode, field: 'title' | 'description', value: string) => void;
  onSetActiveLang: (lang: LanguageCode) => void;
}

export default function SiteInfoCard({
  site,
  isEditing,
  editData,
  activeLang,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onUpdateEditData,
  onUpdateTranslation,
  onSetActiveLang,
}: SiteInfoCardProps) {
  if (!site) {
    return null;
  }

  const siteTranslations = site.translations ?? [];

  // Debug logging
  React.useEffect(() => {
    console.log('[SiteInfoCard] Props received:', {
      site,
      isEditing,
      editData,
      activeLang,
      siteTranslations: site?.translations
    });
  }, [site, isEditing, editData, activeLang]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-content-primary">Site Information</h2>
            <p className="text-xs text-content-tertiary">
              {isEditing ? 'Edit site details below' : 'Basic information about your site'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={onSave}
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
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <div>
            <label className="text-sm font-medium text-content-primary mb-2 block">
              Status <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <Select
                value={editData.status || 'draft'}
                onValueChange={(value) =>
                  onUpdateEditData('status', value as SiteInfoEditState['status'])
                }
              >
                <SelectTrigger className="w-full">
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

          {/* Slug */}
          <div>
            <label className="text-sm font-medium text-content-primary mb-2 block">
              Slug <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <Input
                value={editData.slug || ''}
                onChange={(e) => onUpdateEditData('slug', e.target.value)}
                placeholder="my-site-slug"
                className="font-mono"
              />
            ) : (
              <div className="mt-1 text-content-primary font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
                {site.slug || '—'}
              </div>
            )}
            <p className="text-xs text-content-tertiary mt-1">
              URL-friendly identifier for your site
            </p>
          </div>

          {/* Domain */}
          <div>
            <label className="text-sm font-medium text-content-primary mb-2 block">
              Domain
            </label>
            {isEditing ? (
              <Input
                value={editData.domain || ''}
                onChange={(e) => onUpdateEditData('domain', e.target.value)}
                placeholder="example.com"
                className="font-mono"
              />
            ) : (
              <div className="mt-1 text-content-primary font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
                {site.domain || '—'}
              </div>
            )}
            <p className="text-xs text-content-tertiary mt-1">
              Custom domain for your site (optional)
            </p>
          </div>
        </div>

        {/* Translations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-content-primary">Translations</h3>
              
              {/* Language Switcher - luôn hiển thị */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {SITE_LANGUAGE_CODES.map((lang) => (
                  <button
                    key={lang}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeLang === lang
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => onSetActiveLang(lang)}
                  >
                    {lang === 'en-US' ? 'English' : 'Tiếng Việt'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {(() => {
            const translations: SiteTranslationFormData[] = isEditing
              ? editData.translations
              : (siteTranslations || []).map((translation) => ({
                  id: translation.id,
                  languages_code: translation.languages_code,
                  title: translation.title ?? '',
                  description: translation.description ?? '',
                }));

            const currentTranslation =
              translations.find((t) => t.languages_code === activeLang) ?? {
                languages_code: activeLang,
                title: '',
                description: '',
              };
            
            return (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs font-medium text-content-tertiary uppercase">
                    {activeLang}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-content-primary mb-2 block">
                      Title <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <Input
                        value={currentTranslation.title || ''}
                        onChange={(e) => onUpdateTranslation(activeLang, 'title', e.target.value)}
                        placeholder="Site title"
                      />
                    ) : (
                      <div className="text-content-primary bg-gray-50 px-3 py-2 rounded-lg">
                        {currentTranslation.title || '—'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-content-primary mb-2 block">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={currentTranslation.description || ''}
                        onChange={(e) => onUpdateTranslation(activeLang, 'description', e.target.value)}
                        placeholder="Site description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <div className="text-content-primary bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">
                        {currentTranslation.description || '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
