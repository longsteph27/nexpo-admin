'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useMatchRequests, useUpdateMatchRequest, useBulkUpdateMatchRequests, useBulkDeleteMatchRequests } from '../hooks/useMatching';
import { useBoothMap } from '@/features/exhibitors/hooks/useExhibitors';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from 'sonner';
import type { VisitorMatchRequestWithDetails, MatchRequestStatus, Meeting } from '../types';
import { VisitorDetailSheet } from './VisitorDetailSheet';
import { EditMeetingSheet } from './EditMeetingSheet';

const STATUS_MAP: Record<MatchRequestStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  organizer_approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-700' },
  exhibitor_agreed: { label: 'Agreed', cls: 'bg-green-100 text-green-700' },
  exhibitor_declined: { label: 'Declined', cls: 'bg-red-100 text-red-600' },
  organizer_rejected: { label: 'Rejected', cls: 'bg-gray-100 text-gray-500' },
  converted_to_meeting: { label: 'Converted', cls: 'bg-purple-100 text-purple-700' },
};

function getExhibitorName(req: VisitorMatchRequestWithDetails): string {
  const translations = req.exhibitor_id?.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  const vi = translations.find((t) => t.languages_code === 'vi-VN');
  return en?.company_name || vi?.company_name || 'Unknown Exhibitor';
}

function getVisitorProfile(reg: VisitorMatchRequestWithDetails['registration_id']): { name: string; email: string } {
  if (reg.full_name) return { name: reg.full_name, email: reg.email || '' };
  const answers = reg.submissions?.answers || [];
  const texts: string[] = [];
  let email = reg.email || '';
  for (const a of answers) {
    const val = a.value?.trim();
    if (!val) continue;
    if (!email && val.includes('@')) { email = val; continue; }
    if (/^\+?[\d\s\-().]{9,}$/.test(val)) continue;
    texts.push(val);
  }
  return { name: texts.slice(0, 2).join(' ').trim() || '—', email };
}

