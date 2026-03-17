'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import directus from '@/lib/directus';
import { readItems, createItem, createUser } from '@directus/sdk';
import { useAuthStore } from '@/store/auth';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
const FIELD = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';
const SELECT = FIELD + ' appearance-none';
const LABEL = 'block text-xs font-semibold text-content-secondary mb-1 uppercase tracking-wide';

interface ExhibitorResult {
  id: string;
  representative_email?: string;
  representative_name?: string;
  logo?: { id: string } | string | null;
  translations?: { languages_code?: string; company_name?: string }[];
}

interface IndustryCat {
  id: string;
  translations?: { languages_code?: string; category?: string }[];
}

interface Country { id: string; code: string; name: string; }

function getLogoUrl(logo: ExhibitorResult['logo']): string | null {
  if (!logo) return null;
  if (typeof logo === 'string') return `${DIRECTUS_URL}/assets/${logo}`;
  if (typeof logo === 'object' && 'id' in logo) return `${DIRECTUS_URL}/assets/${logo.id}`;
  return null;
}

function getCompanyName(ex: ExhibitorResult): string {
  const en = ex.translations?.find((t) => t.languages_code === 'en-US');
  const vi = ex.translations?.find((t) => t.languages_code === 'vi-VN');
  return en?.company_name || vi?.company_name || '(no name)';
}

function getCatName(cat: IndustryCat): string {
  const en = cat.translations?.find((t) => t.languages_code === 'en-US');
  const vi = cat.translations?.find((t) => t.languages_code === 'vi-VN');
  return en?.category || vi?.category || '(no name)';
}

const EXHIBITOR_ROLE_ID = '4930ee6f-7ce4-40ac-a88c-db4a7c6af5aa';

const EMPTY_COMPANY = {
  company_name_en: '', company_name_vi: '',
  email: '', website: '', tel: '', fax: '', zip_code: '', address: '',
  rep_name: '', rep_position: '', rep_email: '', rep_phone: '',
  industry_id: '', country_id: '',
  portal_email: '',
};

const EMPTY_BOOTH = {
  booth_number: '', nameboard: '', badge_quantity: '', access_code: '',
  introduction_video: '', status: 'published',
  rep_name: '', rep_position: '', rep_email: '', rep_phone: '',
  vip_pass_quantity: '', vip_pass_remain: '', vip_pass_access_code: '',
};

