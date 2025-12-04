'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import type { LanguageCode, Page, PageTranslation } from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';


type LanguageOption = 'en-US' | 'vi-VN';

interface MetadataState {
  id?: number;
  title: string;
  permalink: string;
}

interface PageMetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  page?: Page | null;
  defaultLanguage?: LanguageOption;
  onApply?: (entry: { id?: number; languages_code: LanguageOption; title?: string | null; permalink?: string | null }) => void;
}

const LANGUAGE_OPTIONS: LanguageOption[] = ['en-US', 'vi-VN'];

const formatPermalinkValue = (value: string): string => {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, '') // remove leading/trailing slash
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to hyphen
    .replace(/[^a-z0-9\-_/]/g, '') // remove invalid chars but keep hyphen underscore slash
    .replace(/\/+/g, '/') // collapse multiple slashes
    .replace(/-+/g, '-') // collapse hyphen
    .replace(/^-+|-+$/g, ''); // trim hyphen edges
};

const isValidPermalink = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return false;
  }
  return /^[a-z0-9\-_/]+$/.test(value);
};

function getTranslationState(
  translations: PageTranslation[] | undefined,
  lang: LanguageOption
): MetadataState {
  const translation = translations?.find(
    (t) => extractLanguageCode(t.languages_code) === lang
  );
  return {
    id: translation?.id,
    title: translation?.title || '',
    permalink: translation?.permalink?.replace(/^\/+/, '') || '',
  };
}

