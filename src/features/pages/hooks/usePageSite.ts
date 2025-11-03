'use client';

import { useQuery } from '@tanstack/react-query';
import { siteApi } from '@/lib/api';

interface UsePageSiteProps {
  siteId: number | undefined;
  enabled?: boolean;
}

export function usePageSite({ siteId, enabled = true }: UsePageSiteProps) {
  return useQuery({
    queryKey: ['page-site', siteId],
    queryFn: async () => {
      if (!siteId) return null;
      
      const result = await siteApi.getSite(Number(siteId));
      
      if (!result.success || !result.data) {
        return null;
      }
      
      return result.data;
    },
    enabled: enabled && !!siteId,
  });
}

