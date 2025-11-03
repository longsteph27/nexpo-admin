'use client';

import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '../api';
import { navigationApi } from '@/lib/api';

// Fetch page data hook
export function usePageData(pageId: string) {
  return useQuery({
    queryKey: ['page-detail', pageId],
    queryFn: async () => {
      const result = await pagesApi.getPage(pageId);
      return result.data || null;
    },
    enabled: !!pageId,
  });
}

// Fetch page navigations hook
export function usePageNavigations(siteId: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['navigations', siteId],
    queryFn: async () => {
      const result = await navigationApi.getNavigations(Number(siteId));
      return result.data;
    },
    enabled: enabled && !!siteId,
  });
}