function formatDateTime(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function StatusBadge({ status }: { status: MatchRequestStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

const STATUS_FILTERS: { label: string; value: MatchRequestStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'organizer_approved' },
  { label: 'Agreed', value: 'exhibitor_agreed' },
  { label: 'Declined', value: 'exhibitor_declined' },
  { label: 'Rejected', value: 'organizer_rejected' },
];

function RequestCard({
  req,
  idx,
  actionLoading,
  onApprove,
  onReject,
  boothMap,
  selected,
  onToggle,
  onViewVisitor,
}: {
  req: VisitorMatchRequestWithDetails;
  idx: number;
  actionLoading: string | null;
  onApprove: (req: VisitorMatchRequestWithDetails) => void;
  onReject: (req: VisitorMatchRequestWithDetails) => void;
  boothMap: Record<string, string>;
  selected: boolean;
  onToggle: () => void;
  onViewVisitor: (registrationId: string) => void;
}) {
  const isLoading = actionLoading === req.id;
  const isPending = req.status === 'pending';
  const exhibitorId = typeof req.exhibitor_id === 'object' ? req.exhibitor_id?.id : req.exhibitor_id;
  const booth = exhibitorId ? boothMap[exhibitorId] : undefined;
  const visitor = typeof req.registration_id === 'object' ? getVisitorProfile(req.registration_id) : null;
  const registrationId = typeof req.registration_id === 'object' ? req.registration_id?.id : req.registration_id;
  return (
    <motion.div
      key={req.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={`border rounded-xl p-4 bg-white transition-colors ${selected ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 rounded border-slate-300 accent-blue-600 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={req.status} />
            <span className="text-xs text-content-tertiary">{formatDateTime(req.date_created)}</span>
          </div>
          {/* Visitor row */}
          {visitor && (
            <button
              className="flex items-center gap-1.5 mb-1 group text-left w-full"
              onClick={() => registrationId && onViewVisitor(registrationId)}
            >
              <Icon icon="lucide:user" className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
              <span className="text-sm font-medium text-content-primary group-hover:text-blue-600 group-hover:underline transition-colors">{visitor.name}</span>
              {visitor.email && (
                <span className="text-xs text-content-tertiary truncate">{visitor.email}</span>
              )}
              <Icon icon="lucide:chevron-right" className="w-3 h-3 text-content-tertiary ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
          {/* Exhibitor row */}
          <div className="flex items-center gap-2">
            <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
            <p className="text-sm text-content-secondary">{getExhibitorName(req)}</p>
            {booth && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono font-medium text-content-primary">{booth}</span>
            )}
          </div>
          {req.message && (
            <p className="text-xs text-content-secondary mt-1 line-clamp-2">{req.message}</p>
          )}
          {req.preferred_meeting_time && (
            <p className="text-xs text-content-tertiary mt-1 flex items-center gap-1">
              <Icon icon="lucide:calendar" className="w-3 h-3" />
              Preferred: {formatDateTime(req.preferred_meeting_time)}
            </p>
          )}
          {req.organizer_note && (
            <p className="text-xs text-blue-600 mt-1 italic">Note: {req.organizer_note}</p>
          )}
        </div>
        {isPending && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(req)}
              disabled={isLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Icon icon="lucide:x" className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="gradient"
              onClick={() => onApprove(req)}
              disabled={isLoading}
            >
              {isLoading
                ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                : <><Icon icon="lucide:check" className="w-3.5 h-3.5 mr-1" />Approve</>
              }
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TalentMatchRequestsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const [statusFilter, setStatusFilter] = useState<MatchRequestStatus | ''>('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ req: VisitorMatchRequestWithDetails; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [groupByExhibitor, setGroupByExhibitor] = useState(true);
  const [sort, setSort] = useState('-date_created');
  const [visitorSheet, setVisitorSheet] = useState<string | null>(null);
  const [createMeetingData, setCreateMeetingData] = useState<Partial<Meeting> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: boothMapData } = useBoothMap(eventId);
  const boothMap = boothMapData ?? {};
  const bulkUpdate = useBulkUpdateMatchRequests();
  const bulkDelete = useBulkDeleteMatchRequests();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const { data, isLoading, error, refetch } = useMatchRequests(eventId, {
    page,
    limit: groupByExhibitor ? 100 : 20,
    status: statusFilter,
    sort,
    search: search || undefined,
    request_type: 'interview',
  });
  const updateMutation = useUpdateMatchRequest();

  const rows = data?.requests ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleApprove = async (req: VisitorMatchRequestWithDetails, organizerNote?: string) => {
    setActionLoading(req.id);
    try {
      await updateMutation.mutateAsync({
        id: req.id,
        payload: {
          status: 'organizer_approved',
          organizer_note: organizerNote || undefined,
          organizer_approved_at: new Date().toISOString(),
        },
      });
      await refetch();
      setCreateMeetingData({
        match_request_id: req.id as any,
        exhibitor_id: (typeof req.exhibitor_id === 'object' ? req.exhibitor_id : { id: req.exhibitor_id }) as any,
        registration_id: (typeof req.registration_id === 'object' ? req.registration_id : { id: req.registration_id }) as any,
        scheduled_at: req.preferred_meeting_time || undefined,
        meeting_category: 'talent' as any,
        status: 'scheduled',
      });
    } finally {
      setActionLoading(null);
      setNoteModal(null);
      setNote('');
    }
  };

  const handleReject = async (req: VisitorMatchRequestWithDetails, organizerNote?: string) => {
    setActionLoading(req.id);
    try {
      await updateMutation.mutateAsync({
        id: req.id,
        payload: {
          status: 'organizer_rejected',
          organizer_note: organizerNote || undefined,
        },
      });
      await refetch();
    } finally {
      setActionLoading(null);
      setNoteModal(null);
      setNote('');
    }
  };

  const handleBulkApprove = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'organizer_approved' } });
    toast.success(`${count} request${count !== 1 ? 's' : ''} approved`);
    clear();
  };

  const handleBulkReject = async () => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status: 'organizer_rejected' } });
    toast.success(`${count} request${count !== 1 ? 's' : ''} rejected`);
    clear();
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(selectedArray);
    toast.success(`${count} request${count !== 1 ? 's' : ''} deleted`);
    clear();
  };

  const allIds = rows.map((r) => r.id);

  // Group by exhibitor — sort: most pending first, then alphabetical
  const groupedMap = rows.reduce<Record<string, { name: string; boothNo?: string; reqs: VisitorMatchRequestWithDetails[] }>>((acc, req) => {
    const id = typeof req.exhibitor_id === 'object' ? req.exhibitor_id?.id ?? '__other__' : '__other__';
    const name = getExhibitorName(req);
    const exhibitorId = typeof req.exhibitor_id === 'object' ? req.exhibitor_id?.id : req.exhibitor_id;
    if (!acc[id]) acc[id] = { name, boothNo: exhibitorId ? boothMap[exhibitorId] : undefined, reqs: [] };
    acc[id].reqs.push(req);
    return acc;
  }, {});
  const grouped = Object.values(groupedMap).sort((a, b) => {
    const aPending = a.reqs.filter(r => r.status === 'pending').length;
    const bPending = b.reqs.filter(r => r.status === 'pending').length;
    if (bPending !== aPending) return bPending - aPending;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <h1 className="text-xl font-bold text-content-primary">Talent Match Requests</h1>
        <p className="text-content-tertiary mt-1 text-sm">
          Review and approve visitor–exhibitor interview requests.
        </p>
      </ContainerHeader>

      <Container>
        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by exhibitor name, message, note..."
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
              {isLoading ? '...' : `${total} request${total !== 1 ? 's' : ''}`}
              {search && <span className="ml-1 text-blue-600">· filtered</span>}
            </span>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {rows.length > 0 && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-content-secondary hover:bg-slate-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllSelected(allIds)}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate(allIds); }}
                    onChange={() => toggleAll(allIds)}
                    className="rounded border-slate-300 accent-blue-600"
                  />
                  Select all
                </label>
              )}
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                <Icon icon="lucide:arrow-up-down" className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" />
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1); }}
                  className="text-xs font-medium text-content-secondary bg-transparent outline-none cursor-pointer"
                >
                  <option value="-date_created">Mới nhất</option>
                  <option value="date_created">Cũ nhất</option>
                  <option value="preferred_meeting_time">Thời gian mong muốn ↑</option>
                  <option value="-preferred_meeting_time">Thời gian mong muốn ↓</option>
                </select>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                <button onClick={() => setGroupByExhibitor(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${groupByExhibitor ? 'bg-blue-600 text-white' : 'bg-white text-content-secondary hover:bg-slate-50'}`}>
                  <Icon icon="lucide:building-2" className="w-3.5 h-3.5" /> Grouped
                </button>
                <button onClick={() => setGroupByExhibitor(false)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${!groupByExhibitor ? 'bg-blue-600 text-white' : 'bg-white text-content-secondary hover:bg-slate-50'}`}>
                  <Icon icon="lucide:list" className="w-3.5 h-3.5" /> Flat
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm">Failed to load requests</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:user-check" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No talent match requests found</p>
          </div>
        ) : groupByExhibitor ? (
          <div className="space-y-5">
            {grouped.map((group, gIdx) => {
              const statusCounts = group.reqs.reduce<Record<string, number>>((acc, r) => {
                acc[r.status] = (acc[r.status] ?? 0) + 1;
                return acc;
              }, {});
              return (
                <div key={group.name}>
                  <div className="flex items-center gap-2 mb-2.5 px-1 flex-wrap">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Icon icon="lucide:building-2" className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-sm text-content-primary">{group.name}</span>
                    {group.boothNo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono font-medium text-content-primary">{group.boothNo}</span>
                    )}
                    <div className="flex items-center gap-1.5 ml-1">
                      {(statusCounts.pending ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">{statusCounts.pending} pending</span>
                      )}
                      {(statusCounts.organizer_approved ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">{statusCounts.organizer_approved} approved</span>
                      )}
                      {(statusCounts.exhibitor_agreed ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{statusCounts.exhibitor_agreed} agreed</span>
                      )}
                      {(statusCounts.exhibitor_declined ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">{statusCounts.exhibitor_declined} declined</span>
                      )}
                      <span className="text-xs text-content-tertiary">· {group.reqs.length} total</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.reqs.map((req, idx) => (
                      <RequestCard
                        key={req.id}
                        req={req}
                        idx={gIdx * 10 + idx}
                        actionLoading={actionLoading}
                        onApprove={(r) => { setNoteModal({ req: r, action: 'approve' }); setNote(''); }}
                        onReject={(r) => { setNoteModal({ req: r, action: 'reject' }); setNote(''); }}
                        boothMap={boothMap}
                        selected={isSelected(req.id)}
                        onToggle={() => toggle(req.id)}
                        onViewVisitor={setVisitorSheet}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {rows.map((req, idx) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  idx={idx}
                  actionLoading={actionLoading}
                  onApprove={(r) => { setNoteModal({ req: r, action: 'approve' }); setNote(''); }}
                  onReject={(r) => { setNoteModal({ req: r, action: 'reject' }); setNote(''); }}
                  boothMap={boothMap}
                  selected={isSelected(req.id)}
                  onToggle={() => toggle(req.id)}
                  onViewVisitor={setVisitorSheet}
                />
              ))}
            </div>
            {totalPages > 1 && (
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
          </>
        )}
      </Container>

      <BulkActionBar
        count={count}
        onClear={clear}
        actions={[
          {
            label: 'Approve',
            icon: 'lucide:check-circle',
            onClick: handleBulkApprove,
            loading: bulkUpdate.isPending,
          },
          {
            label: 'Reject',
            icon: 'lucide:x-circle',
            onClick: handleBulkReject,
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

      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
          >
            <h3 className="font-semibold text-content-primary mb-1">
              {noteModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p className="text-sm text-content-tertiary mb-4">
              {noteModal.action === 'approve'
                ? 'Optionally add a note for the exhibitor.'
                : 'Optionally explain why this request is rejected.'}
            </p>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              rows={3}
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setNoteModal(null); setNote(''); }}>Cancel</Button>
              <Button
                size="sm"
                variant={noteModal.action === 'approve' ? 'gradient' : 'outline'}
                className={noteModal.action === 'reject' ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
                onClick={() =>
                  noteModal.action === 'approve'
                    ? handleApprove(noteModal.req, note)
                    : handleReject(noteModal.req, note)
                }
              >
                {noteModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <VisitorDetailSheet
        registrationId={visitorSheet}
        open={!!visitorSheet}
        onClose={() => setVisitorSheet(null)}
      />

      <EditMeetingSheet
        meeting={null}
        eventId={eventId}
        open={!!createMeetingData}
        onClose={() => setCreateMeetingData(null)}
        createMode
        initialData={createMeetingData ?? undefined}
      />
    </div>
  );
}
