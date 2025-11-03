'use client';

import { useQuery } from '@tanstack/react-query';
import { directusHelpers } from '@/lib/directus';

export function useRegistrations(params: {
  eventId: number;
  page: number;
  limit: number;
  sort: string;
  search?: string;
}) {
  const { eventId, page, limit, sort, search } = params;

  return useQuery({
    queryKey: ['registrations', eventId, page, search, sort],
    queryFn: async () => {
      const result = await directusHelpers.getRegistrationsByEvent(eventId, {
        page,
        limit,
        sort,
        search,
      });
      return result.success
        ? result.data
        : { registrations: [], pagination: { page: 1, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
    },
    enabled: !!eventId,
  });
}

export function useRegistrationCounts(params: {
  eventId: number;
  search?: string;
}) {
  const { eventId, search } = params;

  const checkedInQuery = useQuery({
    queryKey: ['registrations-count-checkedin', eventId, search],
    queryFn: async () => {
      const res = await directusHelpers.countRegistrationsByEvent(eventId, {
        status: 'checkedIn',
        search,
      });
      return res.success ? (res.data as number) : 0;
    },
    enabled: !!eventId,
  });

  const pendingQuery = useQuery({
    queryKey: ['registrations-count-pending', eventId, search],
    queryFn: async () => {
      const res = await directusHelpers.countRegistrationsByEvent(eventId, {
        status: 'pending',
        search,
      });
      return res.success ? (res.data as number) : 0;
    },
    enabled: !!eventId,
  });

  return {
    checkedInCount: checkedInQuery.data ?? 0,
    pendingCount: pendingQuery.data ?? 0,
    isLoading: checkedInQuery.isLoading || pendingQuery.isLoading,
    isError: checkedInQuery.isError || pendingQuery.isError,
  };
}


