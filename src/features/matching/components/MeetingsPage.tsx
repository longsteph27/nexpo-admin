'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';
import type { Meeting, MeetingStatus } from '../types';

const STATUS_CONFIG: Record<MeetingStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-600' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', cls: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
  no_show:   { label: 'No Show',   cls: 'bg-orange-100 text-orange-600' },
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getRegistrationName(reg: Meeting['registration_id']): { name: string; email: string } {
  if (!reg || typeof reg === 'string') return { name: '—', email: '' };
  if (reg.full_name) return { name: reg.full_name, email: reg.email || '' };
  const answers = reg.submissions?.answers || [];
  const texts: string[] = [];
  let email = '';
  for (const a of answers) {
    const val = a.value?.trim();
    if (!val) continue;
    if (!email && val.includes('@')) { email = val; continue; }
    if (/^\+?[\d\s\-().]{9,}$/.test(val)) continue;
    texts.push(val);
  }
  return { name: texts.slice(0, 2).join(' ').trim() || '—', email };
}

function getExhibitorName(ex: Meeting['exhibitor_id']): string {
  if (!ex || typeof ex === 'string') return '—';
  const t = ex.translations?.find(t => t.languages_code === 'vi-VN') || ex.translations?.[0];
  return t?.company_name || '—';
}

