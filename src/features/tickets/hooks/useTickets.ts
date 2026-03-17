import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api';
import type { SupportTicket, TicketListOptions } from '../types';

export function useTickets(eventId: number, options: TicketListOptions = {}) {
  return useQuery({
    queryKey: ['tickets', eventId, options],
    queryFn: () => ticketsApi.getTickets(eventId, options),
    enabled: !!eventId,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicket(id),
    enabled: !!id,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SupportTicket> }) =>
      ticketsApi.updateTicket(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
  });
}

export function useBulkUpdateTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: Partial<SupportTicket> }) =>
      ticketsApi.bulkUpdateTickets(ids, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useBulkDeleteTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => ticketsApi.bulkDeleteTickets(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useAddReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      ticketsApi.addReply(ticketId, message),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
