'use client';

import { useQuery } from '@tanstack/react-query';
import { directusHelpers } from '@/lib/directus';

export function useSitesByEvent(params: {
  eventId: number;
  tenantId: number;
  page: number;
  limit: number;
  sort?: string;
  search?: string;
}) {
  const { eventId, tenantId, page, limit, sort = '-date_updated', search } = params;

  return useQuery({
    queryKey: ['sites-list', { eventId, tenantId, page, limit, sort, search }],
    queryFn: async () => {
      const res = await directusHelpers.getSitesByEvent(eventId, tenantId, { page, limit, sort, search });
      if (res.success) return res.data;
      return { sites: [], pagination: { page, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
    },
    enabled: !!eventId && !!tenantId,
  });
}

export function usePagesBySite(params: {
  siteId: number;
  page: number;
  limit: number;
  sort?: string;
  search?: string;
}) {
  const { siteId, page, limit, sort = '-date_updated', search } = params;

  return useQuery({
    queryKey: ['site-pages', { siteId, page, limit, sort, search }],
    queryFn: async () => {
      const res = await directusHelpers.getPagesBySite(siteId, { page, limit, sort, search });
      if (res.success) return res.data;
      return { pages: [], pagination: { page, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
    },
    enabled: !!siteId,
  });
}



