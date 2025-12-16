'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesApi } from '../api';
import type { ApiResponse } from '../api';

// Query keys
export const pageKeys = {
  all: ['pages'] as const,
  lists: () => [...pageKeys.all, 'list'] as const,
  list: (siteId: number, params?: { page?: number; limit?: number; sort?: string; search?: string }) =>
    [...pageKeys.lists(), siteId, params] as const,
  details: () => [...pageKeys.all, 'detail'] as const,
  detail: (id: string) => [...pageKeys.details(), id] as const,
};

// Get pages by site hook
export function usePagesBySite(params: {
  siteId: number;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}) {
  const { siteId, page = 1, limit = 10, sort = '-date_created', search } = params;

  return useQuery({
    queryKey: pageKeys.list(siteId, { page, limit, sort, search }),
    queryFn: async () => {
      // Note: getPagesBySite doesn't support pagination yet, so we use directusHelpers directly
      // This will be refactored later to support pagination
      const result = await pagesApi.getPagesBySite(siteId);
      if (result.success && Array.isArray(result.data)) {
        // For now, return all pages (no pagination)
        return {
          items: result.data,
          pagination: {
            page: 1,
            limit: result.data.length,
            totalCount: result.data.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      return { items: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
    },
    enabled: !!siteId,
  });
}

// Get single page hook
export function usePage(pageId: string) {
  return useQuery({
    queryKey: pageKeys.detail(pageId),
    queryFn: async () => {
      const result = await pagesApi.getPage(pageId);
      return result.success ? result.data : null;
    },
    enabled: !!pageId,
  });
}

// Create page mutation
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      site_id: number;
      sort?: number;
      translations?: {
        create: Array<{
          languages_code: { code: string };
          title?: string;
          permalink?: string
        }>
      }
    }) => {
      const result = await pagesApi.createPage(payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create page');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate pages list for the site
      queryClient.invalidateQueries({
        queryKey: pageKeys.list(variables.site_id),
      });
    },
  });
}

// Update page mutation
export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, payload }: { pageId: string; payload: Record<string, unknown> }) => {
      const result = await pagesApi.updatePage(pageId, payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update page');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate page detail and list
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(variables.pageId) });
    },
  });
}

// Update page blocks mutation
export function useUpdatePageBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      payload
    }: {
      pageId: string;
      payload: {
        blocks: { create: any[]; update: any[]; delete: string[] };
        event_id?: number
      }
    }) => {
      const result = await pagesApi.updatePageBlocks(pageId, payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update page blocks');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate page detail
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(variables.pageId) });
      queryClient.invalidateQueries({ queryKey: ['page-detail', variables.pageId] });
    },
  });
}

// Export page builder hooks
export { usePageBuilderBlocks } from './usePageBuilderBlocks';
export { usePageBuilderNavigation } from './usePageBuilderNavigation';
export { usePageBuilderKeyboard } from './usePageBuilderKeyboard';
export { usePageBuilderUnsavedChanges } from './usePageBuilderUnsavedChanges';
export { usePageBuilderSave } from './usePageBuilderSave';
export { usePageData, usePageNavigations } from './usePageData';
export { usePageSiteNavigation } from './usePageSiteNavigation';
export { usePageSite } from './usePageSite';
export { usePagePayloadManager } from './usePagePayloadManager';

