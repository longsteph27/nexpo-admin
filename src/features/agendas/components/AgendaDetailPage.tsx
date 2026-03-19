'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  useCreateAgendaEvent,
  useUpdateAgendaEvent,
  useAgendaTracks,
  useAgendaSpeakerJunctions,
} from '../hooks/useAgendas';
import { useSpeakers } from '@/features/speakers/hooks/useSpeakers';
import type { Agenda, AgendaPayload } from '../types';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'vi-VN', label: 'Tiếng Việt' },
];

const SESSION_TYPES = [
  { value: 'talk', label: '💬 Talk' },
  { value: 'panel', label: '👥 Panel' },
  { value: 'workshop', label: '🛠 Workshop' },
  { value: 'keynote', label: '🎤 Keynote' },
  { value: 'break', label: '☕ Break' },
  { value: 'networking', label: '🤝 Networking' },
  { value: 'other', label: '✨ Other' },
];

interface AgendaDetailPageProps {
  eventId: number;
  agenda?: Agenda;
  isNew?: boolean;
}

interface TranslationForm {
  id?: number;
  languages_code: string;
  title: string;
  description: string;
}

interface SpeakerEntry {
  speakerId: string;
  name: string;
  photo?: string | null;
  avatar?: string | null;
  junctionId?: number;
}

