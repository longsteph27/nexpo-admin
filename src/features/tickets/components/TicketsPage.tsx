'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useTickets, useBulkUpdateTickets, useBulkDeleteTickets } from '../hooks/useTickets';
import { useBoothMap } from '@/features/exhibitors/hooks/useExhibitors';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from 'sonner';
import type { SupportTicketWithDetails, TicketStatus, TicketPriority } from '../types';

const STATUS_MAP: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', cls: 'bg-gray-100 text-gray-500' },
};

const PRIORITY_MAP: Record<TicketPriority, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'text-gray-400' },
  medium: { label: 'Medium', cls: 'text-blue-500' },
  high: { label: 'High', cls: 'text-orange-500' },
  urgent: { label: 'Urgent', cls: 'text-red-600' },
};

const STATUS_FILTERS: { label: string; value: TicketStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

function getExhibitorName(ticket: SupportTicketWithDetails): string {
  const translations = ticket.exhibitor_id?.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  return en?.company_name || translations[0]?.company_name || 'Unknown Exhibitor';
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

function TicketRow({ ticket, eventId, idx, boothMap, selected, onToggle }: { ticket: SupportTicketWithDetails; eventId: string | string[]; idx: number; boothMap: Record<string, string>; selected: boolean; onToggle: () => void }) {
  const router = useRouter();
  const { label: sLabel, cls: sCls } = STATUS_MAP[ticket.status] ?? { label: ticket.status, cls: '' };
  const { label: pLabel, cls: pCls } = PRIORITY_MAP[ticket.priority] ?? { label: ticket.priority, cls: '' };
  const replyCount = ticket.replies?.length ?? 0;
  const exhibitorId = typeof ticket.exhibitor_id === 'object' ? ticket.exhibitor_id?.id : ticket.exhibitor_id;
  const booth = exhibitorId ? boothMap[exhibitorId] : undefined;
  return (
    <motion.tr
      key={ticket.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
      onClick={() => router.push(`/events/${eventId}/tickets/${ticket.id}`)}
    >
      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <input type="checkbox" checked={selected} onChange={onToggle} onClick={(e) => e.stopPropagation()} className="rounded border-slate-300 accent-blue-600" />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-content-primary line-clamp-1">{ticket.subject}</p>
        {ticket.message && (
          <p className="text-xs text-content-tertiary line-clamp-1 mt-0.5">{ticket.message}</p>
        )}
      </td>
      <td className="px-4 py-3 text-content-secondary">{getExhibitorName(ticket)}</td>
      <td className="px-4 py-3">
        {booth
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono font-medium text-content-primary">{booth}</span>
          : <span className="text-content-tertiary text-xs">—</span>
        }
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold ${pCls}`}>{pLabel}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sCls}`}>{sLabel}</span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-content-tertiary text-xs">
          <Icon icon="lucide:message-square" className="w-3.5 h-3.5" />
          {replyCount}
        </span>
      </td>
      <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(ticket.date_created)}</td>
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
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Subject</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Booth</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Priority</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Replies</th>
        <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  );
}

export function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('open');
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
  const bulkUpdate = useBulkUpdateTickets();
  const bulkDelete = useBulkDeleteTickets();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const { data, isLoading, error } = useTickets(eventId, {
    page,
    limit: groupByExhibitor ? 100 : 20,
    status: statusFilter,
    sort: groupByExhibitor ? 'exhibitor_id' : '-date_created',
    search: search || undefined,
  });

  const rows = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const ids = rows.map((r) => r.id);

  // Group rows by exhibitor name
  const grouped = rows.reduce<Record<string, SupportTicketWithDetails[]>>((acc, ticket) => {
    const name = getExhibitorName(ticket);
    if (!acc[name]) acc[name] = [];
    acc[name].push(ticket);
    return acc;
  }, {});

  const renderTable = (tickets: SupportTicketWithDetails[], startIdx = 0) => (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <TableHead
          ids={tickets.map((t) => t.id)}
          isAllSelected={isAllSelected(tickets.map((t) => t.id))}
          isIndeterminate={isIndeterminate(tickets.map((t) => t.id))}
          toggleAll={toggleAll}
        />
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket, idx) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              eventId={params.id as string}
              idx={startIdx + idx}
              boothMap={boothMap}
              selected={isSelected(ticket.id)}
              onToggle={() => toggle(ticket.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  const handleBulkResolve = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'resolved' } });
    toast.success(`${count} ticket${count !== 1 ? 's' : ''} marked as resolved`);
    clear();
  };

  const handleBulkClose = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'closed' } });
    toast.success(`${count} ticket${count !== 1 ? 's' : ''} closed`);
    clear();
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(selectedArray);
    toast.success(`${count} ticket${count !== 1 ? 's' : ''} deleted`);
    clear();
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <h1 className="text-xl font-bold text-content-primary">Support Tickets</h1>
        <p className="text-content-tertiary mt-1 text-sm">
          View and respond to exhibitor support requests.
        </p>
      </ContainerHeader>

      <Container>
        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Search bar */}
          <div className="relative">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by subject, message, exhibitor name..."
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
          {/* Status filters + group toggle */}
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
              {isLoading ? '...' : `${total} ticket${total !== 1 ? 's' : ''}`}
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
            <span>Loading tickets...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm">Failed to load tickets</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:ticket" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No tickets found</p>
          </div>
        ) : groupByExhibitor ? (
          <div className="space-y-5">
            {Object.entries(grouped).map(([exhibitorName, tickets], gIdx) => (
              <div key={exhibitorName}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-sm text-content-primary">{exhibitorName}</span>
                  <span className="text-xs text-content-tertiary">· {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
                </div>
                {renderTable(tickets, gIdx * 10)}
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
            label: 'Resolve',
            icon: 'lucide:check-circle',
            onClick: handleBulkResolve,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Close',
            icon: 'lucide:x-circle',
            onClick: handleBulkClose,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Delete',
            icon: 'lucide:trash-2',
            onClick: handleBulkDelete,
            variant: 'danger',
            loading: bulkDelete.isPending,
          },
        ]}
      />
    </div>
  );
}