export default function InviteExhibitorPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const eventId = parseInt(params.id as string);
  const { selectedTenant } = useAuthStore();
  const tenantId = selectedTenant?.id;

  const [step, setStep] = useState<'search' | 'new' | 'booth'>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExhibitorResult | null>(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);
  const [boothForm, setBoothForm] = useState(EMPTY_BOOTH);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Dropdown data
  const { data: industries = [] } = useQuery<IndustryCat[]>({
    queryKey: ['industry_categories_invite'],
    queryFn: async () => {
      const data = await directus.request(readItems('industry_categories' as any, {
        fields: ['id', 'translations.languages_code', 'translations.category'] as any,
        filter: { status: { _eq: 'published' } } as any,
        sort: ['sort' as any, 'date_created' as any],
        limit: 200,
      }));
      return data as unknown as IndustryCat[];
    },
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries_invite'],
    queryFn: async () => {
      const data = await directus.request(readItems('countries' as any, {
        fields: ['id', 'code', 'name'] as any,
        sort: ['name' as any],
        limit: 500,
      }));
      return data as unknown as Country[];
    },
  });

  // Load all exhibitors for this tenant once, filter client-side
  const { data: allExhibitors = [] } = useQuery<ExhibitorResult[]>({
    queryKey: ['exhibitors_tenant', tenantId],
    queryFn: async () => {
      const data = await directus.request(readItems('exhibitors' as any, {
        filter: { tenant_id: { _eq: tenantId } } as any,
        fields: ['id', 'representative_email', 'representative_name', 'logo.id', 'translations.languages_code', 'translations.company_name'] as any,
        limit: 500,
      }));
      return data as unknown as ExhibitorResult[];
    },
    enabled: !!tenantId,
  });

  const results = query.trim().length < 2 ? [] : allExhibitors.filter((ex) => {
    const q = query.toLowerCase();
    const nameMatch = ex.translations?.some((t) => t.company_name?.toLowerCase().includes(q));
    const emailMatch = ex.representative_email?.toLowerCase().includes(q);
    const repMatch = ex.representative_name?.toLowerCase().includes(q);
    return nameMatch || emailMatch || repMatch;
  });

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      let exhibitorId: string;

      if (selected) {
        exhibitorId = selected.id;
      } else {
        if (!companyForm.company_name_en && !companyForm.company_name_vi) {
          setError('Company name (EN or VI) is required.');
          setSaving(false);
          return;
        }
        const translations: Record<string, unknown>[] = [];
        if (companyForm.company_name_en) translations.push({ languages_code: 'en-US', company_name: companyForm.company_name_en });
        if (companyForm.company_name_vi) translations.push({ languages_code: 'vi-VN', company_name: companyForm.company_name_vi });

        const payload: Record<string, unknown> = {
          id: crypto.randomUUID(),
          status: 'published',
          translations: { create: translations },
        };
        if (tenantId) payload.tenant_id = tenantId;
        if (companyForm.email) payload.representative_email = companyForm.email;
        if (companyForm.rep_name) payload.representative_name = companyForm.rep_name;
        if (companyForm.rep_phone) payload.representative_phone = companyForm.rep_phone;
        if (companyForm.rep_position) payload.representative_position = companyForm.rep_position;
        if (companyForm.website) payload.website = companyForm.website;
        if (companyForm.tel) payload.tel = companyForm.tel;
        if (companyForm.fax) payload.fax = companyForm.fax;
        if (companyForm.zip_code) payload.zip_code = companyForm.zip_code;
        if (companyForm.address) payload.address = companyForm.address;
        if (companyForm.industry_id) payload.industry_id = companyForm.industry_id;
        if (companyForm.country_id) payload.country = companyForm.country_id;

        // Create portal user account if email provided
        if (companyForm.portal_email) {
          const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16) + 'Aa1!';
          const newUser = await directus.request(createUser({
            email: companyForm.portal_email,
            password: tempPassword,
            role: EXHIBITOR_ROLE_ID,
            status: 'active',
          } as any));
          payload.user_id = (newUser as any).id;
          // Store credentials to display to admin after save
          setCreatedCredentials({ email: companyForm.portal_email, password: tempPassword });
        }

        const created = await directus.request(createItem('exhibitors' as any, payload as any));
        exhibitorId = (created as any).id;
      }

      const eventPayload: Record<string, unknown> = {
        id: crypto.randomUUID(),
        exhibitor_id: exhibitorId,
        event_id: eventId,
        status: boothForm.status,
      };
      if (boothForm.booth_number) eventPayload.booth_number = boothForm.booth_number;
      if (boothForm.nameboard) eventPayload.nameboard = boothForm.nameboard;
      if (boothForm.badge_quantity) eventPayload.badge_quantity = parseInt(boothForm.badge_quantity);
      if (boothForm.access_code) eventPayload.access_code = boothForm.access_code;
      if (boothForm.introduction_video) eventPayload.introduction_video = boothForm.introduction_video;
      if (boothForm.rep_name) eventPayload.representative_name = boothForm.rep_name;
      if (boothForm.rep_position) eventPayload.representative_position = boothForm.rep_position;
      if (boothForm.rep_email) eventPayload.representative_email = boothForm.rep_email;
      if (boothForm.rep_phone) eventPayload.representative_phone = boothForm.rep_phone;
      if (boothForm.vip_pass_quantity) eventPayload.vip_pass_quantity = parseInt(boothForm.vip_pass_quantity);
      if (boothForm.vip_pass_remain) eventPayload.vip_pass_remain = parseInt(boothForm.vip_pass_remain);
      if (boothForm.vip_pass_access_code) eventPayload.vip_pass_access_code = boothForm.vip_pass_access_code;

      await directus.request(createItem('exhibitor_events' as any, eventPayload as any));
      await qc.invalidateQueries({ queryKey: ['exhibitor_events', eventId] });
      // If portal credentials were created, show them before redirecting
      if (!companyForm.portal_email) {
        router.push(`/events/${eventId}/exhibitors`);
      }
      // else: stay on page to show credentials modal
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || err?.message || 'Failed to add exhibitor.');
    } finally {
      setSaving(false);
    }
  };

  const cf = companyForm;
  const setCF = (patch: Partial<typeof EMPTY_COMPANY>) => setCompanyForm((f) => ({ ...f, ...patch }));
  const bf = boothForm;
  const setBF = (patch: Partial<typeof EMPTY_BOOTH>) => setBoothForm((f) => ({ ...f, ...patch }));

  return (
    <div className="max-w-2xl space-y-4">
      <ContainerHeader className="flex items-center gap-3">
        <button onClick={() => router.push(`/events/${eventId}/exhibitors`)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <Icon icon="lucide:arrow-left" className="w-4 h-4 text-content-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-content-primary">Add Exhibitor</h1>
          <p className="text-sm text-content-tertiary mt-0.5">Search existing companies or create a new one.</p>
        </div>
      </ContainerHeader>

      <Container className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center gap-2 text-xs">
          {(['search', 'new'] as const).some((s) => s === step) ? (
            <span className="text-blue-600 font-semibold">1. Find Company</span>
          ) : (
            <span className="text-content-tertiary line-through">1. Find Company</span>
          )}
          <Icon icon="lucide:chevron-right" className="w-3 h-3 text-content-tertiary" />
          <span className={step === 'booth' ? 'text-blue-600 font-semibold' : 'text-content-tertiary'}>2. Booth Info</span>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Search ── */}
          {step === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {!tenantId && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Icon icon="lucide:alert-triangle" className="w-4 h-4 flex-shrink-0" />
                  No tenant selected. Please select a tenant from the sidebar before searching.
                </div>
              )}
              <div>
                <label className={LABEL}>Search by company name</label>
                <div className="relative">
                  <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                  <Input placeholder={tenantId ? 'Start typing...' : 'Select a tenant first'} disabled={!tenantId} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" autoFocus={!!tenantId} />
                </div>
              </div>

              {results.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {results.map((ex) => {
                    const logoUrl = getLogoUrl(ex.logo);
                    return (
                      <button key={ex.id} onClick={() => { setSelected(ex); setStep('booth'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                        {logoUrl
                          ? <img src={logoUrl} className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-white flex-shrink-0" />
                          : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Icon icon="lucide:store" className="w-4 h-4 text-slate-400" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-content-primary text-sm">{getCompanyName(ex)}</p>
                          <p className="text-xs text-content-tertiary truncate">{ex.representative_email || ex.representative_name || ''}</p>
                        </div>
                        <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {query.length >= 2 && results.length === 0 && (
                <p className="text-sm text-content-tertiary text-center py-3">No companies found for &quot;{query}&quot;.</p>
              )}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-content-tertiary mb-3">Can&apos;t find the company?</p>
                <Button variant="outline" size="sm" onClick={() => { setSelected(null); setStep('new'); }}>
                  <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />Create New Company
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: New Company ── */}
          {step === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Company Name */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Company Name</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>English <span className="text-red-400">*</span></label>
                    <input className={FIELD} placeholder="Acme Corp" value={cf.company_name_en} onChange={(e) => setCF({ company_name_en: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label className={LABEL}>Vietnamese</label>
                    <input className={FIELD} placeholder="Công ty Acme" value={cf.company_name_vi} onChange={(e) => setCF({ company_name_vi: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Industry & Country */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Classification</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Industry</label>
                    <select className={SELECT} value={cf.industry_id} onChange={(e) => setCF({ industry_id: e.target.value })}>
                      <option value="">— Select industry —</option>
                      {industries.map((cat) => (
                        <option key={cat.id} value={cat.id}>{getCatName(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Country</label>
                    <select className={SELECT} value={cf.country_id} onChange={(e) => setCF({ country_id: e.target.value })}>
                      <option value="">— Select country —</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact & Online */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Contact & Online</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Website</label>
                    <input className={FIELD} placeholder="https://company.com" value={cf.website} onChange={(e) => setCF({ website: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Tel</label>
                    <input className={FIELD} placeholder="+84 28 xxxx xxxx" value={cf.tel} onChange={(e) => setCF({ tel: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Fax</label>
                    <input className={FIELD} placeholder="+84 28 xxxx xxxx" value={cf.fax} onChange={(e) => setCF({ fax: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Zip Code</label>
                    <input className={FIELD} placeholder="700000" value={cf.zip_code} onChange={(e) => setCF({ zip_code: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Address</label>
                    <input className={FIELD} placeholder="123 Street, City" value={cf.address} onChange={(e) => setCF({ address: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Representative */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Company Representative</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Name</label>
                    <input className={FIELD} placeholder="Nguyen Van A" value={cf.rep_name} onChange={(e) => setCF({ rep_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Position</label>
                    <input className={FIELD} placeholder="CEO" value={cf.rep_position} onChange={(e) => setCF({ rep_position: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input type="email" className={FIELD} placeholder="rep@company.com" value={cf.email} onChange={(e) => setCF({ email: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input className={FIELD} placeholder="+84 9xx xxx xxx" value={cf.rep_phone} onChange={(e) => setCF({ rep_phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Portal Access */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-1">Portal Access</p>
                <p className="text-xs text-content-tertiary mb-3">Create a login account for the exhibitor portal. Leave blank to skip.</p>
                <div>
                  <label className={LABEL}>Portal Login Email</label>
                  <input type="email" className={FIELD} placeholder="exhibitor@company.com" value={cf.portal_email} onChange={(e) => setCF({ portal_email: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="gradient" size="sm" disabled={!cf.company_name_en && !cf.company_name_vi} onClick={() => setStep('booth')}>
                  Next <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 ml-1.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep('search')}>Back</Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Booth Info ── */}
          {step === 'booth' && (
            <motion.div key="booth" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Company recap */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                {selected ? (
                  <>
                    {getLogoUrl(selected.logo)
                      ? <img src={getLogoUrl(selected.logo)!} className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-white flex-shrink-0" />
                      : <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center flex-shrink-0"><Icon icon="lucide:store" className="w-4 h-4 text-blue-400" /></div>
                    }
                    <div>
                      <p className="text-sm font-medium text-content-primary">{getCompanyName(selected)}</p>
                      <p className="text-xs text-content-tertiary">Existing company</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center flex-shrink-0"><Icon icon="lucide:store" className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <p className="text-sm font-medium text-content-primary">{cf.company_name_en || cf.company_name_vi}</p>
                      <p className="text-xs text-content-tertiary">New company</p>
                    </div>
                  </>
                )}
                <button onClick={() => setStep(selected ? 'search' : 'new')} className="ml-auto text-xs text-blue-600 hover:underline">Change</button>
              </div>

              {/* Booth basics */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Booth</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Booth Number</label>
                    <input className={FIELD} placeholder="A01" value={bf.booth_number} onChange={(e) => setBF({ booth_number: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label className={LABEL}>Nameboard</label>
                    <input className={FIELD} placeholder="Display name on booth" value={bf.nameboard} onChange={(e) => setBF({ nameboard: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Status</label>
                    <select className={SELECT} value={bf.status} onChange={(e) => setBF({ status: e.target.value })}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Introduction Video URL</label>
                    <input className={FIELD} placeholder="https://youtube.com/..." value={bf.introduction_video} onChange={(e) => setBF({ introduction_video: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Badges & Access */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-3">Badges & Access</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Badge Quantity</label>
                    <input type="number" min="0" className={FIELD} placeholder="0" value={bf.badge_quantity} onChange={(e) => setBF({ badge_quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Access Code</label>
                    <input className={FIELD} placeholder="Exhibitor login code" value={bf.access_code} onChange={(e) => setBF({ access_code: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>VIP Pass Total</label>
                    <input type="number" min="0" className={FIELD} placeholder="0" value={bf.vip_pass_quantity} onChange={(e) => setBF({ vip_pass_quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>VIP Pass Remaining</label>
                    <input type="number" min="0" className={FIELD} placeholder="0" value={bf.vip_pass_remain} onChange={(e) => setBF({ vip_pass_remain: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>VIP Access Code</label>
                    <input className={FIELD} placeholder="VIP visitor code" value={bf.vip_pass_access_code} onChange={(e) => setBF({ vip_pass_access_code: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Event Representative override */}
              <div>
                <p className="text-xs font-bold text-content-secondary uppercase tracking-wide mb-1">Event Representative</p>
                <p className="text-xs text-content-tertiary mb-3">Override company default for this event only.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Name</label>
                    <input className={FIELD} placeholder="Leave blank to use company default" value={bf.rep_name} onChange={(e) => setBF({ rep_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Position</label>
                    <input className={FIELD} value={bf.rep_position} onChange={(e) => setBF({ rep_position: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input type="email" className={FIELD} value={bf.rep_email} onChange={(e) => setBF({ rep_email: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input className={FIELD} value={bf.rep_phone} onChange={(e) => setBF({ rep_phone: e.target.value })} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <Icon icon="lucide:alert-circle" className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="gradient" size="sm" onClick={handleSubmit} disabled={saving}>
                  {saving
                    ? <><Icon icon="lucide:loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</>
                    : <><Icon icon="lucide:check" className="w-3.5 h-3.5 mr-1.5" />Add Exhibitor</>
                  }
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep(selected ? 'search' : 'new')} disabled={saving}>Back</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </Container>

      {/* Portal credentials modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:check-circle" className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-content-primary">Exhibitor Added Successfully</h2>
                <p className="text-xs text-content-tertiary">Portal login credentials created. Share these with the exhibitor.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                <Icon icon="lucide:key" className="w-3.5 h-3.5" />
                Portal Login Credentials
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-content-tertiary mb-0.5">Email</p>
                  <p className="text-sm font-mono font-medium text-content-primary bg-white border border-amber-200 rounded px-2 py-1 select-all">{createdCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-content-tertiary mb-0.5">Temporary Password</p>
                  <p className="text-sm font-mono font-medium text-content-primary bg-white border border-amber-200 rounded px-2 py-1 select-all">{createdCredentials.password}</p>
                </div>
              </div>
              <p className="text-xs text-amber-600">⚠ This password will not be shown again. Copy it now.</p>
            </div>

            <Button
              variant="gradient"
              size="sm"
              className="w-full justify-center"
              onClick={() => router.push(`/events/${eventId}/exhibitors`)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
