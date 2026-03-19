'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useSelection } from '@/hooks/useSelection';
import {
  useSpeakers,
  useBulkUpdateSpeakerStatus,
  useDeleteSpeakers,
} from '../hooks/useSpeakers';
import type { Speaker } from '../types';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

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

function SpeakerAvatar({ photo, avatar, name }: { photo?: string | null; avatar?: string | null; name: string }) {
  const imageId = avatar ?? photo;
  if (imageId) {
    return (
      <img
        src={`${DIRECTUS_URL}/assets/${imageId}?width=40&height=40&fit=cover`}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border border-slate-200"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
      <Icon icon="lucide:user" className="w-4 h-4 text-blue-400" />
    </div>
  );
}

interface SpeakersPageProps {
  eventId: number;
}

export default function SpeakersPage({ eventId }: SpeakersPageProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useSpeakers(eventId, {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const speakers = data?.speakers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const bulkStatus = useBulkUpdateSpeakerStatus();
  const deleteSpeaker = useDeleteSpeakers();
  const { selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const allIds = speakers.map((s) => s.id);

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Speakers</h1>
          <p className="text-content-tertiary mt-1 text-sm">
            Manage speakers for this event.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => router.push(`/events/${eventId}/speakers/new`)}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />
          Add Speaker
        </Button>
      </ContainerHeader>

      <Container>
        {/* Search + stats */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search speakers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-content-tertiary whitespace-nowrap">
            {total} speaker{total !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-content-secondary">
              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading speakers…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm font-medium">Failed to load speakers</p>
              <p className="text-red-400 text-xs mt-1">
                {(error as any)?.errors?.[0]?.message ?? (error as any)?.message ?? String(error)}
              </p>
            </div>
          </div>
        ) : speakers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:mic-2" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">
              {debouncedSearch ? 'No speakers match your search.' : 'No speakers yet.'}
            </p>
            {!debouncedSearch && (
              <p className="text-content-tertiary text-sm mt-1">
                <button
                  onClick={() => router.push(`/events/${eventId}/speakers/new`)}
                  className="text-blue-600 hover:underline"
                >
                  Add the first speaker
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
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Speaker</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Position</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Company</th>
                    <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {speakers.map((speaker, idx) => (
                    <motion.tr
                      key={speaker.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`cursor-pointer transition-colors ${isSelected(speaker.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => router.push(`/events/${eventId}/speakers/${speaker.id}`)}
                    >
                      <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); toggle(speaker.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected(speaker.id)}
                          onChange={() => toggle(speaker.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SpeakerAvatar photo={speaker.photo} avatar={speaker.avatar} name={speaker.name} />
                          <span className="font-medium text-content-primary">{speaker.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-content-secondary">{speaker.position ?? '—'}</td>
                      <td className="px-4 py-3 text-content-secondary">{speaker.company ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={speaker.status} />
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
      </Container>

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
            loading: deleteSpeaker.isPending,
            onClick: () => {
              if (confirm(`Delete ${count} speaker(s)?`)) {
                deleteSpeaker.mutate(selectedArray, { onSuccess: clear });
              }
            },
          },
        ]}
      />
    </div>
  );
}
