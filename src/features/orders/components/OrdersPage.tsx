'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useOrders, useBulkUpdateOrders } from '../hooks/useOrders';
import { useBoothMap } from '@/features/exhibitors/hooks/useExhibitors';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from 'sonner';
import type { FacilityOrderWithDetails, OrderStatus } from '../types';

const STATUS_MAP: Record<OrderStatus, { label: string; cls: string; nextStatus?: OrderStatus; nextLabel?: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-500' },
  submitted: { label: 'Submitted', cls: 'bg-blue-100 text-blue-700', nextStatus: 'confirmed', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', cls: 'bg-yellow-100 text-yellow-700', nextStatus: 'completed', nextLabel: 'Complete' },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
};

const STATUS_FILTERS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function getExhibitorName(order: FacilityOrderWithDetails): string {
  const translations = order.exhibitor_id?.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  return en?.company_name || translations[0]?.company_name || 'Unknown';
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

function formatCurrency(n?: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function OrderRow({ order, eventId, idx, boothMap, selected, onToggle }: { order: FacilityOrderWithDetails; eventId: string | string[]; idx: number; boothMap: Record<string, string>; selected: boolean; onToggle: () => void }) {
  const router = useRouter();
  const { label, cls } = STATUS_MAP[order.status] ?? { label: order.status, cls: '' };
  const itemCount = order.items?.length ?? 0;
  const exhibitorId = typeof order.exhibitor_id === 'object' ? order.exhibitor_id?.id : order.exhibitor_id;
  const booth = exhibitorId ? boothMap[exhibitorId] : undefined;
  return (
    <motion.tr
      key={order.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
      onClick={() => router.push(`/events/${eventId}/orders/${order.id}`)}
    >
      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <input type="checkbox" checked={selected} onChange={onToggle} onClick={(e) => e.stopPropagation()} className="rounded border-slate-300 accent-blue-600" />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-content-primary">{order.ref_number || '—'}</td>
      <td className="px-4 py-3 text-content-primary">{getExhibitorName(order)}</td>
      <td className="px-4 py-3">
        {booth
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono font-medium text-content-primary">{booth}</span>
          : <span className="text-content-tertiary text-xs">—</span>
        }
      </td>
      <td className="px-4 py-3 text-content-secondary">{itemCount} item{itemCount !== 1 ? 's' : ''}</td>
      <td className="px-4 py-3 font-medium text-content-primary">{formatCurrency(order.total_amount)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
      </td>
      <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(order.date_created)}</td>
      <td className="px-4 py-3">
        <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary ml-auto" />
      </td>
    </motion.tr>
  );
}

function TableHead({ ids, isAllSelected, isIndeterminate, toggleAll }: { ids: string[]; isAllSelected: boolean; isIndeterminate: boolean; toggleAll: (ids: string[]) => void }) {
  return (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        <th className="px-4 py-3 w-8">
          <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={() => toggleAll(ids)} className="rounded border-slate-300 accent-blue-600" />
        </th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Ref</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Booth</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Items</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Total</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  );
}

export function OrdersPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('submitted');
  const [page, setPage] = useState(1);
  const [groupByExhibitor, setGroupByExhibitor] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: boothMapData } = useBoothMap(eventId);
  const boothMap = boothMapData ?? {};
  const bulkUpdate = useBulkUpdateOrders();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const { data, isLoading, error } = useOrders(eventId, {
    page,
    limit: groupByExhibitor ? 100 : 20,
    status: statusFilter,
    search: search || undefined,
  });

  const rows = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Group by exhibitor name
  const grouped = rows.reduce<Record<string, FacilityOrderWithDetails[]>>((acc, order) => {
    const name = getExhibitorName(order);
    if (!acc[name]) acc[name] = [];
    acc[name].push(order);
    return acc;
  }, {});

  const handleBulkConfirm = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'confirmed' } });
    toast.success(`${count} order${count !== 1 ? 's' : ''} confirmed`);
    clear();
  };

  const handleBulkComplete = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'completed' } });
    toast.success(`${count} order${count !== 1 ? 's' : ''} completed`);
    clear();
  };

  const handleBulkCancel = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'cancelled' } });
    toast.success(`${count} order${count !== 1 ? 's' : ''} cancelled`);
    clear();
  };

  const renderTable = (orders: FacilityOrderWithDetails[], startIdx = 0) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <TableHead
          ids={orders.map((o) => o.id)}
          isAllSelected={isAllSelected(orders.map((o) => o.id))}
          isIndeterminate={isIndeterminate(orders.map((o) => o.id))}
          toggleAll={toggleAll}
        />
        <tbody className="divide-y divide-slate-100">
          {orders.map((order, idx) => (
            <OrderRow
              key={order.id}
              order={order}
              eventId={params.id as string}
              idx={startIdx + idx}
              boothMap={boothMap}
              selected={isSelected(order.id)}
              onToggle={() => toggle(order.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <h1 className="text-xl font-bold text-content-primary">Facility Orders</h1>
        <p className="text-content-tertiary mt-1 text-sm">
          Review and process booth equipment and service orders.
        </p>
      </ContainerHeader>

      <Container>
        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ref number, exhibitor name, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 transition"
              >
                <Icon icon="lucide:x" className="w-3.5 h-3.5 text-content-tertiary" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-content-secondary hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-content-tertiary">
              {isLoading ? '...' : `${total} order${total !== 1 ? 's' : ''}`}
              {search && <span className="ml-1 text-blue-600">· filtered</span>}
            </span>
            <div className="ml-auto">
              <button
                onClick={() => setGroupByExhibitor((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  groupByExhibitor
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-content-secondary hover:bg-slate-200'
                }`}
              >
                <Icon icon="lucide:layers" className="w-3.5 h-3.5" />
                Group by Exhibitor
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading orders...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-content-secondary text-sm">Failed to load orders</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:shopping-cart" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No orders found</p>
          </div>
        ) : groupByExhibitor ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([exhibitorName, orders], gIdx) => (
              <div key={exhibitorName}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-sm text-content-primary">{exhibitorName}</span>
                  <span className="text-xs text-content-tertiary">· {orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-medium text-content-secondary ml-auto">
                    Total: {formatCurrency(orders.reduce((s, o) => s + (o.total_amount ?? 0), 0))}
                  </span>
                </div>
                {renderTable(orders, gIdx * 10)}
              </div>
            ))}
          </div>
        ) : (
          renderTable(rows)
        )}

        {!groupByExhibitor && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5 mr-1" />Previous
            </Button>
            <span className="text-sm text-content-tertiary">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next<Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </Container>

      <BulkActionBar
        count={count}
        onClear={clear}
        actions={[
          {
            label: 'Confirm',
            icon: 'lucide:check',
            onClick: handleBulkConfirm,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Complete',
            icon: 'lucide:check-check',
            onClick: handleBulkComplete,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Cancel',
            icon: 'lucide:ban',
            onClick: handleBulkCancel,
            variant: 'danger',
            loading: bulkUpdate.isPending,
          },
        ]}
      />
    </div>
  );
}
