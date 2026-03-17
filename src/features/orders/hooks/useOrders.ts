import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api';
import type { FacilityOrder, OrderItem, OrderListOptions } from '../types';

export function useOrders(eventId: number, options: OrderListOptions = {}) {
  return useQuery({
    queryKey: ['orders', eventId, options],
    queryFn: () => ordersApi.getOrders(eventId, options),
    enabled: !!eventId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FacilityOrder> }) =>
      ordersApi.updateOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useBulkUpdateOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Partial<FacilityOrder> }) =>
      ordersApi.bulkUpdateOrders(ids, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrderItem> }) =>
      ordersApi.updateOrderItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}
