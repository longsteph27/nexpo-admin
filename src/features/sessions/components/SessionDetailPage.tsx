'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useAgendaEvents } from '@/features/agendas/hooks/useAgendas';
import { useSpeakers, useCreateSpeaker } from '@/features/speakers/hooks/useSpeakers';
import type { Speaker } from '@/features/speakers/types';
import { useCreateSession, useUpdateSession, useDeleteSessions } from '../hooks/useSessions';
import type { Session, SessionPayload } from '../types';

const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' },
  { value: 'break', label: 'Break' },
  { value: 'ceremony', label: 'Ceremony' },
];

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en-US', label: 'English' },
];

function formatTimeInput(value: string): string {
  if (!value) return '';
  if (/^\d{2}:\d{2}/.test(value)) return value.substring(0, 5);
  try {
    const d = new Date(value);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

// ─── SpeakerPickerField ───────────────────────────────────────────────────────

interface SpeakerPickerFieldProps {
  eventId: number;
  speakerId: string;
  speakerName: string;
  speakerTitle: string;
  speakerCompany: string;
  onChange: (data: { speakerId: string; speakerName: string; speakerTitle: string; speakerCompany: string }) => void;
}

function SpeakerAvatar({ speaker }: { speaker: Speaker | null }) {
  const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
  const photoId = speaker?.avatar || speaker?.photo;
  if (photoId) {
    return (
      <img
        src={`${directusUrl}/assets/${photoId}?width=40&height=40&fit=cover`}
        alt={speaker?.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <span className="text-blue-600 text-xs font-bold">
        {speaker?.name?.charAt(0)?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

function SpeakerPickerField({
  eventId,
  speakerId,
  speakerName,
  speakerTitle,
  speakerCompany,
  onChange,
}: SpeakerPickerFieldProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPosition, setCreatePosition] = useState('');
  const [createCompany, setCreateCompany] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createSpeakerMutation = useCreateSpeaker();

  const { data: speakersData } = useSpeakers(eventId, {
    search: searchQuery || undefined,
    limit: 20,
  });
  const speakers = speakersData?.speakers ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Selected speaker object (for display)
  const selectedSpeaker = speakerId
    ? speakers.find((s) => s.id === speakerId) ?? null
    : null;

  const handleSelect = (speaker: Speaker) => {
    onChange({
      speakerId: speaker.id,
      speakerName: speaker.name,
      speakerTitle: speaker.position ?? '',
      speakerCompany: speaker.company ?? '',
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange({ speakerId: '', speakerName: '', speakerTitle: '', speakerCompany: '' });
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setIsCreating(true);
    try {
      const newSpeaker = await createSpeakerMutation.mutateAsync({
        eventId,
        data: {
          name: createName.trim(),
          position: createPosition.trim() || null,
          company: createCompany.trim() || null,
          status: 'published',
          event_id: eventId,
        },
      });
      onChange({
        speakerId: newSpeaker.id,
        speakerName: newSpeaker.name,
        speakerTitle: newSpeaker.position ?? '',
        speakerCompany: newSpeaker.company ?? '',
      });
      setShowCreateForm(false);
      setCreateName('');
      setCreatePosition('');
      setCreateCompany('');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Selected state ──
  if (speakerId && speakerName) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
          <SpeakerAvatar speaker={selectedSpeaker} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-content-primary truncate">{speakerName}</p>
            {(speakerTitle || speakerCompany) && (
              <p className="text-xs text-content-tertiary truncate">
                {[speakerTitle, speakerCompany].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-blue-100 text-content-tertiary hover:text-red-500 transition-colors flex-shrink-0"
            title="Remove speaker"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state: search + create ──
  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* Search input */}
      <div className="relative">
        <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search existing speakers…"
          className="pl-9"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            {speakers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-content-tertiary">
                {searchQuery ? 'No speakers found.' : 'No speakers yet.'}
              </div>
            ) : (
              <ul className="max-h-52 overflow-y-auto py-1">
                {speakers.map((sp) => (
                  <li key={sp.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(sp); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <SpeakerAvatar speaker={sp} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content-primary truncate">{sp.name}</p>
                        {(sp.position || sp.company) && (
                          <p className="text-xs text-content-tertiary truncate">
                            {[sp.position, sp.company].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Create new speaker toggle */}
      {!showCreateForm ? (
        <button
          type="button"
          onClick={() => { setShowCreateForm(true); setShowDropdown(false); }}
          className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Icon icon="lucide:plus-circle" className="w-4 h-4" />
          Create new speaker
        </button>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-content-primary">New Speaker</p>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-content-tertiary hover:text-content-primary"
            >
              <Icon icon="lucide:x" className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <label className="text-xs text-content-secondary mb-1 block">Name <span className="text-red-500">*</span></label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Full name…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-content-secondary mb-1 block">Position / Title</label>
              <Input
                value={createPosition}
                onChange={(e) => setCreatePosition(e.target.value)}
                placeholder="CEO, Founder…"
              />
            </div>
            <div>
              <label className="text-xs text-content-secondary mb-1 block">Company</label>
              <Input
                value={createCompany}
                onChange={(e) => setCreateCompany(e.target.value)}
                placeholder="Company…"
              />
            </div>
          </div>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleCreate}
            disabled={!createName.trim() || isCreating}
          >
            {isCreating ? (
              <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="lucide:user-plus" className="w-3.5 h-3.5 mr-1.5" />
            )}
            Add Speaker
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── SessionDetailPage ────────────────────────────────────────────────────────

interface Props {
  eventId: number;
  session?: Session;
  isNew?: boolean;
}

export default function SessionDetailPage({ eventId, session, isNew }: Props) {
  const router = useRouter();

  const { data: agendasData } = useAgendaEvents(eventId, { limit: 50 });
  const agendas = agendasData?.agendaEvents ?? [];

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSessions();

  const [status, setStatus] = useState(session?.status ?? 'published');
  const [agendaId, setAgendaId] = useState(session?.agenda_id ?? '');
  const [startTime, setStartTime] = useState(session?.start_time ? formatTimeInput(session.start_time) : '');
  const [endTime, setEndTime] = useState(session?.end_time ? formatTimeInput(session.end_time) : '');
  const [location, setLocation] = useState(session?.location ?? '');
  const [sessionType, setSessionType] = useState(session?.session_type ?? '');
  const [speakerId, setSpeakerId] = useState(session?.speaker_id ?? '');
  const [speakerName, setSpeakerName] = useState(session?.speaker_name ?? '');
  const [speakerTitle, setSpeakerTitle] = useState(session?.speaker_title ?? '');
  const [speakerCompany, setSpeakerCompany] = useState(session?.speaker_company ?? '');
  const [translations, setTranslations] = useState<{ languages_code: string; title: string; description: string }[]>(
    LANGUAGES.map((lang) => {
      const existing = session?.translations?.find(
        (t) => t.languages_code === lang.code || t.languages_code?.startsWith(lang.code.split('-')[0])
      );
      return { languages_code: lang.code, title: existing?.title ?? '', description: existing?.description ?? '' };
    })
  );
  const [activeLang, setActiveLang] = useState(LANGUAGES[0].code);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTrans = translations.find((t) => t.languages_code === activeLang)!;
  const updateTrans = (field: 'title' | 'description', value: string) =>
    setTranslations((prev) => prev.map((t) => (t.languages_code === activeLang ? { ...t, [field]: value } : t)));

  const handleSpeakerChange = (data: { speakerId: string; speakerName: string; speakerTitle: string; speakerCompany: string }) => {
    setSpeakerId(data.speakerId);
    setSpeakerName(data.speakerName);
    setSpeakerTitle(data.speakerTitle);
    setSpeakerCompany(data.speakerCompany);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload: SessionPayload = {
        event_id: eventId,
        status,
        agenda_id: agendaId || null,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
        session_type: sessionType || null,
        speaker_id: speakerId || null,
        speaker_name: speakerName || null,
        speaker_title: speakerTitle || null,
        speaker_company: speakerCompany || null,
        translations: {
          create: isNew
            ? translations
                .filter((t) => t.title)
                .map((t) => ({ languages_code: { code: t.languages_code }, title: t.title, description: t.description }))
            : undefined,
          update: !isNew
            ? session?.translations
                ?.filter((existing) => {
                  const local = translations.find(
                    (t) => t.languages_code === existing.languages_code || existing.languages_code?.startsWith(t.languages_code.split('-')[0])
                  );
                  return local?.title !== (existing.title ?? '') || local?.description !== (existing.description ?? '');
                })
                .map((existing) => {
                  const local = translations.find(
                    (t) => t.languages_code === existing.languages_code || existing.languages_code?.startsWith(t.languages_code.split('-')[0])
                  );
                  return { id: existing.id!, title: local?.title ?? '', description: local?.description ?? '' };
                })
            : undefined,
        },
      };

      if (isNew) {
        await createSession.mutateAsync({ eventId, data: payload });
      } else {
        await updateSession.mutateAsync({ id: session!.id, data: payload });
      }
      router.push(`/events/${eventId}/agendas?view=schedule`);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? err?.message ?? 'Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !confirm('Delete this session?')) return;
    await deleteSession.mutateAsync([session.id]);
    router.push(`/events/${eventId}/agendas?view=schedule`);
  };

  const getAgendaTitle = (a: any) =>
    a.translations?.[0]?.title ?? (a.date ? new Date(a.date).toLocaleDateString('vi') : null) ?? `Day ${a.day_number ?? '?'}`;

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <button
            onClick={() => router.push(`/events/${eventId}/agendas`)}
            className="text-xs text-content-tertiary hover:text-content-primary flex items-center gap-1 mb-1"
          >
            <Icon icon="lucide:arrow-left" className="w-3 h-3" /> Back to Agendas
          </button>
          <h1 className="text-xl font-bold text-content-primary">
            {isNew ? 'New Session' : 'Edit Session'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteSession.isPending}>
              <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 mr-1.5 text-red-500" />
              Delete
            </Button>
          )}
          <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="lucide:save" className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </ContainerHeader>

      {error && (
        <div className="mx-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Translations */}
          <Container>
            <div className="flex gap-2 mb-4 border-b border-slate-100 pb-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeLang === lang.code ? 'bg-blue-600 text-white' : 'text-content-secondary hover:bg-slate-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Title</label>
                <Input
                  value={currentTrans.title}
                  onChange={(e) => updateTrans('title', e.target.value)}
                  placeholder="Session title…"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Description</label>
                <textarea
                  value={currentTrans.description}
                  onChange={(e) => updateTrans('description', e.target.value)}
                  placeholder="Session description…"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
            </div>
          </Container>

          {/* Time & Location */}
          <Container>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Time & Location</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Start Time</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">End Time</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Location / Room</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Hall, Stage A…"
                />
              </div>
            </div>
          </Container>

          {/* Speaker */}
          <Container>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Speaker</h3>
            <SpeakerPickerField
              eventId={eventId}
              speakerId={speakerId}
              speakerName={speakerName}
              speakerTitle={speakerTitle}
              speakerCompany={speakerCompany}
              onChange={handleSpeakerChange}
            />
          </Container>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Container>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— None —</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-content-secondary mb-1 block">Agenda Day</label>
                <select
                  value={agendaId}
                  onChange={(e) => setAgendaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">— None —</option>
                  {agendas.map((a) => (
                    <option key={a.id} value={a.id}>{getAgendaTitle(a)}</option>
                  ))}
                </select>
              </div>
            </div>
          </Container>

          {/* Preview */}
          <Container>
            <h3 className="text-sm font-semibold text-content-primary mb-3">Preview</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
              <p className="font-semibold text-content-primary">{currentTrans.title || 'Untitled session'}</p>
              {(startTime || endTime) && (
                <p className="text-content-secondary">
                  <Icon icon="lucide:clock" className="w-3 h-3 inline mr-1" />
                  {startTime}{endTime ? ` – ${endTime}` : ''}
                </p>
              )}
              {location && (
                <p className="text-content-secondary">
                  <Icon icon="lucide:map-pin" className="w-3 h-3 inline mr-1 text-red-400" />
                  {location}
                </p>
              )}
              {sessionType && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                  {sessionType}
                </span>
              )}
              {speakerName && (
                <p className="text-content-secondary">
                  👤 {speakerName}{speakerTitle ? ` · ${speakerTitle}` : ''}
                </p>
              )}
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
