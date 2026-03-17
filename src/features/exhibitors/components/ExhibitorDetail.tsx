'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useExhibitorEvent, useUpdateExhibitorEvent } from '../hooks/useExhibitors';
import type { ExhibitorEventWithDetails } from '../types';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.nexpo.vn';

const FIELD_CLS = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';
const SELECT_CLS = FIELD_CLS + ' appearance-none';
const LABEL_CLS = 'block text-xs font-semibold text-content-secondary mb-1 uppercase tracking-wide';
const VIEW_CLS = 'text-sm text-content-primary';

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className={LABEL_CLS}>{label}</p>
      <p className={VIEW_CLS}>{value ?? <span className="text-content-tertiary">—</span>}</p>
    </div>
  );
}

function getExhibitorName(row: ExhibitorEventWithDetails): string {
  const ex = row.exhibitor_id;
  const translations = ex?.translations || [];
  const en = translations.find((t) => t.languages_code === 'en-US');
  const vi = translations.find((t) => t.languages_code === 'vi-VN');
  return en?.company_name || vi?.company_name || row.nameboard || 'Unnamed';
}

function getLogoUrl(logoField: ExhibitorEventWithDetails['exhibitor_id']['logo']): string | null {
  if (!logoField) return null;
  if (typeof logoField === 'string') return `${DIRECTUS_URL}/assets/${logoField}`;
  if (typeof logoField === 'object' && 'id' in logoField) return `${DIRECTUS_URL}/assets/${logoField.id}`;
  return null;
}

