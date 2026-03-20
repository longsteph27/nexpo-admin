'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';
import { useSelection } from '@/hooks/useSelection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessMatchingApi } from '../api';
import type { BusinessMatchSuggestion, BusinessMatchSuggestionStatus } from '../types';

const STATUS_MAP: Record<BusinessMatchSuggestionStatus, { label: string; cls: string }> = {
  pending:             { label: 'Pending',            cls: 'bg-yellow-100 text-yellow-700' },
  approved:            { label: 'Approved',            cls: 'bg-green-100 text-green-700' },
  rejected:            { label: 'Rejected',            cls: 'bg-red-100 text-red-600' },
  converted_to_meeting:{ label: 'Meeting Created',     cls: 'bg-purple-100 text-purple-700' },
  archived:            { label: 'Archived',            cls: 'bg-gray-100 text-gray-500' },
};

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Meeting Created', value: 'converted_to_meeting' },
];

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'text-green-700 bg-green-100' : pct >= 50 ? 'text-yellow-700 bg-yellow-100' : 'text-red-600 bg-red-100';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{pct}%</span>;
}

function getExhibitorName(s: BusinessMatchSuggestion): string {
  const ex = s.exhibitor_id;
  if (!ex || typeof ex === 'string') return '—';
  const t = ex.translations?.find(t => t.languages_code === 'vi-VN') || ex.translations?.[0];
  return t?.company_name || '—';
}

function getRegistrationName(s: BusinessMatchSuggestion): { name: string; email: string } {
  const reg = s.registration_id;
  if (!reg || typeof reg === 'string') return { name: '—', email: '' };
  return { name: reg.full_name || '—', email: reg.email || '' };
}

function getRequirementLabel(s: BusinessMatchSuggestion): string {
  const req = s.business_requirement_id;
  if (!req || typeof req === 'string') return '—';
  return req.summary || req.requirement_type || '—';
}

export function BusinessMatchSuggestionsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const selection = useSelection();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['business-match-suggestions', eventId, statusFilter],
    queryFn: () => businessMatchingApi.getSuggestions(eventId, statusFilter || undefined),
  });

  const filtered = useMemo(() => {
    if (!search) return suggestions;
    const q = search.toLowerCase();
    return suggestions.filter(s => {
      const ex = getExhibitorName(s).toLowerCase();
      const { name, email } = getRegistrationName(s);
      const req = getRequirementLabel(s).toLowerCase();
      return ex.includes(q) || name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || req.includes(q);
    });
  }, [suggestions, search]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: BusinessMatchSuggestionStatus; note?: string }) =>
      businessMatchingApi.updateSuggestion(id, { status, ...(note !== undefined ? { organizer_note: note } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-match-suggestions', eventId] }),
    onError: () => toast.error('Update failed'),
  });

  const meetingMutation = useMutation({
    mutationFn: async (s: BusinessMatchSuggestion) => {
      const exhibitorId = typeof s.exhibitor_id === 'object' ? s.exhibitor_id?.id : s.exhibitor_id;
      const registrationId = typeof s.registration_id === 'object' ? s.registration_id?.id : s.registration_id;
      const requirementId = typeof s.business_requirement_id === 'object' ? s.business_requirement_id?.id : s.business_requirement_id;
      if (!exhibitorId || !registrationId || !requirementId) throw new Error('Missing IDs');
      return businessMatchingApi.createMeetingFromSuggestion(s.id, eventId, exhibitorId, registrationId, requirementId);
    },
    onSuccess: () => {
      toast.success('Meeting created');
      queryClient.invalidateQueries({ queryKey: ['business-match-suggestions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', eventId] });
    },
    onError: () => toast.error('Failed to create meeting'),
  });

  const handleApprove = useCallback((s: BusinessMatchSuggestion) => {
    updateMutation.mutate({ id: s.id, status: 'approved' });
    toast.success('Suggestion approved');
  }, [updateMutation]);

  const handleReject = useCallback((s: BusinessMatchSuggestion) => {
    updateMutation.mutate({ id: s.id, status: 'rejected' });
    toast.success('Suggestion rejected');
  }, [updateMutation]);

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: BusinessMatchSuggestionStatus }) => {
      await Promise.all(ids.map(id => businessMatchingApi.updateSuggestion(id, { status })));
      return { count: ids.length, status };
    },
    onSuccess: ({ count, status }) => {
      toast.success(`${count} suggestion${count !== 1 ? 's' : ''} marked as ${STATUS_MAP[status]?.label ?? status}`);
      selection.clear();
      queryClient.invalidateQueries({ queryKey: ['business-match-suggestions', eventId] });
    },
    onError: () => toast.error('Bulk update failed'),
  });

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-content-primary">AI Business Matching</h1>
            <p className="text-content-tertiary mt-1 text-sm">AI-generated suggestions matching visitors to exhibitor business requirements.</p>
          </div>
        </div>
      </ContainerHeader>

      <Container>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-tertiary" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-44" />
            </div>
            <span className="text-sm text-content-tertiary">
              {isLoading ? '...' : `${filtered.length} suggestion${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:sparkles" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No suggestions found</p>
            <p className="text-content-tertiary text-sm mt-1">AI business match suggestions will appear here once generated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                      checked={filtered.length > 0 && filtered.every(s => selection.selected.has(s.id))}
                      ref={el => { if (el) el.indeterminate = filtered.some(s => selection.selected.has(s.id)) && !filtered.every(s => selection.selected.has(s.id)); }}
                      onChange={() => selection.toggleAll(filtered.map(s => s.id))} />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Visitor</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor / Requirement</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => {
                  const { name, email } = getRegistrationName(s);
                  const exhibitor = getExhibitorName(s);
                  const requirement = getRequirementLabel(s);
                  const statusCfg = STATUS_MAP[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-600' };
                  const isExpanded = expandedId === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 w-10">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600"
                            checked={selection.selected.has(s.id)} onChange={() => selection.toggle(s.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-content-primary">{name}</p>
                          {email && <p className="text-xs text-content-tertiary">{email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-content-primary">{exhibitor}</p>
                          {requirement !== '—' && <p className="text-xs text-content-tertiary mt-0.5">{requirement}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={s.score} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-content-tertiary">
                              <Icon icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'} className="w-3.5 h-3.5" />
                            </button>
                            {s.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline"
                                  className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleReject(s)} disabled={updateMutation.isPending}>
                                  Reject
                                </Button>
                                <Button size="sm" variant="gradient" className="text-xs h-7 px-2"
                                  onClick={() => handleApprove(s)} disabled={updateMutation.isPending}>
                                  Approve
                                </Button>
                              </>
                            )}
                            {s.status === 'approved' && (
                              <Button size="sm" variant="gradient" className="text-xs h-7 px-2 bg-purple-600 hover:bg-purple-700"
                                onClick={() => meetingMutation.mutate(s)} disabled={meetingMutation.isPending}>
                                <Icon icon="lucide:calendar-plus" className="w-3.5 h-3.5 mr-1" />
                                Create Meeting
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && s.ai_reasoning && (
                        <tr>
                          <td colSpan={6} className="px-4 pb-3 pt-0 bg-slate-50/60">
                            <div className="rounded-lg border border-slate-200 bg-white p-3 mt-2">
                              <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">AI Reasoning</p>
                              <p className="text-sm text-content-primary">{s.ai_reasoning}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        actions={[
          {
            label: 'Approve',
            icon: 'lucide:check-circle',
            loading: bulkMutation.isPending,
            onClick: () => bulkMutation.mutate({ ids: selection.selectedArray, status: 'approved' }),
          },
          {
            label: 'Reject',
            icon: 'lucide:x-circle',
            variant: 'danger',
            loading: bulkMutation.isPending,
            onClick: () => bulkMutation.mutate({ ids: selection.selectedArray, status: 'rejected' }),
          },
        ]}
      />
    </div>
  );
}
