'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useSelection } from '@/hooks/useSelection';
import {
  useAgendaEvents,
  useBulkUpdateAgendaEventStatus,
  useDeleteAgendaEvent,
} from '../hooks/useAgendas';
import AgendaScheduleView from './AgendaScheduleView';
import type { Agenda } from '../types';

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
    draft: { label: 'Draft', cls: 'bg-yellow-100 text-yellow-700' },
    archived: { label: 'Archived', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status ?? 'draft'] ?? map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

interface AgendasPageProps {
  eventId: number;
}

export default function AgendasPage({ eventId }: AgendasPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageView, setPageView] = useState<'table' | 'schedule'>(
    searchParams?.get('view') === 'schedule' ? 'schedule' : 'table'
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useAgendaEvents(eventId, {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const agendaEvents = data?.agendaEvents ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const bulkStatus = useBulkUpdateAgendaEventStatus();
  const deleteAgenda = useDeleteAgendaEvent();
  const { selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const allIds = agendaEvents.map((a) => a.id);

  const getTitle = (agenda: Agenda) => agenda.translations?.[0]?.title ?? 'Untitled';
  const formatDate = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Agendas</h1>
          <p className="text-content-tertiary mt-1 text-sm">
            Manage agenda items for this event.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Table / Schedule toggle */}
          <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
            <button
              onClick={() => setPageView('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                pageView === 'table' ? 'bg-slate-100 text-content-primary' : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              <Icon icon="lucide:table-2" className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setPageView('schedule')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                pageView === 'schedule' ? 'bg-slate-100 text-content-primary' : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              <Icon icon="lucide:calendar-days" className="w-3.5 h-3.5" />
              Schedule
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/events/${eventId}/sessions/new`)}>
            <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />
            Add Session
          </Button>
          <Button variant="gradient" size="sm" onClick={() => router.push(`/events/${eventId}/agendas/new`)}>
            <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />
            Add Agenda
          </Button>
        </div>
      </ContainerHeader>

      {/* Schedule view */}
      {pageView === 'schedule' && (
        <Container>
          <AgendaScheduleView eventId={eventId} />
        </Container>
      )}

      {/* Table view */}
      {pageView === 'table' && <Container>
        {/* Search + stats */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search agendas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-content-tertiary whitespace-nowrap">
            {total} item{total !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-content-secondary">
              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading agendas…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm font-medium">Failed to load agendas</p>
              <p className="text-red-400 text-xs mt-1">
                {(error as any)?.errors?.[0]?.message ?? (error as any)?.message ?? String(error)}
              </p>
            </div>
          </div>
        ) : agendaEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:calendar" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">
              {debouncedSearch ? 'No agendas match your search.' : 'No agendas yet.'}
            </p>
            {!debouncedSearch && (
              <p className="text-content-tertiary text-sm mt-1">
                <button
                  onClick={() => router.push(`/events/${eventId}/agendas/new`)}
                  className="text-blue-600 hover:underline"
                >
                  Create the first one
                </button>
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={isAllSelected(allIds)}
                        ref={(el) => { if (el) el.indeterminate = isIndeterminate(allIds); }}
                        onChange={() => toggleAll(allIds)}
                        className="rounded border-slate-300 accent-blue-600"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agendaEvents.map((agenda, idx) => (
                    <motion.tr
                      key={agenda.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`cursor-pointer transition-colors ${isSelected(agenda.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => router.push(`/events/${eventId}/agendas/${agenda.id}`)}
                    >
                      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); toggle(agenda.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected(agenda.id)}
                          onChange={() => toggle(agenda.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-content-primary">
                        {getTitle(agenda)}
                        {agenda.session_type && (
                          <span className="ml-2 text-xs text-content-tertiary capitalize">{agenda.session_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-content-secondary text-xs">
                        {agenda.start_time ? (
                          <span>{agenda.start_time}{agenda.end_time ? ` – ${agenda.end_time}` : ''}</span>
                        ) : formatDate(agenda.date)}
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-sm">
                        {agenda.location ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={agenda.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-content-tertiary">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Container>}

      <BulkActionBar
        count={count}
        onClear={clear}
        actions={[
          {
            label: 'Publish',
            icon: 'lucide:eye',
            loading: bulkStatus.isPending,
            onClick: () => bulkStatus.mutate({ ids: selectedArray, payload: { status: 'published' } as any }, { onSuccess: clear }),
          },
          {
            label: 'Archive',
            icon: 'lucide:archive',
            loading: bulkStatus.isPending,
            onClick: () => bulkStatus.mutate({ ids: selectedArray, payload: { status: 'archived' } as any }, { onSuccess: clear }),
          },
          {
            label: 'Delete',
            icon: 'lucide:trash-2',
            variant: 'danger',
            loading: deleteAgenda.isPending,
            onClick: () => {
              if (confirm(`Delete ${count} agenda(s)?`)) {
                deleteAgenda.mutate(selectedArray, { onSuccess: clear });
              }
            },
          },
        ]}
      />
    </div>
  );
}
