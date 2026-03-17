'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useExhibitorEvents, useBulkUpdateExhibitorEvents } from '../hooks/useExhibitors';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from 'sonner';
import type { ExhibitorEventWithDetails } from '../types';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

function getExhibitorName(row: ExhibitorEventWithDetails): string {
  const ex = row.exhibitor_id;
  if (!ex) return row.nameboard || 'Unnamed';
  const translations = ex.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  const vi = translations.find((t) => t.languages_code === 'vi-VN');
  return en?.company_name || vi?.company_name || row.nameboard || 'Unnamed';
}

function getLogoUrl(logoField: ExhibitorEventWithDetails['exhibitor_id']['logo']): string | null {
  if (!logoField) return null;
  if (typeof logoField === 'string') return `${DIRECTUS_URL}/assets/${logoField}`;
  if (typeof logoField === 'object' && 'id' in logoField) return `${DIRECTUS_URL}/assets/${logoField.id}`;
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
    draft: { label: 'Draft', cls: 'bg-yellow-100 text-yellow-700' },
    archived: { label: 'Archived', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function ExhibitorsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useExhibitorEvents(eventId, {
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const rows = data?.exhibitorEvents ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const bulkUpdate = useBulkUpdateExhibitorEvents();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const allIds = rows.map((r) => r.id);

  const handleBulkPublish = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'published' } });
    toast.success(`${count} exhibitor${count !== 1 ? 's' : ''} published`);
    clear();
  };

  const handleBulkArchive = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'archived' } });
    toast.success(`${count} exhibitor${count !== 1 ? 's' : ''} archived`);
    clear();
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Exhibitors</h1>
          <p className="text-content-tertiary mt-1 text-sm">
            Manage exhibitor booths and their participation in this event.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => router.push(`/events/${eventId}/exhibitors/invite`)}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />
          Add Exhibitor
        </Button>
      </ContainerHeader>

      <Container>
        {/* Search + stats row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search exhibitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-content-tertiary whitespace-nowrap">
            {total} exhibitor{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-content-secondary">
              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading exhibitors...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm font-medium">Failed to load exhibitors</p>
              <p className="text-red-400 text-xs mt-1 max-w-sm">
                {(error as any)?.errors?.[0]?.message ?? (error as any)?.message ?? String(error)}
              </p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:store" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No exhibitors yet</p>
            <p className="text-content-tertiary text-sm mt-1">Add exhibitors to get started.</p>
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
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Booth</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Representative</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Badges</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const name = getExhibitorName(row);
                  const logoUrl = getLogoUrl(row.exhibitor_id?.logo);
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`cursor-pointer transition-colors ${isSelected(row.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => router.push(`/events/${eventId}/exhibitors/${row.id}`)}
                    >
                      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); toggle(row.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected(row.id)}
                          onChange={() => toggle(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt={name} className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-white" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                              <Icon icon="lucide:store" className="w-4 h-4 text-blue-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-content-primary">{name}</p>
                            {row.exhibitor_id?.website && (
                              <p className="text-xs text-content-tertiary truncate max-w-[160px]">{row.exhibitor_id.website}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-content-primary">{row.booth_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-content-primary">{row.representative_name || row.exhibitor_id?.representative_name || '—'}</p>
                          {(row.representative_email || row.exhibitor_id?.representative_email) && (
                            <p className="text-xs text-content-tertiary">{row.representative_email || row.exhibitor_id?.representative_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-content-primary">{row.badge_quantity ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary ml-auto" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-content-tertiary">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
              <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </Container>

      <BulkActionBar
        count={count}
        onClear={clear}
        actions={[
          {
            label: 'Publish',
            icon: 'lucide:eye',
            onClick: handleBulkPublish,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Archive',
            icon: 'lucide:archive',
            onClick: handleBulkArchive,
            variant: 'danger',
            loading: bulkUpdate.isPending,
          },
        ]}
      />
    </div>
  );
}
