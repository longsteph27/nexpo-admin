'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import directus from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface FieldOption {
  label: string;
  value: string;
}

interface FieldTranslation {
  label: string;
  languages_code: string;
  options?: FieldOption[] | null;
}

interface FormAnswer {
  field: string | { id: string; name?: string; type?: string; translations?: FieldTranslation[] };
  value: string;
}

interface CandidateSubmission {
  id: string;
  date_sumitted?: string;
  registration_id?: string | {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    submissions?: {
      answers?: FormAnswer[];
    } | null;
  } | null;
  answers?: FormAnswer[];
}

function extractIdentityFromAnswers(answers: FormAnswer[]): { name: string; email: string; phone: string } {
  let email = '', phone = '';
  const texts: string[] = [];
  for (const ans of answers) {
    const val = ans.value?.trim();
    if (!val) continue;
    if (!email && val.includes('@')) { email = val; continue; }
    if (!phone && /^\+?[\d\s\-().]{9,}$/.test(val)) { phone = val; continue; }
    texts.push(val);
  }
  const name = texts.slice(0, 2).join(' ').trim();
  return { name, email, phone };
}

function parseIdentity(sub: CandidateSubmission): { name: string; email: string; phone: string } {
  const reg = sub.registration_id;
  if (reg && typeof reg === 'object') {
    const name = reg.full_name || '';
    const email = reg.email || '';
    const phone = reg.phone_number || '';
    if (name || email || phone) return { name: name || 'Unnamed', email, phone };

    const regAnswers = reg.submissions?.answers;
    if (regAnswers && regAnswers.length > 0) {
      const { name: n, email: e, phone: p } = extractIdentityFromAnswers(regAnswers);
      if (n || e || p) return { name: n || 'Unnamed', email: e, phone: p };
    }
  }
  return { name: 'Unnamed', email: '', phone: '' };
}

function getFieldLabel(field: FormAnswer['field']): string {
  if (typeof field === 'string') return field;
  const translations = field.translations;
  if (translations && translations.length > 0) {
    const vi = translations.find(t => t.languages_code === 'vi-VN');
    return (vi ?? translations[0]).label || field.name || field.id;
  }
  return field.name || field.id;
}

function formatValue(raw: string): string {
  const trimmed = raw.trim();
  // Only format as number if purely digits AND not phone-like (starts with 0 or too short)
  if (/^\d+$/.test(trimmed) && !trimmed.startsWith('0') && trimmed.length > 5) {
    return Number(trimmed).toLocaleString('vi-VN');
  }
  return raw;
}

function resolveOptionLabels(field: FormAnswer['field'], rawValue: string): string {
  if (!rawValue || typeof field === 'string') return rawValue;
  const translations = field.translations;
  if (!translations || translations.length === 0) return rawValue;
  const vi = translations.find(t => t.languages_code === 'vi-VN');
  const options = (vi ?? translations[0])?.options;
  if (!options || options.length === 0) return rawValue;

  // Build lookup map
  const map = new Map(options.map(o => [o.value, o.label]));

  // Values may be comma-separated (multi-select)
  const parts = rawValue.split(',').map(v => v.trim()).filter(Boolean);
  const resolved = parts.map(v => map.get(v) ?? formatValue(v));
  return resolved.join(', ');
}

function AnswerRow({ answer }: { answer: FormAnswer }) {
  const label = getFieldLabel(answer.field);
  const resolved = resolveOptionLabels(answer.field, answer.value);
  const displayValue = resolved === answer.value ? formatValue(resolved) : resolved;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-content-secondary w-36 flex-shrink-0 pt-0.5 leading-relaxed">{label}</span>
      <span className="text-xs text-content-primary flex-1 min-w-0 break-words whitespace-pre-wrap leading-relaxed">{displayValue || '—'}</span>
    </div>
  );
}

interface BookingForm {
  exhibitorId: string;
  jobId: string;
  scheduledAt: string;
  notes: string;
}

