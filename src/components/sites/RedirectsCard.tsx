'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface RedirectsCardProps {
  site: any;
}

export default function RedirectsCard({ site }: RedirectsCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Redirects</h2>
        <p className="text-xs text-content-tertiary">URL redirects and aliases</p>
      </div>
      <div className="p-6">
        {site.redirects && site.redirects.length > 0 ? (
          <div className="space-y-3">
            {site.redirects.map((redirect: any, index: number) => (
              <div key={redirect.id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon icon="lucide:arrow-right" className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-content-primary">
                        {redirect.url_old || 'No old URL'}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        → {redirect.url_new || 'No new URL'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {redirect.response_code || '301'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:arrow-right" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No redirects configured</p>
            <p className="text-xs text-content-tertiary">Add redirects to handle URL changes</p>
          </div>
        )}
      </div>
    </section>
  );
}
