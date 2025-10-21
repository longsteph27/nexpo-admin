'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface LanguagesCardProps {
  site: any;
}

export default function LanguagesCard({ site }: LanguagesCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Languages</h2>
        <p className="text-xs text-content-tertiary">Supported languages for your site</p>
      </div>
      <div className="p-6">
        {site.languages && site.languages.length > 0 ? (
          <div className="space-y-3">
            {site.languages.map((language: any, index: number) => (
              <div key={language.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon icon="lucide:globe" className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {language.name || 'Unknown Language'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      Code: {language.code || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    language.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {language.status || 'draft'}
                  </span>
                </div>
              </div>
            ))}
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
