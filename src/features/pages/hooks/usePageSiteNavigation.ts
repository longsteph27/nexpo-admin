'use client';

import { useQuery } from '@tanstack/react-query';
import { navigationApi } from '@/lib/api';

interface Navigation {
  id: string | number;
  type: 'header' | 'footer';
  site: number; // Changed from site_id to site according to schema
  items?: any[];
}

interface UsePageSiteNavigationProps {
  siteId: number | undefined;
  enabled?: boolean;
}

export function usePageSiteNavigation({ siteId, enabled = true }: UsePageSiteNavigationProps) {
  return useQuery({
    queryKey: ['site-navigation', siteId],
    queryFn: async () => {
      if (!siteId) return null;
      
      const result = await navigationApi.getNavigations(Number(siteId));
      
      if (!result.success || !result.data) {
        return { header: null, footer: null };
      }
      
      const navigations = result.data as Navigation[];
      const header = navigations.find((nav: Navigation) => nav.type === 'header') || null;
      const footer = navigations.find((nav: Navigation) => nav.type === 'footer') || null;
      
      return { header, footer };
    },
    enabled: enabled && !!siteId,
  });
}

