'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useOrder, useUpdateOrder, useUpdateOrderItem } from '../hooks/useOrders';
import type { OrderStatus } from '../types';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

const STATUS_MAP: Record<OrderStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-500' },
  submitted: { label: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
};

function formatCurrency(n?: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'medium' });
}

function getExhibitorName(exhibitor: { translations?: { languages_code?: string; name?: string }[] } | undefined): string {
  const translations = exhibitor?.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  return en?.name || translations[0]?.name || 'Unknown';
}

export function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const orderId = params.orderId as string;

  const { data: order, isLoading, error, refetch } = useOrder(orderId);
  const updateOrder = useUpdateOrder();
  const updateItem = useUpdateOrderItem();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Icon icon="lucide:alert-circle" className="w-10 h-10 text-red-400 mb-3" />
        <p className="font-medium">Order not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/events/${eventId}/orders`)}>
          <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5 mr-1.5" />Back
        </Button>
      </div>
    );
  }

  const { label: sLabel, cls: sCls } = STATUS_MAP[order.status] ?? { label: order.status, cls: '' };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    await updateOrder.mutateAsync({ id: order.id, payload: { status: newStatus } });
    await refetch();
  };

  const handleToggleDone = async (itemId: string, currentDone: boolean) => {
    await updateItem.mutateAsync({ id: itemId, payload: { done: !currentDone } });
    await refetch();
  };

  const items = order.items ?? [];

  return (
    <div className="space-y-4">
      <ContainerHeader className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push(`/events/${eventId}/orders`)} className="p-1.5 hover:bg-slate-100 rounded-lg mt-0.5">
            <Icon icon="lucide:arrow-left" className="w-4 h-4 text-content-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-content-primary">
                {order.ref_number ? `Order #${order.ref_number}` : 'Order Detail'}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sCls}`}>{sLabel}</span>
            </div>
            <p className="text-sm text-content-tertiary mt-0.5">
              {getExhibitorName(order.exhibitor_id)} · {formatDate(order.date_created)}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2 flex-wrap">
          {order.status === 'submitted' && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('cancelled')} className="text-red-600 border-red-200 hover:bg-red-50">
                Cancel
              </Button>
              <Button size="sm" variant="gradient" onClick={() => handleStatusChange('confirmed')}>
                <Icon icon="lucide:check" className="w-3.5 h-3.5 mr-1" />Confirm Order
              </Button>
            </>
          )}
          {order.status === 'confirmed' && (
            <Button size="sm" variant="gradient" onClick={() => handleStatusChange('completed')}>
              <Icon icon="lucide:package-check" className="w-3.5 h-3.5 mr-1" />Mark Completed
            </Button>
          )}
        </div>
      </ContainerHeader>

      <Container className="space-y-6">
        {/* Order summary */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-content-primary">{formatCurrency(order.total_amount)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Items</p>
            <p className="text-2xl font-bold text-content-primary">{items.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{items.filter((i) => i.done).length}/{items.length}</p>
          </div>
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Note from Exhibitor</p>
            <p className="text-sm text-amber-800">{order.notes}</p>
          </div>
        )}

        <hr className="border-slate-100" />

        {/* Order items */}
        <div>
          <h2 className="font-semibold text-content-primary mb-3">Order Items</h2>
          {items.length === 0 ? (
            <p className="text-content-tertiary text-sm">No items.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const facility = typeof item.facility_id === 'object' ? item.facility_id : null;
                const imageUrl = facility?.image
                  ? `${DIRECTUS_URL}/assets/${typeof facility.image === 'object' ? (facility.image as { id: string }).id : facility.image}`
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                      item.done ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt={facility?.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Icon icon="lucide:package" className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-content-primary text-sm">{facility?.name ?? '—'}</p>
                      {facility?.dimension && (
                        <p className="text-xs text-content-tertiary">{facility.dimension}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-content-primary">x{item.quantity}</p>
                      {item.unit_price != null && (
                        <p className="text-xs text-content-tertiary">{formatCurrency(item.unit_price)} each</p>
                      )}
                    </div>
                    {/* Done toggle */}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleToggleDone(item.id, !!item.done)}
                        className={`ml-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.done
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {item.done && <Icon icon="lucide:check" className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
