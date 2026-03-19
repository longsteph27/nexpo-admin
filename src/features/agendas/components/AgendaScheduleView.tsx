'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAllAgendaEvents, useAgendaTracks } from '../hooks/useAgendas';
import { useAllSessionsForEvent } from '@/features/sessions/hooks/useSessions';
import type { Agenda, AgendaTrack } from '../types';
import type { Session } from '@/features/sessions/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABEL: Record<string, string> = {
  keynote: 'Keynote', talk: 'Talk', panel: 'Panel',
  workshop: 'Workshop', break: 'Break', networking: 'Networking',
  ceremony: 'Ceremony', other: 'Other',
};

const TRACK_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16',
];

const DEFAULT_TRACK_COLOR = '#64748B';

// ─── Internal Types ───────────────────────────────────────────────────────────

interface FlatSession {
  id: string;
  source: 'session' | 'agenda';
  dayKey: string;
  trackKey: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  speakers: string[];
  type: string;
  description: string;
  featured: boolean;
}

interface Day {
  key: string;
  date?: string;
  dayNumber?: number | null;
  label: string;
  shortDate: string;
}

interface Track {
  id: string;
  name: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtTime(value?: string | null): string {
  if (!value) return '';
  if (/^\d{2}:\d{2}/.test(value)) return value.substring(0, 5);
  try {
    const d = new Date(value);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function pickTitle(translations?: { languages_code?: string; title?: string }[]) {
  if (!translations?.length) return null;
  return (
    translations.find((t) => t.languages_code?.startsWith('vi'))?.title ??
    translations.find((t) => t.languages_code?.startsWith('en'))?.title ??
    translations[0]?.title ??
    null
  );
}

function pickDescription(translations?: { languages_code?: string; description?: string | null }[]) {
  if (!translations?.length) return '';
  return (
    translations.find((t) => t.languages_code?.startsWith('vi'))?.description ??
    translations.find((t) => t.languages_code?.startsWith('en'))?.description ??
    translations[0]?.description ??
    ''
  ) || '';
}

// ─── Schedule Builder ─────────────────────────────────────────────────────────

function buildSchedule(
  agendas: Agenda[],
  sessions: Session[],
  agendaTracks: AgendaTrack[]
): { days: Day[]; tracks: Track[]; sessions: FlatSession[] } {
  // agenda tracks by UUID
  const tracksById = new Map<string, Track>(
    agendaTracks.map((t, i) => [t.id, {
      id: t.id,
      name: t.translations?.[0]?.name || t.default_name,
      color: t.track_color || TRACK_PALETTE[i % TRACK_PALETTE.length],
    }])
  );

  // agendaById for resolving sessions → date
  const agendaById = new Map<string, Agenda>(agendas.map((a) => [a.id, a]));

  // Build days from agendas
  const dayMap = new Map<string, Day>();
  for (const a of agendas) {
    const key = a.date ?? (a.day_number != null ? `day-${a.day_number}` : 'no-day');
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        key,
        date: a.date ?? undefined,
        dayNumber: a.day_number ?? null,
        label: a.day_number ? `Day ${a.day_number}` : 'Program',
        shortDate: a.date ? fmtDate(a.date) : (a.day_number ? `Day ${a.day_number}` : '—'),
      });
    }
  }
  const days = Array.from(dayMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  // Location → color assignment
  const locationColorMap = new Map<string, string>();
  let colorIdx = 0;
  function getLocationColor(loc: string): string {
    if (!locationColorMap.has(loc)) {
      locationColorMap.set(loc, TRACK_PALETTE[colorIdx++ % TRACK_PALETTE.length]);
    }
    return locationColorMap.get(loc)!;
  }

  // Determine if we use sessions collection or fall back to agenda-level data
  const useSessions = sessions.length > 0;

  const flatSessions: FlatSession[] = [];

  if (useSessions) {
    // Primary: sessions from sessions collection
    for (const s of sessions) {
      const parent = s.agenda_id ? agendaById.get(s.agenda_id) : null;
      const dayKey = parent?.date
        ?? (parent?.day_number != null ? `day-${parent.day_number}` : 'no-day');
      const loc = s.location || 'General';
      const trackKey = loc;

      flatSessions.push({
        id: s.id,
        source: 'session',
        dayKey,
        trackKey,
        title: pickTitle(s.translations) || s.session_type || 'Session',
        startTime: fmtTime(s.start_time),
        endTime: fmtTime(s.end_time),
        location: loc,
        speakers: s.speaker_name ? [s.speaker_name] : [],
        type: s.session_type || 'other',
        description: pickDescription(s.translations),
        featured: false,
      });
    }
  } else {
    // Fallback: use agenda-level sessions (legacy)
    for (const a of agendas) {
      const hasSessionData = Boolean(a.start_time) || Boolean(a.end_time) || Boolean(a.session_type);
      if (!hasSessionData) continue;

      const rawTrackId = typeof a.track_id === 'string' ? a.track_id : (a.track_id as any)?.id ?? null;
      const resolvedTrack = rawTrackId ? tracksById.get(rawTrackId) : null;
      const trackKey = resolvedTrack?.id ?? a.location ?? 'General';
      const dayKey = a.date ?? (a.day_number != null ? `day-${a.day_number}` : 'no-day');
      const speakerNames = (a.speakers as any[] | undefined)
        ?.map((s: any) => s.speakers_id?.name || s.name || '').filter(Boolean) ?? [];

      flatSessions.push({
        id: a.id,
        source: 'agenda',
        dayKey,
        trackKey,
        title: pickTitle(a.translations) ?? 'Untitled',
        startTime: fmtTime(a.start_time),
        endTime: fmtTime(a.end_time),
        location: a.location ?? '',
        speakers: speakerNames,
        type: a.session_type ?? 'other',
        description: pickDescription(a.translations),
        featured: a.is_featured ?? false,
      });
    }
  }

  // Build tracks from used trackKeys
  const usedKeys = new Set(flatSessions.map((s) => s.trackKey));
  const tracks: Track[] = [];
  for (const key of usedKeys) {
    // Prefer agenda_tracks definition, fall back to location-based
    const byId = tracksById.get(key);
    if (byId) {
      tracks.push(byId);
    } else {
      tracks.push({ id: key, name: key, color: getLocationColor(key) });
    }
  }
  if (tracks.length === 0) {
    tracks.push({ id: 'General', name: 'General', color: DEFAULT_TRACK_COLOR });
  }

  return { days, tracks, sessions: flatSessions };
}

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  track,
  expanded,
  onToggle,
  onEdit,
}: {
  session: FlatSession;
  track: Track;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow text-left w-full"
      style={{ borderLeftWidth: '3px', borderLeftColor: track.color }}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(session.startTime || session.endTime) && (
            <span className="text-xs font-medium text-content-secondary whitespace-nowrap">
              {session.startTime}{session.endTime ? ` - ${session.endTime}` : ''}
            </span>
          )}
          {session.type && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ color: track.color }}>
              {SESSION_TYPE_LABEL[session.type] ?? session.type}
            </span>
          )}
        </div>
        {session.featured && <span className="text-yellow-500 text-xs">⭐</span>}
      </div>

      <h4 className="font-semibold text-sm text-content-primary mb-1 leading-snug">{session.title}</h4>

      {session.location && (
        <div className="flex items-center gap-1 text-xs text-content-tertiary mb-1">
          <Icon icon="lucide:map-pin" className="w-3 h-3 text-red-400 flex-shrink-0" />
          {session.location}
        </div>
      )}

      {session.speakers.length > 0 && (
        <div className="text-xs text-content-secondary">
          👤 {session.speakers.join(', ')}
        </div>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {session.description && (
            <p className="text-xs text-content-secondary mb-3 leading-relaxed">{session.description}</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-content-secondary hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Icon icon="lucide:pencil" className="w-3 h-3" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgendaScheduleView({ eventId }: { eventId: number }) {
  const router = useRouter();
  const { data: agendas = [], isLoading: loadingAgendas, error: agendaError } = useAllAgendaEvents(eventId);
  const { data: sessions = [], isLoading: loadingSessions } = useAllSessionsForEvent(eventId);
  const { data: agendaTracks = [], isLoading: loadingTracks } = useAgendaTracks(eventId);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const schedule = useMemo(
    () => buildSchedule(agendas, sessions, agendaTracks),
    [agendas, sessions, agendaTracks]
  );

  const activeDayKey = selectedDayKey ?? schedule.days[0]?.key ?? null;
  const activeTracks = selectedTracks.length > 0 ? selectedTracks : schedule.tracks.map((t) => t.id);

  const filteredSessions = useMemo(
    () => schedule.sessions.filter((s) => s.dayKey === activeDayKey && activeTracks.includes(s.trackKey)),
    [schedule.sessions, activeDayKey, activeTracks]
  );

  const timeSlots = useMemo(
    () => [...new Set(filteredSessions.map((s) => s.startTime))].sort(),
    [filteredSessions]
  );

  const getTrack = (id: string): Track =>
    schedule.tracks.find((t) => t.id === id) ?? { id, name: id, color: DEFAULT_TRACK_COLOR };

  const toggleTrack = (id: string) => {
    setSelectedTracks((prev) => {
      const all = schedule.tracks.map((t) => t.id);
      const current = prev.length > 0 ? prev : all;
      if (current.length === 1 && current[0] === id) return current;
      return current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
    });
  };

  const isLoading = loadingAgendas || loadingSessions || loadingTracks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-content-secondary text-sm">Loading schedule…</span>
      </div>
    );
  }

  if (agendaError) {
    return (
      <div className="flex items-center justify-center h-48">
        <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-content-secondary ml-2">Failed to load schedule</p>
      </div>
    );
  }

  if (schedule.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <Icon icon="lucide:calendar-x" className="w-10 h-10 text-content-tertiary mb-3" />
        <p className="text-content-primary font-medium">No agenda days defined yet.</p>
        <p className="text-content-tertiary text-sm mt-1">Create agenda items with a Date or Day Number to see the schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Day tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Day:</span>
          <div className="flex gap-1 flex-wrap">
            {schedule.days.map((day) => {
              const isActive = activeDayKey === day.key;
              return (
                <button
                  key={day.key}
                  onClick={() => { setSelectedDayKey(day.key); setSelectedTracks([]); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center min-w-[52px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-content-secondary hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {day.date && (
                    <span className={`block text-[10px] ${isActive ? 'opacity-80' : 'text-content-tertiary'}`}>
                      {day.shortDate}
                    </span>
                  )}
                  <span>{day.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Tracks:</span>
          {schedule.tracks.map((track) => {
            const active = activeTracks.includes(track.id);
            return (
              <button
                key={track.id}
                onClick={() => toggleTrack(track.id)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all border"
                style={{
                  backgroundColor: active ? track.color : 'white',
                  borderColor: active ? track.color : '#e2e8f0',
                  color: active ? '#fff' : track.color,
                }}
              >
                {track.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
          {(['timeline', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                viewMode === mode ? 'bg-slate-100 text-content-primary' : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Session count badge */}
      <div className="flex items-center gap-2 text-xs text-content-tertiary">
        <Icon icon="lucide:calendar" className="w-3.5 h-3.5" />
        <span>{filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} for this day</span>
        {sessions.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
            {sessions.length} total sessions
          </span>
        )}
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div style={{ minWidth: `${80 + activeTracks.length * 220}px` }}>
            {/* Track headers */}
            <div
              className="grid border-b border-slate-200 sticky top-0 z-10 bg-white"
              style={{ gridTemplateColumns: `80px repeat(${activeTracks.length}, minmax(200px, 1fr))` }}
            >
              <div className="px-3 py-2.5 text-xs font-semibold text-content-tertiary border-r border-slate-200">Time</div>
              {activeTracks.map((trackId) => {
                const track = getTrack(trackId);
                return (
                  <div
                    key={trackId}
                    className="px-3 py-2.5 text-sm font-bold text-white text-center"
                    style={{ backgroundColor: track.color }}
                  >
                    {track.name}
                  </div>
                );
              })}
            </div>

            {/* Time rows */}
            {timeSlots.length === 0 ? (
              <div className="py-16 text-center">
                <Icon icon="lucide:clock" className="w-8 h-8 text-content-tertiary mx-auto mb-2" />
                <p className="text-sm text-content-tertiary">No sessions with start times for this day.</p>
              </div>
            ) : (
              timeSlots.map((time, rowIdx) => (
                <div
                  key={time}
                  className={`grid ${rowIdx > 0 ? 'border-t border-slate-100' : ''}`}
                  style={{ gridTemplateColumns: `80px repeat(${activeTracks.length}, minmax(200px, 1fr))` }}
                >
                  <div className="px-3 py-3 text-sm font-medium text-content-secondary border-r border-slate-100 bg-slate-50 flex items-start">
                    {time || '—'}
                  </div>
                  {activeTracks.map((trackId) => {
                    const track = getTrack(trackId);
                    const sessionsAtTime = filteredSessions.filter(
                      (s) => s.startTime === time && s.trackKey === trackId
                    );
                    return (
                      <div key={trackId} className="p-2 border-l border-slate-100 min-h-[80px] space-y-2">
                        {sessionsAtTime.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            track={track}
                            expanded={expandedId === session.id}
                            onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
                            onEdit={() =>
                              router.push(
                                session.source === 'session'
                                  ? `/events/${eventId}/sessions/${session.id}`
                                  : `/events/${eventId}/agendas/${session.id}`
                              )
                            }
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center">
              <Icon icon="lucide:calendar-x" className="w-8 h-8 text-content-tertiary mx-auto mb-2" />
              <p className="text-sm text-content-tertiary">No sessions for the selected day/track.</p>
            </div>
          ) : (
            [...filteredSessions]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  track={getTrack(session.trackKey)}
                  expanded={expandedId === session.id}
                  onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  onEdit={() =>
                    router.push(
                      session.source === 'session'
                        ? `/events/${eventId}/sessions/${session.id}`
                        : `/events/${eventId}/agendas/${session.id}`
                    )
                  }
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}