export default function PageMetadataDialog({
  isOpen,
  onClose,
  pageId,
  page,
  defaultLanguage = 'en-US',
  onApply,
}: PageMetadataDialogProps) {
  const originalTranslations = (page as Page | undefined)?.translations;
  const [activeLang, setActiveLang] = useState<LanguageOption>(defaultLanguage);

  // Create session-only translations if original is empty
  const getSessionTranslations = useCallback((original: PageTranslation[] | undefined): Record<LanguageOption, MetadataState & { isSessionOnly: boolean }> => {
    if (!original || original.length === 0) {
      console.log('[PageMetadataDialog] Original translations empty, creating session-only records');
      return {
        'en-US': { id: 0, title: '', permalink: '', isSessionOnly: true },
        'vi-VN': { id: 0, title: '', permalink: '', isSessionOnly: true },
      };
    }

    // If partial (only one language), create session-only for missing one
    const result: Record<LanguageOption, MetadataState & { isSessionOnly: boolean }> = {
      'en-US': { ...getTranslationState(original, 'en-US'), isSessionOnly: false },
      'vi-VN': { ...getTranslationState(original, 'vi-VN'), isSessionOnly: false },
    };

    // Mark missing languages as session-only
    if (!original.find(t => extractLanguageCode(t.languages_code) === 'en-US')) {
      result['en-US'] = { id: 0, title: '', permalink: '', isSessionOnly: true };
    }
    if (!original.find(t => extractLanguageCode(t.languages_code) === 'vi-VN')) {
      result['vi-VN'] = { id: 0, title: '', permalink: '', isSessionOnly: true };
    }

    return result;
  }, []);

  const [metadata, setMetadata] = useState<Record<LanguageOption, MetadataState & { isSessionOnly: boolean }>>(() =>
    getSessionTranslations(originalTranslations)
  );
  const [slugErrors, setSlugErrors] = useState<Record<LanguageOption, string | null>>({
    'en-US': null,
    'vi-VN': null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveLang(defaultLanguage);
      setMetadata(getSessionTranslations(originalTranslations));
      setSlugErrors({
        'en-US': null,
        'vi-VN': null,
      });
      console.log('[PageMetadataDialog] Dialog opened, metadata initialized:', getSessionTranslations(originalTranslations));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageId, originalTranslations?.map((t) => `${t.id}-${t.permalink}-${t.title}`).join('|')]);

  const activeState = useMemo(() => metadata[activeLang], [metadata, activeLang]);

  const handleTitleChange = useCallback(
    (lang: LanguageOption, value: string) => {
      setMetadata((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          title: value,
        },
      }));
    },
    []
  );

  const handlePermalinkChange = useCallback(
    (lang: LanguageOption, value: string) => {
      setMetadata((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          permalink: value,
        },
      }));
      setSlugErrors((prev) => ({
        ...prev,
        [lang]: null,
      }));
    },
    []
  );

  const handleAutoGenerate = useCallback(
    (lang: LanguageOption) => {
      const title = metadata[lang].title || '';
      const formatted = formatPermalinkValue(title);
      setMetadata((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          permalink: formatted,
        },
      }));
    },
    [metadata]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // Validate for the active language only and stage changes (do not call API here)
    const lang = activeLang;
    const { id, title, permalink, isSessionOnly } = metadata[lang];

    // Format and validate permalink
    const formatted = formatPermalinkValue(permalink || '');
    if (formatted && !isValidPermalink(formatted)) {
      setSlugErrors((prev) => ({ ...prev, [lang]: 'Invalid permalink format' }));
      toast.error('Please fix permalink errors before saving.');
      setIsSaving(false);
      return;
    }

    // For session-only translations, always stage (even if looks empty, it's a new translation)
    // For existing translations, compare with original to only stage real changes
    let hasTitleChanged = false;
    let hasPermalinkChanged = false;

    if (isSessionOnly) {
      // Session-only: stage if user entered anything
      hasTitleChanged = !!title;
      hasPermalinkChanged = !!formatted;
      console.log('[PageMetadataDialog] Session-only translation, will create: hasTitleChanged=', hasTitleChanged, 'hasPermalinkChanged=', hasPermalinkChanged);
    } else {
      // Existing: compare with original
      const original = getTranslationState(originalTranslations, lang);
      const originalPermalinkNormalized = formatPermalinkValue(original.permalink || '');
      const currentPermalinkNormalized = formatted;

      hasTitleChanged = title !== original.title;
      hasPermalinkChanged = currentPermalinkNormalized !== originalPermalinkNormalized;
      console.log('[PageMetadataDialog] Existing translation, changes: title=', hasTitleChanged, 'permalink=', hasPermalinkChanged);
    }

    if (!hasTitleChanged && !hasPermalinkChanged) {
      toast.success('No changes to stage');
      setIsSaving(false);
      return;
    }

    // Build entry for staging
    const entry: {
      id?: number;
      languages_code: LanguageOption;
      title?: string | null;
      permalink?: string | null;
      isSessionOnly?: boolean;
    } = {
      languages_code: lang,
    };

    // For session-only, send id=0 to signal CREATE; for existing, send real id
    if (!isSessionOnly && id) {
      entry.id = id;
    } else if (isSessionOnly) {
      entry.id = 0; // Signal: this is a session-only translation to CREATE
    }

    if (hasTitleChanged) entry.title = title || null;
    if (hasPermalinkChanged) entry.permalink = formatted ? `/${formatted}` : '/';
    entry.isSessionOnly = isSessionOnly;

    console.log('[PageMetadataDialog] Staging entry:', entry);

    // Stage via onApply callback to PageBuilder (payload manager)
    onApply?.(entry);

    toast.success('Staged metadata changes');
    setIsSaving(false);
    onClose();
  }, [activeLang, metadata, onApply, onClose, originalTranslations]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon icon="lucide:type" className="w-5 h-5 text-neutral-600" />
            <span>Edit Page Title & Permalink</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">
                Update the page metadata used for navigation and URLs.
              </p>
              {activeState.isSessionOnly && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded inline-block">
                  ✨ New translation (will be created)
                </p>
              )}
            </div>
            <div className="flex items-center bg-neutral-100 rounded-lg p-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <div key={lang} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      activeLang === lang
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {lang === 'en-US' ? 'En' : 'Vi'}
                  </button>
                  {metadata[lang].isSessionOnly && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Page Title
              </label>
              <Input
                value={activeState.title}
                onChange={(event) => handleTitleChange(activeLang, event.target.value)}
                placeholder="Enter page title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Permalink
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoGenerate(activeLang)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Auto generate from title
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-500">/</span>
                <Input
                  value={activeState.permalink}
                  onChange={(event) => handlePermalinkChange(activeLang, event.target.value)}
                  placeholder="your-page-slug"
                  className={slugErrors[activeLang] ? 'border-red-500 focus:ring-red-500' : ''}
                />
              </div>
              {slugErrors[activeLang] && (
                <p className="mt-1 text-xs text-red-500">{slugErrors[activeLang]}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                Full URL: /{activeState.permalink || 'your-page-slug'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            className="text-white"
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
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


