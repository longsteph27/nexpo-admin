import { useQuery } from '@tanstack/react-query';
import { directusHelpers } from '@/lib/directus';
import type {
  PaginatedPagesResponse,
  PaginatedSitesResponse,
  PaginationMeta,
  SiteListItem,
  SitePageListItem,
} from '../types';

const createEmptyPagination = (page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

const normalizeSitesResponse = (
  data: unknown,
  page: number,
  limit: number,
): PaginatedSitesResponse => {
  if (Array.isArray(data)) {
    return {
      sites: data as SiteListItem[],
      pagination: createEmptyPagination(page, limit),
    };
  }

  if (data && typeof data === 'object') {
    const sitesValue = (data as { sites?: unknown }).sites;
    const sites: SiteListItem[] = Array.isArray(sitesValue)
      ? (sitesValue as SiteListItem[])
      : [];

    const paginationValue = (data as { pagination?: PaginationMeta }).pagination;
    const pagination: PaginationMeta = paginationValue ?? createEmptyPagination(page, limit);

    return { sites, pagination };
  }

  return {
    sites: [],
    pagination: createEmptyPagination(page, limit),
  };
};

const normalizePagesResponse = (
  data: unknown,
  page: number,
  limit: number,
): PaginatedPagesResponse<SitePageListItem> => {
  if (Array.isArray(data)) {
    return {
      pages: data as SitePageListItem[],
      pagination: createEmptyPagination(page, limit),
    };
  }

  if (data && typeof data === 'object') {
    const pagesValue = (data as { pages?: unknown }).pages;
    const pages: SitePageListItem[] = Array.isArray(pagesValue)
      ? (pagesValue as SitePageListItem[])
      : [];

    const paginationValue = (data as { pagination?: PaginationMeta }).pagination;
    const pagination: PaginationMeta = paginationValue ?? createEmptyPagination(page, limit);

    return { pages, pagination };
  }

  return {
    pages: [],
    pagination: createEmptyPagination(page, limit),
  };
};

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
    queryFn: async (): Promise<PaginatedSitesResponse> => {
      const res = await directusHelpers.getSitesByEvent(eventId, tenantId, {
        page,
        limit,
        sort,
        search,
      });

      if (res.success) {
        return normalizeSitesResponse(res.data, page, limit);
      }

      return {
        sites: [],
        pagination: createEmptyPagination(page, limit),
      };
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
    queryFn: async (): Promise<PaginatedPagesResponse<SitePageListItem>> => {
      const res = await directusHelpers.getPagesBySite(siteId, { page, limit, sort, search });

      if (res.success) {
        return normalizePagesResponse(res.data, page, limit);
      }

      return {
        pages: [],
        pagination: createEmptyPagination(page, limit),
      };
    },
    enabled: !!siteId,
  });
}
