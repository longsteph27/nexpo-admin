'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface NavigationCardProps {
  site: any;
}

export default function NavigationCard({ site }: NavigationCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Navigation</h2>
        <p className="text-xs text-content-tertiary">Site navigation menu items</p>
      </div>
      <div className="p-6">
        {site.navigation && site.navigation.length > 0 ? (
          <div className="space-y-3">
            {site.navigation.map((nav: any, index: number) => (
              <div key={nav.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon icon="lucide:menu" className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {nav.translations?.[0]?.title || 'Untitled Navigation'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      Type: {nav.type || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    nav.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {nav.status || 'draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:menu" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No navigation items</p>
            <p className="text-xs text-content-tertiary">Add navigation items to create a menu</p>
          </div>
        )}
      </div>
    </section>
  );
}