function CandidateSheet({ sub, open, onClose, eventId }: { sub: CandidateSubmission | null; open: boolean; onClose: () => void; eventId: string }) {
  const [booking, setBooking] = useState<BookingForm | null>(null);
  const queryClient = useQueryClient();

  const { data: exhibitors = [] } = useQuery({
    queryKey: ['event-exhibitors', eventId],
    queryFn: async () => {
      // Step 1: get exhibitor IDs for this event
      const eeRes = await directus.request(readItems('exhibitor_events' as any, {
        filter: { event_id: { _eq: Number(eventId) } } as any,
        fields: ['exhibitor_id', 'booth_number'] as any,
        limit: 200,
      }));
      const rows = eeRes as any[];
      const ids = rows.map(r => typeof r.exhibitor_id === 'string' ? r.exhibitor_id : r.exhibitor_id?.id).filter(Boolean);
      const boothMap = new Map(rows.map(r => {
        const id = typeof r.exhibitor_id === 'string' ? r.exhibitor_id : r.exhibitor_id?.id;
        return [id, r.booth_number];
      }));
      if (ids.length === 0) return [];
      // Step 2: get exhibitor details with translations + representative_name fallback
      const exRes = await directus.request(readItems('exhibitors' as any, {
        filter: { id: { _in: ids } } as any,
        fields: ['id', 'representative_name', 'translations.languages_code', 'translations.company_name'] as any,
        limit: 200,
      }));
      return (exRes as any[]).map(ex => ({ ...ex, booth_number: boothMap.get(ex.id) }));
    },
    enabled: !!booking,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['exhibitor-jobs', booking?.exhibitorId, eventId],
    queryFn: async () => {
      const res = await directus.request(readItems('job_requirements' as any, {
        filter: { exhibitor_id: { _eq: booking!.exhibitorId }, event_id: { _eq: Number(eventId) } } as any,
        fields: ['id', 'job_title'] as any,
        limit: 50,
      }));
      return res as { id: string; job_title: string }[];
    },
    enabled: !!booking?.exhibitorId,
  });

  const bookMutation = useMutation({
    mutationFn: async (form: BookingForm) => {
      await directus.request(createItem('meetings' as any, {
        event_id: Number(eventId),
        registration_id: registrationId,
        exhibitor_id: form.exhibitorId,
        job_requirement_id: form.jobId || null,
        scheduled_at: form.scheduledAt || null,
        organizer_note: form.notes || null,
        source: 'manual',
        status: 'pending',
      }));
    },
    onSuccess: () => {
      toast.success('Meeting booked successfully');
      setBooking(null);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: () => toast.error('Failed to book meeting'),
  });

  // Derived values — after all hooks
  if (!sub) return null;

  const { name, email, phone } = parseIdentity(sub);
  const reg = typeof sub.registration_id === 'object' ? sub.registration_id : null;
  const regAnswers = reg?.submissions?.answers ?? [];
  const profileAnswers = sub.answers ?? [];
  const registrationId = reg?.id ?? (typeof sub.registration_id === 'string' ? sub.registration_id : null);

  function getExhibitorLabel(ex: any): string {
    const t = ex.translations?.find((t: any) => t.languages_code === 'vi-VN') ?? ex.translations?.[0];
    const name = t?.company_name || ex.representative_name || `Exhibitor ${String(ex.id).slice(0, 8)}`;
    return ex.booth_number ? `${name} (Booth ${ex.booth_number})` : name;
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-700">{name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <SheetTitle className="text-base">{name}</SheetTitle>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {email && <span className="text-xs text-content-secondary">{email}</span>}
                  {phone && <span className="text-xs text-content-secondary">{phone}</span>}
                </div>
              </div>
            </div>
            {!booking && (
              <button
                onClick={() => setBooking({ exhibitorId: '', jobId: '', scheduledAt: '', notes: '' })}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors flex-shrink-0"
              >
                <Icon icon="lucide:calendar-plus" className="w-3.5 h-3.5" />
                Book Meeting
              </button>
            )}
          </div>
        </SheetHeader>

        {/* Book Meeting form */}
        {booking && (
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Book Interview Meeting</p>
            <div>
              <label className="text-xs text-content-secondary mb-1 block">Exhibitor *</label>
              <select
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
                value={booking.exhibitorId}
                onChange={e => setBooking(b => ({ ...b!, exhibitorId: e.target.value, jobId: '' }))}
              >
                <option value="">— Select exhibitor —</option>
                {exhibitors.map((ex: any) => (
                  <option key={ex.id} value={ex.id}>{getExhibitorLabel(ex)}</option>
                ))}
              </select>
            </div>
            {booking.exhibitorId && (
              <div>
                <label className="text-xs text-content-secondary mb-1 block">Job Requirement (optional)</label>
                <select
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  value={booking.jobId}
                  onChange={e => setBooking(b => ({ ...b!, jobId: e.target.value }))}
                >
                  <option value="">— Select job —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.job_title}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-content-secondary mb-1 block">Scheduled time (optional)</label>
              <input
                type="datetime-local"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
                value={booking.scheduledAt}
                onChange={e => setBooking(b => ({ ...b!, scheduledAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-content-secondary mb-1 block">Notes (optional)</label>
              <textarea
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white resize-none"
                rows={2}
                placeholder="Any notes for the exhibitor..."
                value={booking.notes}
                onChange={e => setBooking(b => ({ ...b!, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBooking(null)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => bookMutation.mutate(booking)}
                disabled={!booking.exhibitorId || bookMutation.isPending}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Registration form answers */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:user-check" className="w-4 h-4 text-content-tertiary" />
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">Registration</span>
          </div>
          {regAnswers.length === 0 ? (
            <p className="text-xs text-content-tertiary italic">No registration answers</p>
          ) : (
            <div className="rounded-lg border border-gray-100 px-3 py-1">
              {regAnswers.map((ans, i) => <AnswerRow key={i} answer={ans} />)}
            </div>
          )}
        </div>

        {/* Matching hiring form answers */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:briefcase" className="w-4 h-4 text-content-tertiary" />
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">Matching Profile</span>
          </div>
          {profileAnswers.length === 0 ? (
            <p className="text-xs text-content-tertiary italic">No profile answers</p>
          ) : (
            <div className="rounded-lg border border-gray-100 px-3 py-1">
              {profileAnswers.map((ans, i) => <AnswerRow key={i} answer={ans} />)}
            </div>
          )}
        </div>

        <p className="text-xs text-content-tertiary mt-5">
          Submitted: {sub.date_sumitted ? new Date(sub.date_sumitted).toLocaleString('vi-VN') : '—'}
        </p>
      </SheetContent>
    </Sheet>
  );
}

export default function CandidateProfilesPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CandidateSubmission | null>(null);

  const { data: candidateForm } = useQuery({
    queryKey: ['candidate-form', eventId],
    queryFn: async () => {
      const res = await directus.request(
        readItems('forms', {
          filter: { event_id: { _eq: Number(eventId) }, linked_module: { _eq: 'candidate_profiles' } } as any,
          fields: ['id', 'translations.title', 'translations.languages_code'],
          limit: 1,
        })
      );
      return (res as any[])[0] ?? null;
    },
    enabled: !!eventId,
  });

  const formId = (candidateForm as any)?.id;

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['candidate-profiles', eventId, formId],
    queryFn: async () => {
      const res = await directus.request(
        readItems('form_submissions', {
          filter: { form: { _eq: formId } } as any,
          fields: [
            'id',
            'date_sumitted',
            'registration_id.id',
            'registration_id.full_name',
            'registration_id.email',
            'registration_id.phone_number',
            'registration_id.submissions.answers.value',
            'registration_id.submissions.answers.field.name',
            'registration_id.submissions.answers.field.translations.label',
            'registration_id.submissions.answers.field.translations.languages_code',
            'registration_id.submissions.answers.field.translations.options',
            'answers.value',
            'answers.field.id',
            'answers.field.name',
            'answers.field.type',
            'answers.field.translations.label',
            'answers.field.translations.languages_code',
            'answers.field.translations.options',
          ] as any,
          sort: ['-date_sumitted'],
          limit: 500,
        })
      );
      return res as CandidateSubmission[];
    },
    enabled: !!formId,
  });

  const filtered = submissions.filter((sub) => {
    if (!search) return true;
    const { name, email, phone } = parseIdentity(sub);
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.includes(q);
  });

  const formTitle =
    (candidateForm as any)?.translations?.find((t: any) => t.languages_code === 'vi-VN')?.title ||
    (candidateForm as any)?.translations?.[0]?.title ||
    'Candidate Profiles';

  return (
    <Container>
      <ContainerHeader
        title="Candidate Profiles"
        description={formId ? `Source: ${formTitle}` : 'No candidate profiles form configured for this event'}
      />

      {!formId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-content-secondary">
          <Icon icon="lucide:file-question" className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No candidate profiles form linked to this event</p>
          <p className="text-xs mt-1">Go to Forms → set Linked Module = Candidate Profiles</p>
        </div>
      )}

      {formId && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
              <Input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <span className="text-xs text-content-secondary">{filtered.length} candidates</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-content-tertiary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-content-secondary">
              <Icon icon="lucide:users" className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No candidates yet</p>
              <p className="text-xs mt-1">Candidates will appear here after they fill the profile form</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary">Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary">Profile fields</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((sub) => {
                    const { name, email, phone } = parseIdentity(sub);
                    const fieldCount = (sub.answers ?? []).filter(a => a.value).length;
                    const hasRegistration = sub.registration_id && typeof sub.registration_id === 'object';
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelected(sub)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-blue-700">
                                {name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-content-primary text-sm">{name}</p>
                              {hasRegistration && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                                  <Icon icon="lucide:link" className="w-3 h-3" />
                                  Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {email && <p className="text-xs text-content-secondary">{email}</p>}
                            {phone && <p className="text-xs text-content-secondary">{phone}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-content-secondary">{fieldCount} fields filled</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-content-secondary">
                          {sub.date_sumitted
                            ? new Date(sub.date_sumitted).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <CandidateSheet
        sub={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        eventId={eventId}
      />
    </Container>
  );
}
