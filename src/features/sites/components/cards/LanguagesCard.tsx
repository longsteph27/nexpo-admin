'use client';

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { FeatureSite, SiteLanguageLink } from '../../types';
import { SITE_LANGUAGE_CODES } from '../../types';

interface LanguagesCardProps {
  site?: FeatureSite | null;
}

const resolveLanguageCode = (language: SiteLanguageLink): string => {
  if (language.languages_id?.code) {
    return language.languages_id.code;
  }

  if (typeof language.languages_code === 'string') {
    return language.languages_code;
  }

  return 'unknown';
};

const resolveLanguageLabel = (language: SiteLanguageLink): string => {
  if (language.languages_id?.name) {
    return language.languages_id.name;
  }

  const code = resolveLanguageCode(language);
  switch (code) {
    case 'en-US':
      return 'English';
    case 'vi-VN':
      return 'Tiếng Việt';
    default:
      return code && code !== 'unknown' ? code : 'Unknown Language';
  }
};

const resolveDirectionLabel = (language: SiteLanguageLink): string => {
  const direction = language.languages_id?.direction;
  if (direction === 'rtl') return 'Right to Left';
  if (direction === 'ltr') return 'Left to Right';
  return 'Left to Right';
};

export default function LanguagesCard({ site }: LanguagesCardProps) {
  const languages: SiteLanguageLink[] = site?.languages ?? [];

  const orderedLanguages = useMemo(() => {
    if (languages.length === 0) return [] as SiteLanguageLink[];

    const getOrder = (language: SiteLanguageLink) => {
      const code = resolveLanguageCode(language);
      const index = SITE_LANGUAGE_CODES.indexOf(code as typeof SITE_LANGUAGE_CODES[number]);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return [...languages].sort((a, b) => getOrder(a) - getOrder(b));
  }, [languages]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Languages</h2>
        <p className="text-xs text-content-tertiary">Supported languages for your site</p>
      </div>
      <div className="p-6">
        {orderedLanguages.length > 0 ? (
          <div className="space-y-3">
            {orderedLanguages.map((language) => {
              const code = resolveLanguageCode(language);
              const label = resolveLanguageLabel(language);
              return (
                <div key={language.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon icon="lucide:globe" className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-content-primary">
                        {label}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        Code: {code || 'N/A'}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        Direction: {resolveDirectionLabel(language)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:globe" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No languages configured</p>
            <p className="text-xs text-content-tertiary">Add languages to support multiple locales</p>
          </div>
        )}
      </div>
    </section>
  );
}
