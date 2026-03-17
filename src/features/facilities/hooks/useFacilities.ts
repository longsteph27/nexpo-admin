import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi } from '../api';
import type { Facility, FacilityListOptions } from '../types';

export function useFacilities(eventId: number, options: FacilityListOptions = {}) {
  return useQuery({
    queryKey: ['facilities', eventId, options],
    queryFn: () => facilitiesApi.getFacilities(eventId, options),
    enabled: !!eventId,
  });
}

export function useFacility(id: string) {
  return useQuery({
    queryKey: ['facility', id],
    queryFn: () => facilitiesApi.getFacility(id),
    enabled: !!id,
  });
}

export function useFacilityCategories(eventId: number) {
  return useQuery({
    queryKey: ['facility_categories', eventId],
    queryFn: () => facilitiesApi.getCategories(eventId),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Partial<Facility>, 'id'>) => facilitiesApi.createFacility(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Facility> }) =>
      facilitiesApi.updateFacility(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facilities'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facilitiesApi.deleteFacility(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }),
  });
}

export function useDeleteFacilities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => facilitiesApi.deleteFacilities(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facilities'] }),
  });
}
