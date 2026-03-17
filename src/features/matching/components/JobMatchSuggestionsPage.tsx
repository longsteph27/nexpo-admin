'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';

type MatchStatus = 'pending' | 'approved' | 'rejected';

interface FormAnswer {
  field: string | { id: string };
  value: string;
}

interface JobMatchSuggestion {
  id: string;
  status: MatchStatus;
  score: number;
  event_id: number;
  exhibitor_id?: string | { id: string; translations?: { languages_code?: string; company_name?: string }[] };
  job_requirement_id?: string | { id: string; job_title?: string };
  registration_id?: string | {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    submissions?: { answers?: FormAnswer[] } | null;
  };
  matched_criteria?: Record<string, unknown>;
  ai_reasoning?: string;
  organizer_note?: string;
  date_created?: string;
}

const STATUS_MAP: Record<MatchStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'text-green-700 bg-green-100' : pct >= 50 ? 'text-yellow-700 bg-yellow-100' : 'text-red-600 bg-red-100';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {pct}%
    </span>
  );
}

function getExhibitorName(s: JobMatchSuggestion): string {
  const ex = s.exhibitor_id;
  if (!ex || typeof ex === 'string') return '—';
  const t = ex.translations?.find((t) => t.languages_code === 'en-US') || ex.translations?.[0];
  return t?.company_name || '—';
}

function getJobTitle(s: JobMatchSuggestion): string {
  const j = s.job_requirement_id;
  if (!j || typeof j === 'string') return '—';
  return j.job_title || '—';
}

function parseVisitorFromAnswers(answers: FormAnswer[]): { name?: string; email?: string; phone?: string } {
  let name: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  const textValues: string[] = [];

  for (const ans of answers) {
    const val = ans.value?.trim();
    if (!val) continue;
    if (!email && val.includes('@')) { email = val; continue; }
    if (!phone && /^\+?[\d\s\-().]{9,}$/.test(val)) { phone = val; continue; }
    textValues.push(val);
  }

  if (textValues.length >= 2) name = `${textValues[0]} ${textValues[1]}`.trim();
  else if (textValues.length === 1) name = textValues[0];

  return { name, email, phone };
}

function getVisitorInfo(s: JobMatchSuggestion): { name: string; email: string; phone: string } {
  const r = s.registration_id;
  if (!r || typeof r === 'string') return { name: '—', email: '', phone: '' };

  let name = r.full_name || '';
  let email = r.email || '';
  let phone = r.phone_number || '';

  if (!name || !email) {
    const answers = r.submissions?.answers || [];
    const parsed = parseVisitorFromAnswers(answers);
    if (!name) name = parsed.name || '';
    if (!email) email = parsed.email || '';
    if (!phone) phone = parsed.phone || '';
  }

  return { name: name || '—', email, phone };
}

