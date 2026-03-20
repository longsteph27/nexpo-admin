'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { registrationsApi } from '@/features/registrations/api';

// ─── Helpers (mirrors CandidateProfilesPage) ──────────────────────────────────

function getFieldLabel(field: any): string {
  if (!field || typeof field === 'string') return field ?? '';
  const translations = field.translations;
  if (translations?.length > 0) {
    const vi = translations.find((t: any) => t.languages_code === 'vi-VN');
    return (vi ?? translations[0]).label || field.name || field.id;
  }
  return field.name || field.id || '';
}

function formatValue(raw: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed) && !trimmed.startsWith('0') && trimmed.length > 5) {
    return Number(trimmed).toLocaleString('vi-VN');
  }
  return raw;
}

function resolveOptionLabels(field: any, rawValue: string): string {
  if (!rawValue || !field || typeof field === 'string') return rawValue;
  const translations = field.translations;
  if (!translations?.length) return rawValue;
  const vi = translations.find((t: any) => t.languages_code === 'vi-VN');
  const options = (vi ?? translations[0])?.options;
  if (!options?.length) return rawValue;
  const map = new Map(options.map((o: any) => [o.value, o.label]));
  return rawValue.split(',').map((v: string) => (map.get(v.trim()) as string) ?? formatValue(v.trim())).join(', ');
}

function AnswerRow({ answer }: { answer: any }) {
  const label = getFieldLabel(answer.field);
  const resolved = resolveOptionLabels(answer.field, answer.value);
  const displayValue = resolved === answer.value ? formatValue(resolved) : resolved;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-content-secondary w-36 flex-shrink-0 pt-0.5 leading-relaxed uppercase">{label}</span>
      <span className="text-xs text-content-primary flex-1 min-w-0 break-words whitespace-pre-wrap leading-relaxed">
        {displayValue || '—'}
      </span>
    </div>
  );
}

function extractFromAnswers(answers: any[]): { name: string; email: string; phone: string } {
  let email = '', phone = '';
  const texts: string[] = [];
  for (const ans of answers) {
    const val = (ans.value as string)?.trim();
    if (!val) continue;
    if (!email && val.includes('@')) { email = val; continue; }
    if (!phone && /^\+?[\d\s\-().]{9,}$/.test(val)) { phone = val; continue; }
    texts.push(val);
  }
  return { name: texts.slice(0, 2).join(' ').trim(), email, phone };
}

// ─── Sheet ─────────────────────────────────────────────────────────────────────

export function VisitorDetailSheet({
  registrationId,
  open,
  onClose,
}: {
  registrationId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const params = useParams();
  const eventId = params.id as string;

  const { data: result, isLoading } = useQuery({
    queryKey: ['registration_detail', registrationId],
    queryFn: () => registrationsApi.getRegistration(registrationId!),
    enabled: !!registrationId && open,
  });

  const reg = result?.data;
  const answers = reg?.submissions?.answers ?? [];
  const parsed = extractFromAnswers(answers as any[]);
  const name = reg?.full_name || parsed.name || '—';
  const email = reg?.email || parsed.email || '';
  const phone = reg?.phone_number || parsed.phone || '';

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        {/* Header — always rendered so SheetTitle is always present (accessibility) */}
        <SheetHeader className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-700">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <SheetTitle className="text-base">{name}</SheetTitle>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {email && <span className="text-xs text-content-secondary">{email}</span>}
                  {phone && <span className="text-xs text-content-secondary">{phone}</span>}
                </div>
              </div>
            </div>
            {reg && (
              <a
                href={`/events/${eventId}/registrations/${reg.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors flex-shrink-0"
              >
                <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
                Full Profile
              </a>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : !reg ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:user-x" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-secondary text-sm">No registration data found</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="lucide:user-check" className="w-4 h-4 text-content-tertiary" />
                <span className="text-xs font-semibold text-content-secondary uppercase tracking-wide">Registration</span>
              </div>
              {answers.length === 0 ? (
                <p className="text-xs text-content-tertiary italic">No registration answers</p>
              ) : (
                <div className="rounded-lg border border-gray-100 px-3 py-1">
                  {(answers as any[]).map((ans, i) => (
                    <AnswerRow key={ans.id ?? i} answer={ans} />
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-content-tertiary">
              Registered: {reg.date_created ? new Date(reg.date_created).toLocaleString('vi-VN') : '—'}
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
