'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import type { Page, PageTranslation } from '@/types/directus-collections';
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
  tempMetadata?: Record<LanguageOption, { title?: string | null; permalink?: string | null }>;
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

/**
 * Normalize permalink with these rules:
 * - Empty/null → "/"
 * - "/" → "/"
 * - "/..." → "/..." (keep as-is)
 * - "text" → "/text" (add slash prefix)
 * - Lowercase and format the slug part
 */
const normalizePermalink = (value: string | null | undefined): string => {
  if (!value || value.trim() === '') {
    return '/';
  }

  let normalized = value.trim();

  // If it's just "/", return as-is
  if (normalized === '/') {
    return '/';
  }

  // If doesn't start with "/", add it
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Format the slug part (everything after first "/")
  const slashIndex = normalized.indexOf('/');
  const slug = normalized.substring(slashIndex + 1); // everything after "/"

  if (slug === '') {
    return '/'; // "//" → "/"
  }

  // Format slug: lowercase, spaces to hyphen, remove invalid chars, collapse special chars
  const formattedSlug = slug
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to hyphen
    .replace(/[^a-z0-9\-_/]/g, '') // remove invalid chars but keep hyphen underscore slash
    .replace(/\/+/g, '/') // collapse multiple slashes
    .replace(/-+/g, '-') // collapse hyphen
    .replace(/^-+|-+$/g, ''); // trim hyphen edges

  if (formattedSlug === '') {
    return '/'; // no valid slug left
  }

  return '/' + formattedSlug;
};



function getTranslationState(
  translations: PageTranslation[] | undefined,
  lang: LanguageOption,
  tempOverride?: { title?: string | null; permalink?: string | null }
): MetadataState {
  const translation = translations?.find(
    (t) => extractLanguageCode(t.languages_code) === lang
  );

  // Use temp metadata if available, otherwise use original translation
  if (tempOverride && (tempOverride.title !== undefined || tempOverride.permalink !== undefined)) {
    return {
      id: translation?.id,
      title: tempOverride.title !== undefined ? (tempOverride.title || '') : (translation?.title || ''),
      permalink: tempOverride.permalink !== undefined
        ? (tempOverride.permalink?.replace(/^\/+/, '') || '')
        : (translation?.permalink?.replace(/^\/+/, '') || ''),
    };
  }

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
  tempMetadata,
  onApply,
}: PageMetadataDialogProps) {
  const originalTranslations = (page as Page | undefined)?.translations;
  const [activeLang, setActiveLang] = useState<LanguageOption>(defaultLanguage);

  // Create session-only translations if original is empty
  const getSessionTranslations = useCallback((original: PageTranslation[] | undefined, temp?: Record<LanguageOption, { title?: string | null; permalink?: string | null }>): Record<LanguageOption, MetadataState & { isSessionOnly: boolean }> => {
    if (!original || original.length === 0) {
      console.log('[PageMetadataDialog] Original translations empty, creating session-only records');
      return {
        'en-US': { ...getTranslationState(original, 'en-US', temp?.['en-US']), isSessionOnly: true },
        'vi-VN': { ...getTranslationState(original, 'vi-VN', temp?.['vi-VN']), isSessionOnly: true },
      };
    }

    // If partial (only one language), create session-only for missing one
    const result: Record<LanguageOption, MetadataState & { isSessionOnly: boolean }> = {
      'en-US': { ...getTranslationState(original, 'en-US', temp?.['en-US']), isSessionOnly: false },
      'vi-VN': { ...getTranslationState(original, 'vi-VN', temp?.['vi-VN']), isSessionOnly: false },
    };

    // Mark missing languages as session-only
    if (!original.find(t => extractLanguageCode(t.languages_code) === 'en-US')) {
      result['en-US'] = { ...getTranslationState(original, 'en-US', temp?.['en-US']), isSessionOnly: true };
    }
    if (!original.find(t => extractLanguageCode(t.languages_code) === 'vi-VN')) {
      result['vi-VN'] = { ...getTranslationState(original, 'vi-VN', temp?.['vi-VN']), isSessionOnly: true };
    }

    return result;
  }, []);

  const [metadata, setMetadata] = useState<Record<LanguageOption, MetadataState & { isSessionOnly: boolean }>>(() =>
    getSessionTranslations(originalTranslations, tempMetadata)
  );
  const [slugErrors, setSlugErrors] = useState<Record<LanguageOption, string | null>>({
    'en-US': null,
    'vi-VN': null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveLang(defaultLanguage);
      setMetadata(getSessionTranslations(originalTranslations, tempMetadata));
      setSlugErrors({
        'en-US': null,
        'vi-VN': null,
      });
      console.log('[PageMetadataDialog] Dialog opened, metadata initialized:', getSessionTranslations(originalTranslations, tempMetadata));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageId]);

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

    // Apply all language metadata when user clicks Apply
    if (onApply) {
      LANGUAGE_OPTIONS.forEach((lang) => {
        const langMetadata = metadata[lang];
        const normalizedPermalink = normalizePermalink(langMetadata.permalink || '');

        const entry: {
          id?: number;
          languages_code: LanguageOption;
          title?: string | null;
          permalink?: string | null;
          isSessionOnly?: boolean;
        } = {
          languages_code: lang,
          title: langMetadata.title || null,
          permalink: normalizedPermalink,
          isSessionOnly: langMetadata.isSessionOnly,
        };

        if (!langMetadata.isSessionOnly && langMetadata.id) {
          entry.id = langMetadata.id;
        } else if (langMetadata.isSessionOnly) {
          entry.id = 0;
        }

        console.log('[PageMetadataDialog] Applying metadata for', lang, ':', entry);
        onApply(entry);
      });
    }

    toast.success('Changes applied');
    setIsSaving(false);
    onClose();
  }, [onClose, onApply, metadata]);

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
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeLang === lang
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
                Full URL: {normalizePermalink(activeState.permalink || '')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Close
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
                Applying...
              </>
            ) : (
              <>
                <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