function getJobTitle(job: Meeting['job_requirement_id']): string {
  if (!job || typeof job === 'string') return '—';
  return job.job_title || '—';
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ─── Calendar View ─────────────────────────────────────────────────────────────

function CalendarView({ meetings, onStatusChange, isPending }: {
  meetings: Meeting[];
  onStatusChange: (m: Meeting, s: MeetingStatus) => void;
  isPending: boolean;
}) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDOW = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    for (const m of meetings) {
      if (!m.scheduled_at) continue;
      const d = new Date(m.scheduled_at);
      const k = dayKey(d);
      if (!map[k]) map[k] = [];
      map[k].push(m);
    }
    return map;
  }, [meetings]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDOW; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const selectedMeetings = selected ? (byDay[selected] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-content-secondary">
          <Icon icon="lucide:chevron-left" className="w-4 h-4" />
        </button>
        <span className="font-semibold text-content-primary">{MONTH_NAMES[mon]} {year}</span>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-content-secondary">
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
        {DAY_NAMES.map(d => (
          <div key={d} className="bg-slate-50 text-center text-xs font-semibold text-content-tertiary py-2">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="bg-white min-h-[72px]" />;
          const k = `${year}-${mon}-${day}`;
          const dayMeetings = byDay[k] ?? [];
          const isSelected = selected === k;
          const isToday = today.getDate() === day && today.getMonth() === mon && today.getFullYear() === year;
          return (
            <div key={k} onClick={() => setSelected(isSelected ? null : k)}
              className={`bg-white min-h-[72px] p-1.5 cursor-pointer hover:bg-blue-50/50 transition-colors ${isSelected ? 'ring-1 ring-inset ring-blue-400 bg-blue-50/30' : ''}`}>
              <span className={`text-xs font-medium w-6 h-6 inline-flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-content-secondary'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayMeetings.slice(0, 3).map(m => {
                  const { name } = getRegistrationName(m.registration_id);
                  const cfg = STATUS_CONFIG[m.status as MeetingStatus] ?? { cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={m.id} className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${cfg.cls}`}>
                      {name}
                    </div>
                  );
                })}
                {dayMeetings.length > 3 && (
                  <div className="text-[10px] text-content-tertiary px-1">+{dayMeetings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <p className="text-sm font-semibold text-content-primary">
              {selectedMeetings.length === 0
                ? 'No meetings scheduled'
                : `${selectedMeetings.length} meeting${selectedMeetings.length !== 1 ? 's' : ''}`}
              {' — '}
              {new Date(year, mon, parseInt(selected.split('-')[2])).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {selectedMeetings.length > 0 && (
            <div className="divide-y divide-slate-100">
              {selectedMeetings.map(m => {
                const { name, email } = getRegistrationName(m.registration_id);
                const exhibitor = getExhibitorName(m.exhibitor_id);
                const job = getJobTitle(m.job_requirement_id);
                const cfg = STATUS_CONFIG[m.status as MeetingStatus] ?? { label: m.status, cls: 'bg-gray-100 text-gray-500' };
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-content-primary">{name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      {email && <p className="text-xs text-content-tertiary">{email}</p>}
                      <p className="text-xs text-content-secondary mt-0.5">{exhibitor}{job !== '—' ? ` — ${job}` : ''}</p>
                      {m.scheduled_at && (
                        <p className="text-xs text-content-tertiary mt-0.5">
                          <Icon icon="lucide:clock" className="w-3 h-3 inline mr-1" />
                          {new Date(m.scheduled_at).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {m.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); onStatusChange(m, 'cancelled'); }} disabled={isPending}>Cancel</Button>
                          <Button size="sm" variant="gradient" className="text-xs h-7 px-2"
                            onClick={(e) => { e.stopPropagation(); onStatusChange(m, 'confirmed'); }} disabled={isPending}>Confirm</Button>
                        </>
                      )}
                      {(m.status === 'confirmed' || m.status === 'scheduled') && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                          onClick={(e) => { e.stopPropagation(); onStatusChange(m, 'completed'); }} disabled={isPending}>Complete</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Unscheduled meetings note */}
      {meetings.filter(m => !m.scheduled_at).length > 0 && (
        <p className="text-xs text-content-tertiary text-center">
          {meetings.filter(m => !m.scheduled_at).length} meeting{meetings.filter(m => !m.scheduled_at).length !== 1 ? 's' : ''} without a scheduled time are not shown in calendar view.
        </p>
      )}
    </div>
  );
}

// ─── Grouped List View ─────────────────────────────────────────────────────────

function GroupedList({ meetings, onStatusChange, isPending }: {
  meetings: Meeting[];
  onStatusChange: (m: Meeting, s: MeetingStatus) => void;
  isPending: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const g: Record<string, { id: string; name: string; meetings: Meeting[] }> = {};
    for (const m of meetings) {
      const id = typeof m.exhibitor_id === 'object' ? m.exhibitor_id?.id || '__other__' : m.exhibitor_id || '__other__';
      if (!g[id]) g[id] = { id, name: getExhibitorName(m.exhibitor_id), meetings: [] };
      g[id].meetings.push(m);
    }
    return Object.values(g).sort((a, b) => a.name.localeCompare(b.name));
  }, [meetings]);

  const toggle = (id: string) => setCollapsed(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="space-y-3">
      {grouped.map(group => (
        <div key={group.id} className="rounded-xl border border-slate-200 overflow-hidden">
          <button onClick={() => toggle(group.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:building-2" className="w-4 h-4 text-content-tertiary" />
              <span className="font-semibold text-content-primary text-sm">{group.name}</span>
              <span className="text-xs text-content-tertiary bg-white border border-slate-200 rounded-full px-2 py-0.5">
                {group.meetings.length}
              </span>
            </div>
            <Icon icon={collapsed.has(group.id) ? 'lucide:chevron-right' : 'lucide:chevron-down'} className="w-4 h-4 text-content-tertiary" />
          </button>
          {!collapsed.has(group.id) && (
            <MeetingsTable meetings={group.meetings} onStatusChange={onStatusChange} isPending={isPending} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Meetings Table ─────────────────────────────────────────────────────────────

function MeetingsTable({ meetings, onStatusChange, isPending }: {
  meetings: Meeting[];
  onStatusChange: (m: Meeting, s: MeetingStatus) => void;
  isPending: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs">
            <th className="text-left px-4 py-3 font-semibold text-content-secondary">Candidate</th>
            <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor / Job</th>
            <th className="text-left px-4 py-3 font-semibold text-content-secondary">Scheduled</th>
            <th className="text-left px-4 py-3 font-semibold text-content-secondary">Source</th>
            <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {meetings.map(m => {
            const { name, email } = getRegistrationName(m.registration_id);
            const exhibitor = getExhibitorName(m.exhibitor_id);
            const job = getJobTitle(m.job_requirement_id);
            const cfg = STATUS_CONFIG[m.status as MeetingStatus] ?? { label: m.status, cls: 'bg-gray-100 text-gray-500' };
            return (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-content-primary">{name}</p>
                  {email && <p className="text-xs text-content-tertiary mt-0.5">{email}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-content-primary">{exhibitor}</p>
                  {job !== '—' && <p className="text-xs text-content-tertiary mt-0.5">{job}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-content-secondary">
                  {m.scheduled_at
                    ? new Date(m.scheduled_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                    : <span className="text-content-tertiary italic">Not set</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${m.source === 'ai_matching' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon icon={m.source === 'ai_matching' ? 'lucide:sparkles' : 'lucide:pencil'} className="w-3 h-3" />
                    {m.source === 'ai_matching' ? 'AI' : 'Manual'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                  {m.exhibitor_note && <p className="text-xs text-content-tertiary mt-1 italic line-clamp-1">{m.exhibitor_note}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {m.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => onStatusChange(m, 'cancelled')} disabled={isPending}>Cancel</Button>
                        <Button size="sm" variant="gradient" className="text-xs h-7 px-2"
                          onClick={() => onStatusChange(m, 'confirmed')} disabled={isPending}>Confirm</Button>
                      </>
                    )}
                    {(m.status === 'confirmed' || m.status === 'scheduled') && (
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                        onClick={() => onStatusChange(m, 'completed')} disabled={isPending}>Mark Complete</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'calendar';

export function MeetingsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupByExhibitor, setGroupByExhibitor] = useState(false);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings', eventId, statusFilter],
    queryFn: async () => {
      const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
      if (statusFilter) filter.status = { _eq: statusFilter };
      const res = await directus.request(
        readItems('meetings' as any, {
          filter,
          fields: [
            'id', 'status', 'source', 'scheduled_at', 'organizer_note', 'exhibitor_note', 'date_created',
            'registration_id.id', 'registration_id.full_name', 'registration_id.email', 'registration_id.phone_number',
            'registration_id.submissions.answers.value', 'registration_id.submissions.answers.field.name',
            'exhibitor_id.id', 'exhibitor_id.translations.languages_code', 'exhibitor_id.translations.company_name',
            'job_requirement_id.id', 'job_requirement_id.job_title',
          ] as any,
          sort: ['-date_created'] as any,
          limit: 300,
        })
      );
      return res as Meeting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Meeting> }) =>
      directus.request(updateItem('meetings' as any, id, payload)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['meetings', eventId] }); },
  });

  const handleStatusChange = async (meeting: Meeting, status: MeetingStatus) => {
    await updateMutation.mutateAsync({ id: meeting.id, payload: { status } });
    toast.success(`Meeting marked as ${STATUS_CONFIG[status]?.label ?? status}`);
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Meetings</h1>
            <p className="text-content-tertiary mt-1 text-sm">All interview meetings between candidates and exhibitors.</p>
          </div>
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden shrink-0">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-content-secondary hover:bg-slate-50'}`}>
              <Icon icon="lucide:list" className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-content-secondary hover:bg-slate-50'}`}>
              <Icon icon="lucide:calendar" className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
        </div>
      </ContainerHeader>

      <Container>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
            <span className="text-sm text-content-tertiary ml-1">
              {isLoading ? '...' : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {viewMode === 'list' && (
            <button onClick={() => setGroupByExhibitor(g => !g)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupByExhibitor ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-content-secondary hover:bg-slate-50'}`}>
              <Icon icon="lucide:building-2" className="w-3.5 h-3.5" />
              Group by Exhibitor
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" /><span>Loading...</span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:calendar-x" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No meetings found</p>
            <p className="text-content-tertiary text-sm mt-1">Meetings are created when AI suggestions are approved or booked manually.</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView meetings={meetings} onStatusChange={handleStatusChange} isPending={updateMutation.isPending} />
        ) : groupByExhibitor ? (
          <GroupedList meetings={meetings} onStatusChange={handleStatusChange} isPending={updateMutation.isPending} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <MeetingsTable meetings={meetings} onStatusChange={handleStatusChange} isPending={updateMutation.isPending} />
          </div>
        )}
      </Container>
    </div>
  );
}
