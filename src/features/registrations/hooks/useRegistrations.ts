import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../api';
import type { RegistrationsResponse } from '../types';

interface UseRegistrationsParams {
  eventId: number;
  page: number;
  limit: number;
  sort: string;
  search?: string;
}

export function useRegistrations({ eventId, page, limit, sort, search }: UseRegistrationsParams) {
  return useQuery({
    queryKey: ['registrations', eventId, page, search, sort],
    queryFn: async () => {
      const result = await registrationsApi.getRegistrations(eventId, {
        page,
        limit,
        sort,
        search,
      });

      if (!result.success) {
        return {
          registrations: [],
          pagination: {
            page: 1,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        } satisfies RegistrationsResponse;
      }

      return result.data as RegistrationsResponse;
    },
    enabled: !!eventId,
  });
}

interface UseRegistrationCountsParams {
  eventId: number;
  search?: string;
}

export function useRegistrationCounts({ eventId, search }: UseRegistrationCountsParams) {
  const checkedInQuery = useQuery({
    queryKey: ['registrations-count-checkedin', eventId, search],
    queryFn: async () => {
      const res = await registrationsApi.countRegistrations(eventId, {
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
      const res = await registrationsApi.countRegistrations(eventId, {
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


