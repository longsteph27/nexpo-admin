'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi } from '@/features/pages/api';
import type { LanguageCode } from '@/types/directus-collections';
import type { FeatureSite, SitePageSummary, SitePageTranslationSummary } from '../../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PagesCardProps {
  site?: FeatureSite | null;
  eventId: string;
}

export default function PagesCard({ site, eventId }: PagesCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copiedPermalink, setCopiedPermalink] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const pages: SitePageSummary[] = site?.pages ?? [];

  const handleAddPage = () => {
    router.push(`/events/${eventId}/pages/create`);
  };

  const handlePageClick = (pageId: string) => {
    router.push(`/events/${eventId}/pages/${pageId}`);
  };

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => pagesApi.deletePage(pageId),
    onSuccess: () => {
      if (site?.id) {
        queryClient.invalidateQueries({ queryKey: ['site', String(site.id)] });
      }
      toast.success('Page deleted successfully');
      setPageToDelete(null);
      setIsDeleting(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete page');
      setIsDeleting(false);
    },
  });

  const handleDeleteClick = (pageId: string, pageTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPageToDelete({ id: pageId, title: pageTitle });
  };

  const handleConfirmDelete = () => {
    if (pageToDelete) {
      setIsDeleting(true);
      deletePageMutation.mutate(pageToDelete.id);
    }
  };

  const localeMap = useMemo(
    () => ({
      en: 'en-US' as LanguageCode,
      vi: 'vi-VN' as LanguageCode,
    }),
    []
  );

  const resolveTranslationCode = (
    value: SitePageTranslationSummary['languages_code']
  ): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object' && 'code' in value) {
      const codeValue = (value as { code?: string | null }).code;
      return typeof codeValue === 'string' ? codeValue : '';
    }
    return '';
  };

  const getPermalink = (page: SitePageSummary, language: 'en' | 'vi' = 'en') => {
    const targetCode = localeMap[language];
    const translation = page.translations?.find(
      (t: SitePageTranslationSummary) =>
        resolveTranslationCode(t.languages_code) === targetCode
    );
    return translation?.permalink || '';
  };

  const getFullUrl = (page: SitePageSummary, language: 'en' | 'vi' = 'en') => {
    if (!site?.slug) return '';

    const permalink = getPermalink(page, language);
    if (!permalink) return '';

    return `https://nxp-public-ruby.vercel.app/${site.slug}/${language}/${permalink}`;
  };

  const copyPermalink = async (
    page: SitePageSummary,
    language: 'en' | 'vi' = 'en',
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const fullUrl = getFullUrl(page, language);
    if (!fullUrl) {
      toast.error('Permalink not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedPermalink(`${page.id}-${language}`);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopiedPermalink(null), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <section className="bg-white rounded-xl border-2 border-blue-200 shadow-lg ring-1 ring-blue-100">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon icon="lucide:file-text" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary">Pages</h2>
              <p className="text-sm text-content-secondary">Manage your site pages and content</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAddPage}
          >
            <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>
      <div className="p-6">
        {pages.length > 0 ? (
          <div className="space-y-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="group border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => handlePageClick(page.id)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                      <Icon icon="lucide:file-text" className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-content-primary truncate">
                        {page.translations?.[0]?.title || 'Untitled Page'}
                      </p>
                      <p className="text-xs text-content-tertiary">
                        Sort: {page.sort || 0} • Slug: {page.slug || 'no-slug'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${page.status === 'published' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-content-primary'
                      }`}>
                      {page.status || 'draft'}
                    </span>

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(page.id, page.translations?.[0]?.title || 'Untitled Page', e)}
                      title="Delete Page"
                    >
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </Button>

                    <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Permalink Section */}
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-content-secondary mb-2">Permalinks:</p>
                      <div className="flex flex-wrap gap-2">
                        {/* English Permalink */}
                        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md px-3 py-2 min-w-0 flex-1">
                          <span className="text-xs font-medium text-blue-600 whitespace-nowrap">EN:</span>
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {getPermalink(page, 'en') || 'no-permalink'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            onClick={(e) => copyPermalink(page, 'en', e)}
                          >
                            <Icon
                              icon={copiedPermalink === `${page.id}-en` ? "lucide:check" : "lucide:copy"}
                              className="w-3 h-3 text-gray-500 hover:text-blue-600"
                            />
                          </Button>
                        </div>

                        {/* Vietnamese Permalink */}
                        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md px-3 py-2 min-w-0 flex-1">
                          <span className="text-xs font-medium text-blue-600 whitespace-nowrap">VI:</span>
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {getPermalink(page, 'vi') || 'no-permalink'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            onClick={(e) => copyPermalink(page, 'vi', e)}
                          >
                            <Icon
                              icon={copiedPermalink === `${page.id}-vi` ? "lucide:check" : "lucide:copy"}
                              className="w-3 h-3 text-gray-500 hover:text-blue-600"
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Icon icon="lucide:file-text" className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">No pages created yet</h3>
            <p className="text-sm text-content-secondary mb-6 max-w-md mx-auto">
              Create pages to build your site content. Each page will have its own permalink for easy sharing.
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddPage}
            >
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Create First Page
            </Button>
          </div>
        )}
      </div>
      <Dialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the page "{pageToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