export function ExhibitorDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const exhibitorEventId = params.exhibitorEventId as string;

  const { data: row, isLoading, error, refetch } = useExhibitorEvent(exhibitorEventId);
  const updateMutation = useUpdateExhibitorEvent();

  const [editingBooth, setEditingBooth] = useState(false);
  const [editingBadges, setEditingBadges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [boothForm, setBoothForm] = useState<Partial<ExhibitorEventWithDetails>>({});
  const [badgesForm, setBadgesForm] = useState<Partial<ExhibitorEventWithDetails>>({});
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-content-secondary">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading exhibitor...</span>
        </div>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Icon icon="lucide:alert-circle" className="w-10 h-10 text-red-400 mb-3" />
        <p className="font-medium text-content-primary">Exhibitor not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/events/${eventId}/exhibitors`)}>
          <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>
      </div>
    );
  }

  const name = getExhibitorName(row);
  const logoUrl = getLogoUrl(row.exhibitor_id?.logo);

  // Portal login email = Directus user email (set when account was created)
  const directusUser = row.exhibitor_id?.user_id;
  const directusEmail = typeof directusUser === 'object' && directusUser !== null ? directusUser.email : undefined;
  const loginEmail = directusEmail || row.representative_email || row.exhibitor_id?.representative_email || '';
  const accessCode = row.access_code || '';
  const portalLink = PORTAL_URL;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const savePassword = async () => {
    setSavingPassword(true);
    try {
      await updateMutation.mutateAsync({ id: row.id, payload: { access_code: passwordInput } });
      await refetch();
      setEditingPassword(false);
      toast.success('Password saved');
    } finally {
      setSavingPassword(false);
    }
  };

  const copyAll = () => {
    const msg = [
      `🔗 Portal: ${portalLink}`,
      `📧 Email: ${loginEmail || '(not set)'}`,
      `🔑 Password: ${accessCode || '(not set)'}`,
    ].join('\n');
    navigator.clipboard.writeText(msg).then(() => toast.success('Credentials copied'));
  };

  const startEditBooth = () => {
    setBoothForm({
      booth_number: row.booth_number,
      nameboard: row.nameboard,
      status: row.status,
      representative_name: row.representative_name,
      representative_position: row.representative_position,
      representative_email: row.representative_email,
      representative_phone: row.representative_phone,
      introduction_video: row.introduction_video,
    });
    setEditingBooth(true);
  };

  const startEditBadges = () => {
    setBadgesForm({
      badge_quantity: row.badge_quantity,
      vip_pass_quantity: row.vip_pass_quantity,
      vip_pass_remain: row.vip_pass_remain,
      vip_pass_access_code: row.vip_pass_access_code,
      access_code: row.access_code,
    });
    setEditingBadges(true);
  };

  const saveBooth = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ id: row.id, payload: boothForm });
      await refetch();
      setEditingBooth(false);
    } finally {
      setSaving(false);
    }
  };

  const saveBadges = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ id: row.id, payload: badgesForm });
      await refetch();
      setEditingBadges(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <ContainerHeader className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/events/${eventId}/exhibitors`)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <Icon icon="lucide:arrow-left" className="w-4 h-4 text-content-secondary" />
          </button>
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Icon icon="lucide:store" className="w-5 h-5 text-blue-400" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-content-primary">{name}</h1>
            <p className="text-sm text-content-tertiary">
              Booth {row.booth_number || '—'} · {row.status}
            </p>
          </div>
        </div>
      </ContainerHeader>

      <Container className="space-y-6">
        {/* Booth Information */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-content-primary">Booth Information</h2>
              <p className="text-xs text-content-tertiary mt-0.5">Booth number, status and representative for this event.</p>
            </div>
            {!editingBooth && (
              <Button variant="outline" size="sm" onClick={startEditBooth}>
                <Icon icon="lucide:pencil" className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          {editingBooth ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Booth Number</label>
                  <input className={FIELD_CLS} value={boothForm.booth_number ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, booth_number: e.target.value }))} placeholder="e.g. A01" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Nameboard (display on booth)</label>
                  <input className={FIELD_CLS} value={boothForm.nameboard ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, nameboard: e.target.value }))} placeholder="Display name" />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Status</label>
                <select className={SELECT_CLS} value={boothForm.status ?? 'draft'} onChange={(e) => setBoothForm((f) => ({ ...f, status: e.target.value as any }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Representative Name</label>
                  <input className={FIELD_CLS} value={boothForm.representative_name ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, representative_name: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Position</label>
                  <input className={FIELD_CLS} value={boothForm.representative_position ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, representative_position: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Email</label>
                  <input type="email" className={FIELD_CLS} value={boothForm.representative_email ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, representative_email: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Phone</label>
                  <input className={FIELD_CLS} value={boothForm.representative_phone ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, representative_phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Introduction Video (YouTube/Vimeo URL)</label>
                <input className={FIELD_CLS} value={boothForm.introduction_video ?? ''} onChange={(e) => setBoothForm((f) => ({ ...f, introduction_video: e.target.value }))} placeholder="https://youtube.com/..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="gradient" size="sm" onClick={saveBooth} disabled={saving}>
                  {saving ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Icon icon="lucide:check" className="w-3.5 h-3.5 mr-1.5" />}
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingBooth(false)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Booth Number" value={row.booth_number} />
              <Field label="Nameboard" value={row.nameboard} />
              <Field label="Status" value={row.status} />
              <Field label="Introduction Video" value={row.introduction_video} />
              <Field label="Representative Name" value={row.representative_name || row.exhibitor_id?.representative_name} />
              <Field label="Position" value={row.representative_position || row.exhibitor_id?.representative_position} />
              <Field label="Email" value={row.representative_email || row.exhibitor_id?.representative_email} />
              <Field label="Phone" value={row.representative_phone || row.exhibitor_id?.representative_phone} />
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Badges & Passes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-content-primary">Badges & Passes</h2>
              <p className="text-xs text-content-tertiary mt-0.5">Badge allocation and VIP pass management.</p>
            </div>
            {!editingBadges && (
              <Button variant="outline" size="sm" onClick={startEditBadges}>
                <Icon icon="lucide:pencil" className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>

          {editingBadges ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Badge Quantity</label>
                  <input type="number" min="0" className={FIELD_CLS} value={badgesForm.badge_quantity ?? ''} onChange={(e) => setBadgesForm((f) => ({ ...f, badge_quantity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Access Code</label>
                  <input className={FIELD_CLS} value={badgesForm.access_code ?? ''} onChange={(e) => setBadgesForm((f) => ({ ...f, access_code: e.target.value }))} placeholder="Exhibitor access code" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLS}>VIP Pass Total</label>
                  <input type="number" min="0" className={FIELD_CLS} value={badgesForm.vip_pass_quantity ?? ''} onChange={(e) => setBadgesForm((f) => ({ ...f, vip_pass_quantity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>VIP Pass Remaining</label>
                  <input type="number" min="0" className={FIELD_CLS} value={badgesForm.vip_pass_remain ?? ''} onChange={(e) => setBadgesForm((f) => ({ ...f, vip_pass_remain: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>VIP Access Code</label>
                  <input className={FIELD_CLS} value={badgesForm.vip_pass_access_code ?? ''} onChange={(e) => setBadgesForm((f) => ({ ...f, vip_pass_access_code: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="gradient" size="sm" onClick={saveBadges} disabled={saving}>
                  {saving ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Icon icon="lucide:check" className="w-3.5 h-3.5 mr-1.5" />}
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingBadges(false)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-8 gap-y-4">
              <div className="col-span-1">
                <p className={LABEL_CLS}>Badge Quantity</p>
                <p className="text-2xl font-bold text-content-primary">{row.badge_quantity ?? '—'}</p>
              </div>
              <div>
                <p className={LABEL_CLS}>Access Code</p>
                <p className="font-mono text-sm text-content-primary">{row.access_code ?? '—'}</p>
              </div>
              <div />
              <div>
                <p className={LABEL_CLS}>VIP Pass Total</p>
                <p className="text-2xl font-bold text-content-primary">{row.vip_pass_quantity ?? '—'}</p>
              </div>
              <div>
                <p className={LABEL_CLS}>VIP Remaining</p>
                <p className="text-2xl font-bold text-green-600">{row.vip_pass_remain ?? '—'}</p>
              </div>
              <div>
                <p className={LABEL_CLS}>VIP Access Code</p>
                <p className="font-mono text-sm text-content-primary">{row.vip_pass_access_code ?? '—'}</p>
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Portal Access */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-content-primary">Portal Access</h2>
              <p className="text-xs text-content-tertiary mt-0.5">Login credentials to share with this exhibitor.</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Icon icon="lucide:copy" className="w-3.5 h-3.5 mr-1.5" />
              Copy All
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Portal URL */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Icon icon="lucide:link" className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wide mb-0.5">Portal URL</p>
                <a href={portalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                  {portalLink}
                </a>
              </div>
              <button onClick={() => copy(portalLink, 'Portal URL')} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                <Icon icon="lucide:copy" className="w-3.5 h-3.5 text-content-tertiary" />
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Icon icon="lucide:mail" className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wide mb-0.5">Login Email</p>
                {loginEmail
                  ? <p className="text-sm text-content-primary font-mono">{loginEmail}</p>
                  : <p className="text-sm text-content-tertiary italic">No email set — add representative email above</p>
                }
              </div>
              {loginEmail && (
                <button onClick={() => copy(loginEmail, 'Email')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Icon icon="lucide:copy" className="w-3.5 h-3.5 text-content-tertiary" />
                </button>
              )}
            </div>

            {/* Password / Access Code */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <Icon icon="lucide:key-round" className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wide mb-0.5">Password</p>
                {editingPassword ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') savePassword(); if (e.key === 'Escape') setEditingPassword(false); }}
                      placeholder="Enter password"
                      className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                    <button onClick={savePassword} disabled={savingPassword} className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {savingPassword
                        ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 text-white animate-spin" />
                        : <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <button onClick={() => setEditingPassword(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                      <Icon icon="lucide:x" className="w-3.5 h-3.5 text-content-tertiary" />
                    </button>
                  </div>
                ) : accessCode ? (
                  <p className="text-sm font-mono" style={{ color: '#1A1A1A', letterSpacing: '0.05em' }}>
                    {showPassword ? accessCode : '•'.repeat(Math.min(accessCode.length, 14))}
                  </p>
                ) : (
                  <button
                    onClick={() => { setPasswordInput(''); setEditingPassword(true); }}
                    className="text-sm text-blue-600 hover:underline italic"
                  >
                    + Set password
                  </button>
                )}
              </div>
              {!editingPassword && accessCode && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowPassword((v) => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Icon icon={showPassword ? 'lucide:eye-off' : 'lucide:eye'} className="w-3.5 h-3.5 text-content-tertiary" />
                  </button>
                  <button onClick={() => copy(accessCode, 'Password')} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Icon icon="lucide:copy" className="w-3.5 h-3.5 text-content-tertiary" />
                  </button>
                  <button onClick={() => { setPasswordInput(accessCode); setEditingPassword(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Icon icon="lucide:pencil" className="w-3.5 h-3.5 text-content-tertiary" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick share hint */}
          {(loginEmail || accessCode) && (
            <p className="text-xs text-content-tertiary mt-2 flex items-center gap-1">
              <Icon icon="lucide:info" className="w-3 h-3" />
              Click &ldquo;Copy All&rdquo; to copy a ready-to-send credential block.
            </p>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Company Profile (read-only) */}
        <div>
          <h2 className="font-semibold text-content-primary mb-1">Company Profile</h2>
          <p className="text-xs text-content-tertiary mb-4">Information from the exhibitor&apos;s company profile (read-only here).</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Website" value={row.exhibitor_id?.website} />
            <Field label="Phone" value={row.exhibitor_id?.tel} />
            <Field label="Address" value={row.exhibitor_id?.address} />
            <Field label="Zip Code" value={row.exhibitor_id?.zip_code} />
          </div>
        </div>
      </Container>
    </div>
  );
}
