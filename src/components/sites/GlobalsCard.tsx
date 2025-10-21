'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface GlobalsCardProps {
  site: any;
}

export default function GlobalsCard({ site }: GlobalsCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Global Settings</h2>
        <p className="text-xs text-content-tertiary">Global configuration and settings</p>
      </div>
      <div className="p-6">
        {site.globals && site.globals.length > 0 ? (
          <div className="space-y-3">
            {site.globals.map((global: any, index: number) => (
              <div key={global.id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon icon="lucide:settings" className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-content-primary">
                        {global.title || 'Global Settings'}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        {global.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-content-primary">
                      Global
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:settings" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No global settings</p>
            <p className="text-xs text-content-tertiary">Configure global settings for your site</p>
          </div>
        )}
      </div>
    </section>
  );
}
