'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface CategoriesCardProps {
  site: any;
}

export default function CategoriesCard({ site }: CategoriesCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Categories</h2>
        <p className="text-xs text-content-tertiary">Content categories for organization</p>
      </div>
      <div className="p-6">
        {site.categories && site.categories.length > 0 ? (
          <div className="space-y-3">
            {site.categories.map((category: any, index: number) => (
              <div key={category.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {category.translations?.[0]?.title || 'Untitled Category'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      Sort: {category.sort || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:folder" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No categories created</p>
            <p className="text-xs text-content-tertiary">Create categories to organize your content</p>
          </div>
        )}
      </div>
    </section>
  );
}