function getVisitorName(s: JobMatchSuggestion): string {
  return getVisitorInfo(s).name;
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

const STATUS_FILTERS: { label: string; value: MatchStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

function SuggestionsTable({ suggestions, isPending, onApprove, onReject }: {
  suggestions: JobMatchSuggestion[];
  isPending: boolean;
  onApprove: (s: JobMatchSuggestion) => void;
  onReject: (s: JobMatchSuggestion) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="text-left px-4 py-3 font-semibold text-content-secondary">Visitor</th>
          <th className="text-left px-4 py-3 font-semibold text-content-secondary">Job / Exhibitor</th>
          <th className="text-left px-4 py-3 font-semibold text-content-secondary">Score</th>
          <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
          <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {suggestions.map((s, idx) => {
          const v = getVisitorInfo(s);
          return (
            <motion.tr key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-content-primary">{v.name}</p>
                {v.email && <p className="text-xs text-content-tertiary mt-0.5">{v.email}</p>}
                {v.phone && <p className="text-xs text-content-tertiary">{v.phone}</p>}
              </td>
              <td className="px-4 py-3">
                <p className="text-sm text-content-primary">{getJobTitle(s)}</p>
                <p className="text-xs text-content-tertiary mt-0.5">{getExhibitorName(s)}</p>
              </td>
              <td className="px-4 py-3">
                <ScoreBadge score={s.score} />
                {s.ai_reasoning && <p className="text-xs text-content-tertiary mt-1 max-w-xs line-clamp-2">{s.ai_reasoning}</p>}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[s.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_MAP[s.status]?.label ?? s.status}
                </span>
                {s.organizer_note && <p className="text-xs text-blue-600 mt-1 italic line-clamp-1">{s.organizer_note}</p>}
              </td>
              <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(s.date_created)}</td>
              <td className="px-4 py-3">
                {s.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1 h-7"
                      onClick={() => onReject(s)} disabled={isPending}>Reject</Button>
                    <Button size="sm" variant="gradient" className="text-xs px-2 py-1 h-7"
                      onClick={() => onApprove(s)} disabled={isPending}>Approve</Button>
                  </div>
                )}
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function JobMatchSuggestionsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<MatchStatus | ''>('pending');
  const [isRunning, setIsRunning] = useState(false);
  const [noteModal, setNoteModal] = useState<{ suggestion: JobMatchSuggestion; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [groupByExhibitor, setGroupByExhibitor] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => setCollapsed(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const grouped = useMemo(() => {
    if (!groupByExhibitor) return null;
    const g: Record<string, { id: string; name: string; items: JobMatchSuggestion[] }> = {};
    for (const s of suggestions) {
      const id = typeof s.exhibitor_id === 'object' ? s.exhibitor_id?.id || '__other__' : s.exhibitor_id || '__other__';
      if (!g[id]) g[id] = { id, name: getExhibitorName(s), items: [] };
      g[id].items.push(s);
    }
    return Object.values(g).sort((a, b) => a.name.localeCompare(b.name));
  }, [suggestions, groupByExhibitor]);

  // Fetch suggestions
  const { data: suggestions = [], isLoading, error } = useQuery({
    queryKey: ['job_match_suggestions', eventId, statusFilter],
    queryFn: async () => {
      const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
      if (statusFilter) filter.status = { _eq: statusFilter };
      const result = await directus.request(
        readItems('job_match_suggestions' as any, {
          filter,
          fields: [
            'id', 'status', 'score', 'event_id', 'ai_reasoning', 'matched_criteria',
            'organizer_note', 'date_created',
            'exhibitor_id.id', 'exhibitor_id.translations.languages_code', 'exhibitor_id.translations.company_name',
            'job_requirement_id.id', 'job_requirement_id.job_title',
            'registration_id.id', 'registration_id.full_name', 'registration_id.email', 'registration_id.phone_number',
            'registration_id.submissions.answers.value', 'registration_id.submissions.answers.field',
          ] as any,
          sort: ['-score', '-date_created'] as any,
          limit: 200,
        })
      );
      return result as JobMatchSuggestion[];
    },
  });

  // Update suggestion status
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      return directus.request(updateItem('job_match_suggestions' as any, id, payload));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_match_suggestions', eventId] });
    },
  });

  const handleApprove = async (suggestion: JobMatchSuggestion, organizerNote?: string) => {
    await updateMutation.mutateAsync({
      id: suggestion.id,
      payload: { status: 'approved', organizer_note: organizerNote || null, date_reviewed: new Date().toISOString() },
    });
    // Auto-create a pending meeting for the exhibitor to confirm
    try {
      await directus.request(createItem('meetings' as any, {
        event_id: suggestion.event_id,
        registration_id: typeof suggestion.registration_id === 'object' ? suggestion.registration_id?.id : suggestion.registration_id,
        exhibitor_id: typeof suggestion.exhibitor_id === 'object' ? suggestion.exhibitor_id?.id : suggestion.exhibitor_id,
        job_requirement_id: typeof suggestion.job_requirement_id === 'object' ? suggestion.job_requirement_id?.id : suggestion.job_requirement_id,
        match_suggestion_id: suggestion.id,
        source: 'ai_matching',
        status: 'pending',
        organizer_note: organizerNote || null,
      }));
      toast.success('Suggestion approved — pending meeting created for exhibitor');
    } catch {
      toast.success('Suggestion approved (meeting creation failed — check permissions)');
    }
    setNoteModal(null);
    setNote('');
  };

  const handleReject = async (suggestion: JobMatchSuggestion, organizerNote?: string) => {
    await updateMutation.mutateAsync({
      id: suggestion.id,
      payload: { status: 'rejected', organizer_note: organizerNote || null, date_reviewed: new Date().toISOString() },
    });
    toast.success('Suggestion rejected');
    setNoteModal(null);
    setNote('');
  };

  const handleRunMatching = useCallback(async () => {
    setIsRunning(true);
    try {
      const resp = await fetch('/api/matching/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }
      const result = await resp.json();
      toast.success(`Matching complete! ${result.suggestions_created} new suggestions created.`);
      queryClient.invalidateQueries({ queryKey: ['job_match_suggestions', eventId] });
    } catch (err: any) {
      toast.error(`Matching failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [eventId, queryClient]);

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-content-primary">AI Job Matching</h1>
            <p className="text-content-tertiary mt-1 text-sm">
              Review AI-generated match suggestions between visitors and job requirements.
            </p>
          </div>
          <Button
            variant="gradient"
            onClick={handleRunMatching}
            disabled={isRunning}
          >
            {isRunning
              ? <><Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />Running...</>
              : <><Icon icon="lucide:sparkles" className="w-4 h-4 mr-2" />Run AI Matching</>
            }
          </Button>
        </div>
      </ContainerHeader>

      <Container>
        {/* Status filters + group toggle */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-content-tertiary ml-1">
              {isLoading ? '...' : `${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <button
            onClick={() => setGroupByExhibitor(g => !g)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupByExhibitor ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-content-secondary hover:bg-slate-50'}`}
          >
            <Icon icon="lucide:building-2" className="w-3.5 h-3.5" />
            Group by Exhibitor
          </button>
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
              <p className="text-content-secondary text-sm">Failed to load suggestions</p>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:sparkles" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No suggestions yet</p>
            <p className="text-content-tertiary text-sm mt-1">Click "Run AI Matching" to generate suggestions</p>
          </div>
        ) : grouped ? (
          <div className="space-y-3">
            {grouped.map(group => (
              <div key={group.id} className="rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => toggleCollapse(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:building-2" className="w-4 h-4 text-content-tertiary" />
                    <span className="font-semibold text-content-primary text-sm">{group.name}</span>
                    <span className="text-xs text-content-tertiary bg-white border border-slate-200 rounded-full px-2 py-0.5">{group.items.length}</span>
                  </div>
                  <Icon icon={collapsed.has(group.id) ? 'lucide:chevron-right' : 'lucide:chevron-down'} className="w-4 h-4 text-content-tertiary" />
                </button>
                {!collapsed.has(group.id) && (
                  <SuggestionsTable
                    suggestions={group.items}
                    isPending={updateMutation.isPending}
                    onApprove={(s) => { setNoteModal({ suggestion: s, action: 'approve' }); setNote(''); }}
                    onReject={(s) => { setNoteModal({ suggestion: s, action: 'reject' }); setNote(''); }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <SuggestionsTable
              suggestions={suggestions}
              isPending={updateMutation.isPending}
              onApprove={(s) => { setNoteModal({ suggestion: s, action: 'approve' }); setNote(''); }}
              onReject={(s) => { setNoteModal({ suggestion: s, action: 'reject' }); setNote(''); }}
            />
          </div>
        )}
      </Container>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
          >
            <h3 className="font-semibold text-content-primary mb-1">
              {noteModal.action === 'approve' ? 'Approve Match Suggestion' : 'Reject Match Suggestion'}
            </h3>
            <p className="text-sm text-content-tertiary mb-4">
              {noteModal.action === 'approve'
                ? 'Optionally add a note before approving.'
                : 'Optionally explain why this suggestion is rejected.'}
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
                    ? handleApprove(noteModal.suggestion, note)
                    : handleReject(noteModal.suggestion, note)
                }
                disabled={updateMutation.isPending}
              >
                {noteModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
