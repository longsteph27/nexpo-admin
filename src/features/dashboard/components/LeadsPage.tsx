'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useLeads, useBulkUpdateLeads, useBulkDeleteLeads } from '../hooks/useDashboard';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from 'sonner';

const STATUS_MAP = {
  hot: { label: 'Hot', cls: 'bg-red-100 text-red-600' },
  warm: { label: 'Warm', cls: 'bg-orange-100 text-orange-600' },
  cold: { label: 'Cold', cls: 'bg-blue-100 text-blue-500' },
};

function getExhibitorName(exhibitor: { translations?: { languages_code?: string; company_name?: string }[] } | undefined): string {
  if (!exhibitor) return '—';
  const translations = exhibitor.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  return en?.company_name || translations[0]?.company_name || '—';
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

export function LeadsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useLeads(eventId, { page, limit, search: debouncedSearch || undefined });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const bulkUpdate = useBulkUpdateLeads();
  const bulkDelete = useBulkDeleteLeads();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const allIds = leads.map((l) => l.id);

  const handleBulkStatus = async (status: 'hot' | 'warm' | 'cold') => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status } });
    toast.success(`${count} lead${count !== 1 ? 's' : ''} marked as ${status}`);
    clear();
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(selectedArray);
    toast.success(`${count} lead${count !== 1 ? 's' : ''} deleted`);
    clear();
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Leads Overview</h1>
          <p className="text-content-tertiary mt-1 text-sm">All leads captured by exhibitors during this event.</p>
        </div>
      </ContainerHeader>

      <Container>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-content-tertiary whitespace-nowrap">{total} lead{total !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading leads...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-content-secondary text-sm">Failed to load leads</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:scan-line" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No leads yet</p>
          </div>
        ) : (
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
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Attendee</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Company</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Captured By</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead, idx) => {
                  const s = lead.status ? STATUS_MAP[lead.status] : null;
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`transition-colors ${isSelected(lead.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); toggle(lead.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected(lead.id)}
                          onChange={() => toggle(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-content-primary">{lead.attendee_name || '—'}</p>
                        {lead.attendee_email && (
                          <p className="text-xs text-content-tertiary">{lead.attendee_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-content-secondary">{lead.attendee_company || '—'}</td>
                      <td className="px-4 py-3 text-content-secondary text-xs">
                        {getExhibitorName(lead.exhibitor_id as any)}
                      </td>
                      <td className="px-4 py-3">
                        {s ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                        ) : <span className="text-content-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(lead.date_created)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5 mr-1" />Previous
            </Button>
            <span className="text-sm text-content-tertiary">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
            label: 'Hot',
            icon: 'lucide:flame',
            onClick: () => handleBulkStatus('hot'),
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Warm',
            icon: 'lucide:thermometer',
            onClick: () => handleBulkStatus('warm'),
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Cold',
            icon: 'lucide:snowflake',
            onClick: () => handleBulkStatus('cold'),
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