export default function AgendaDetailPage({ eventId, agenda, isNew }: AgendaDetailPageProps) {
  const router = useRouter();
  const createMutation = useCreateAgendaEvent();
  const updateMutation = useUpdateAgendaEvent();

  const { data: tracks = [] } = useAgendaTracks(eventId);
  const { data: junctions = [] } = useAgendaSpeakerJunctions(!isNew ? agenda?.id : undefined);
  const { data: speakersData } = useSpeakers(eventId, { limit: 200 });
  const allSpeakers = speakersData?.speakers ?? [];

  // ── Form state ────────────────────────────────────────────────────────────
  const [status, setStatus] = useState(agenda?.status ?? 'draft');
  const [date, setDate] = useState(agenda?.date?.substring(0, 10) ?? '');
  const [dayNumber, setDayNumber] = useState<string>(agenda?.day_number?.toString() ?? '');
  const [startTime, setStartTime] = useState(agenda?.start_time?.substring(0, 5) ?? '');
  const [endTime, setEndTime] = useState(agenda?.end_time?.substring(0, 5) ?? '');
  const [location, setLocation] = useState(agenda?.location ?? '');
  const [sessionType, setSessionType] = useState(agenda?.session_type ?? '');
  const [isFeatured, setIsFeatured] = useState(agenda?.is_featured ?? false);
  const [trackId, setTrackId] = useState<string>(
    typeof agenda?.track_id === 'string' ? agenda.track_id : (agenda?.track_id as any)?.id ?? ''
  );
  const [translations, setTranslations] = useState<TranslationForm[]>(() => {
    if (agenda?.translations?.length) {
      return agenda.translations.map((t) => ({
        id: t.id,
        languages_code: typeof t.languages_code === 'string' ? t.languages_code : (t.languages_code as any)?.code ?? 'en-US',
        title: t.title ?? '',
        description: t.description ?? '',
      }));
    }
    return [{ languages_code: 'en-US', title: '', description: '' }];
  });

  // ── Speakers state ────────────────────────────────────────────────────────
  const [speakers, setSpeakers] = useState<SpeakerEntry[]>(() =>
    // M2M shape: agendas_speakers junction rows { speakers_id: { id, name, photo, avatar } }
    (agenda?.speakers as any[] | undefined)?.map((s: any) => {
      const sp = s.speakers_id ?? s; // handle both nested and flat
      return {
        speakerId: sp.id,
        name: sp.name || sp.translations?.[0]?.name || 'Unknown',
        photo: sp.photo,
        avatar: sp.avatar,
      };
    }) ?? []
  );
  const [speakerSearch, setSpeakerSearch] = useState('');

  // Merge junction IDs once loaded
  useMemo(() => {
    if (junctions.length > 0) {
      setSpeakers((prev) =>
        prev.map((s) => {
          const j = junctions.find((j) => String(j.speakers_id) === String(s.speakerId));
          return j ? { ...s, junctionId: j.id } : s;
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junctions]);

  const filteredSpeakerOptions = useMemo(() => {
    const selectedIds = new Set(speakers.map((s) => s.speakerId));
    return allSpeakers.filter(
      (s) =>
        !selectedIds.has(s.id) &&
        (!speakerSearch ||
          s.name?.toLowerCase().includes(speakerSearch.toLowerCase()) ||
          s.translations?.[0]?.name?.toLowerCase().includes(speakerSearch.toLowerCase()))
    );
  }, [allSpeakers, speakers, speakerSearch]);

  const addSpeaker = (s: (typeof allSpeakers)[0]) => {
    setSpeakers((prev) => [
      ...prev,
      {
        speakerId: s.id,
        name: s.translations?.[0]?.name || s.name || 'Unknown',
        photo: s.photo,
        avatar: s.avatar,
      },
    ]);
    setSpeakerSearch('');
  };

  const removeSpeaker = (speakerId: string) => {
    setSpeakers((prev) => prev.filter((s) => s.speakerId !== speakerId));
  };

  // ── Translations helpers ──────────────────────────────────────────────────
  const addTranslation = () => {
    const usedCodes = translations.map((t) => t.languages_code);
    const available = LANGUAGES.find((l) => !usedCodes.includes(l.code));
    if (!available) return;
    setTranslations((prev) => [...prev, { languages_code: available.code, title: '', description: '' }]);
  };

  const removeTranslation = (index: number) => {
    if (translations.length <= 1) return;
    setTranslations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTranslation = (index: number, field: keyof TranslationForm, value: string) => {
    setTranslations((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    const existing = translations.filter((t) => t.id !== undefined);
    const newTrans = translations.filter((t) => t.id === undefined);

    // Compute speaker diff
    const originalIds = new Set((agenda?.speakers as any[] | undefined)?.map((s: any) => String(s.id)) ?? []);
    const currentIds = new Set(speakers.map((s) => String(s.speakerId)));

    const toAdd = speakers.filter((s) => !originalIds.has(String(s.speakerId)));
    const toRemove = speakers
      .filter((s) => !currentIds.has(String(s.speakerId)))
      .map((s) => s.junctionId)
      .filter(Boolean) as number[];
    // Also remove junctions for original speakers that are no longer selected
    const removedJunctionIds = junctions
      .filter((j) => !currentIds.has(String(j.speakers_id)))
      .map((j) => j.id);

    const payload: AgendaPayload = {
      status,
      date: date || null,
      day_number: dayNumber ? Number(dayNumber) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      session_type: sessionType || null,
      is_featured: isFeatured,
      track_id: trackId || null,
      event_id: eventId,
      translations: {
        create: newTrans.map((t) => ({ languages_code: { code: t.languages_code }, title: t.title, description: t.description })),
        update: existing.map((t) => ({ id: t.id!, title: t.title, description: t.description })),
      },
      speakers: {
        create: toAdd.map((s) => ({ speakers_id: { id: s.speakerId } })),
        delete: removedJunctionIds,
      },
    };

    if (isNew) {
      createMutation.mutate(
        { eventId, data: payload },
        {
          onSuccess: () => { toast.success('Agenda created'); router.push(`/events/${eventId}/agendas`); },
          onError: (e: any) => toast.error(e?.errors?.[0]?.message ?? 'Failed to create agenda'),
        }
      );
    } else if (agenda) {
      updateMutation.mutate(
        { id: agenda.id, data: payload },
        {
          onSuccess: () => toast.success('Agenda updated'),
          onError: (e: any) => toast.error(e?.errors?.[0]?.message ?? 'Failed to update agenda'),
        }
      );
    }
  };

  const selectedTrack = tracks.find((t) => t.id === trackId);

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/events/${eventId}/agendas`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-content-tertiary transition-colors"
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              {isNew ? 'New Session' : translations[0]?.title || 'Edit Session'}
            </h1>
            <p className="text-content-tertiary mt-0.5 text-sm">
              {isNew ? 'Create a new agenda session' : 'Update session details'}
            </p>
          </div>
        </div>
        <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
          <Icon icon={isSaving ? 'lucide:loader-2' : 'lucide:save'} className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </ContainerHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Main ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Schedule Details */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-4">Schedule</h2>
            <div className="space-y-4">
              {/* Day + Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Day Number</label>
                  <Input
                    type="number"
                    min="1"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(e.target.value)}
                    placeholder="e.g. 1"
                  />
                  <p className="text-xs text-content-tertiary mt-1">Which day of the event (1, 2, 3…)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              {/* Time range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Start Time</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">End Time</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              {/* Track + Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Track</label>
                  <div className="relative">
                    <select
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                    >
                      <option value="">— No track —</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.translations?.[0]?.name || t.default_name}
                        </option>
                      ))}
                    </select>
                    {selectedTrack?.track_color && (
                      <span
                        className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedTrack.track_color }}
                      />
                    )}
                    <Icon icon="lucide:chevron-down" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Location / Room</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Main Hall" />
                </div>
              </div>

              {/* Session Type + Featured */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Select type —</option>
                    {SESSION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button
                    onClick={() => setIsFeatured((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${isFeatured ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-content-primary">Featured session ⭐</span>
                </div>
              </div>
            </div>
          </Container>

          {/* Speakers */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-4">Speakers</h2>

            {/* Current speakers */}
            {speakers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {speakers.map((s) => (
                  <div
                    key={s.speakerId}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200"
                  >
                    {(s.avatar || s.photo) ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${s.avatar ?? s.photo}?width=32&height=32&fit=cover`}
                        alt={s.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {s.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-content-primary">{s.name}</span>
                    <button
                      onClick={() => removeSpeaker(s.speakerId)}
                      className="text-content-tertiary hover:text-red-500 transition-colors ml-0.5"
                    >
                      <Icon icon="lucide:x" className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search to add */}
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                placeholder="Search speakers to add…"
                value={speakerSearch}
                onChange={(e) => setSpeakerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {speakerSearch && filteredSpeakerOptions.length > 0 && (
              <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-sm divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {filteredSpeakerOptions.slice(0, 10).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addSpeaker(s)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                  >
                    {(s.avatar || s.photo) ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${s.avatar ?? s.photo}?width=32&height=32&fit=cover`}
                        alt={s.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-content-primary">{s.translations?.[0]?.name || s.name}</p>
                      {s.position && <p className="text-xs text-content-tertiary">{s.position}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {speakerSearch && filteredSpeakerOptions.length === 0 && (
              <p className="text-xs text-content-tertiary mt-2 px-1">No speakers found. Add them in the Speakers section first.</p>
            )}
          </Container>

          {/* Translations */}
          <Container>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content-primary">Content</h2>
              {translations.length < LANGUAGES.length && (
                <button
                  onClick={addTranslation}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Icon icon="lucide:plus" className="w-3 h-3" />
                  Add language
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {translations.map((t, i) => {
                const lang = LANGUAGES.find((l) => l.code === t.languages_code);
                return (
                  <div key={i} className="py-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                        {lang?.label ?? t.languages_code}
                      </span>
                      {translations.length > 1 && (
                        <button onClick={() => removeTranslation(i)} className="text-content-tertiary hover:text-red-500 transition-colors">
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Title</label>
                      <Input
                        value={t.title}
                        onChange={(e) => updateTranslation(i, 'title', e.target.value)}
                        placeholder="Session title…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Description</label>
                      <textarea
                        value={t.description}
                        onChange={(e) => updateTranslation(i, 'description', e.target.value)}
                        placeholder="Session description…"
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-3">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Container>

          {/* Schedule summary card */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-3">Summary</h2>
            <div className="space-y-2">
              {dayNumber && (
                <div className="flex items-center gap-2 text-xs text-content-secondary">
                  <Icon icon="lucide:calendar" className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" />
                  <span>Day {dayNumber}{date ? ` — ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              )}
              {(startTime || endTime) && (
                <div className="flex items-center gap-2 text-xs text-content-secondary">
                  <Icon icon="lucide:clock" className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" />
                  <span>{startTime}{endTime ? ` – ${endTime}` : ''}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2 text-xs text-content-secondary">
                  <Icon icon="lucide:map-pin" className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" />
                  <span>{location}</span>
                </div>
              )}
              {selectedTrack && (
                <div className="flex items-center gap-2 text-xs text-content-secondary">
                  <span
                    className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: selectedTrack.track_color || '#1E40EA' }}
                  />
                  <span>{selectedTrack.translations?.[0]?.name || selectedTrack.default_name}</span>
                </div>
              )}
              {!dayNumber && !startTime && !location && !selectedTrack && (
                <p className="text-xs text-content-tertiary italic">Fill in schedule details to see summary</p>
              )}
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
