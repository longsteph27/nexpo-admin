'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { useRouter } from 'next/navigation';

interface PagesCardProps {
  site: any;
  eventId: string;
  siteId: string;
}

export default function PagesCard({ site, eventId, siteId }: PagesCardProps) {
  const router = useRouter();

  const handleAddPage = () => {
    router.push(`/events/${eventId}/sites/${siteId}/pages/new`);
  };

  const handlePageClick = (pageId: string) => {
    router.push(`/events/${eventId}/sites/${siteId}/pages/${pageId}`);
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-content-primary">Pages</h2>
            <p className="text-xs text-content-tertiary">Site pages and content</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddPage}
          >
            <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>
      <div className="p-6">
        {site.pages && site.pages.length > 0 ? (
          <div className="space-y-3">
            {site.pages.map((page: any, index: number) => (
              <div 
                key={page.id || index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handlePageClick(page.id)}
              >
                <div className="flex items-center space-x-3">
                  <Icon icon="lucide:file-text" className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {page.translations?.[0]?.title || 'Untitled Page'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      Sort: {page.sort || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    page.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {page.status || 'draft'}
                  </span>
                  <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:file-text" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No pages created</p>
            <p className="text-xs text-content-tertiary mb-4">Create pages to build your site content</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddPage}
            >
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Add First Page
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
