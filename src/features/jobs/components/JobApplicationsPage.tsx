'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useSelection } from '@/hooks/useSelection';
import { toast } from 'sonner';
import { useJobApplications, useUpdateJobApplication, useBulkUpdateJobApplications } from '../hooks/useJobs';
import type { JobApplication, ApplicationStatus } from '../types';

const STATUS_STYLE: Record<string, { label: string; fg: string; bg: string }> = {
  pending:     { label: 'Pending',     fg: '#92400e', bg: '#fef3c7' },
  reviewing:   { label: 'Reviewing',  fg: '#1e40af', bg: '#dbeafe' },
  shortlisted: { label: 'Shortlisted',fg: '#065f46', bg: '#d1fae5' },
  hired:       { label: 'Hired',      fg: '#ffffff', bg: '#16a34a' },
  rejected:    { label: 'Rejected',   fg: '#991b1b', bg: '#fee2e2' },
  archived:    { label: 'Archived',   fg: '#6b7280', bg: '#f3f4f6' },
};

const STATUS_FILTERS: { label: string; value: ApplicationStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
];

// Fields to skip in candidate detail (system/noise fields)
const SKIP_FIELDS = new Set(['NguonThongTin', 'KyVongLonNhat']);

function getRegistration(app: JobApplication) {
  const r = app.registration_id;
  return (!r || typeof r === 'string') ? null : r;
}

function getApplicantName(app: JobApplication): string {
  const reg = getRegistration(app);
  if (!reg) return '—';
  if (reg.full_name) return reg.full_name;
  // fallback from answers
  const answers = reg.submissions?.answers || [];
  const texts = answers.filter(a => a.value?.trim() && !a.value.includes('@') && !/^\+?[\d\s\-().]{9,}$/.test(a.value)).map(a => a.value.trim());
  return texts.slice(0, 2).join(' ').trim() || reg.email || '—';
}

function getApplicantEmail(app: JobApplication): string {
  const reg = getRegistration(app);
  if (!reg) return '';
  if (reg.email) return reg.email;
  const answers = reg.submissions?.answers || [];
  return answers.find(a => a.value?.includes('@'))?.value || '';
}

function getJobTitle(app: JobApplication): string {
  const job = app.job_id;
  if (!job || typeof job === 'string') return '—';
  return job.job_title || '—';
}

function getExhibitorName(app: JobApplication): string {
  const ex = app.exhibitor_id;
  if (!ex || typeof ex === 'string') return '—';
  const en = ex.translations?.find((t) => t.languages_code === 'en-US');
  return en?.company_name || ex.translations?.[0]?.company_name || '—';
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { label: status, fg: '#374151', bg: '#f3f4f6' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: s.fg, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

// ─── Candidate Detail Panel ────────────────────────────────────────────────────

function CandidateDetail({ app }: { app: JobApplication }) {
  const reg = getRegistration(app);
  if (!reg) return <p className="text-xs text-content-tertiary px-4 py-3">No candidate data.</p>;

  const answers = reg.submissions?.answers?.filter(a => a.value?.trim() && !SKIP_FIELDS.has(a.field?.name || '')) || [];

  // Categorize key fields
  const nameVal = reg.full_name || getApplicantName(app);
  const emailVal = reg.email || getApplicantEmail(app);
  const phoneVal = reg.phone_number || answers.find(a => /^\+?[\d\s\-().]{9,}$/.test(a.value || ''))?.value || '';

  // Other answers (exclude name/email/phone-looking ones)
  const otherAnswers = answers.filter(a => {
    const v = a.value?.trim() || '';
    return !v.includes('@') && !/^\+?[\d\s\-().]{9,}$/.test(v);
  });

  return (
    <div className="bg-slate-50 border-t border-slate-200 px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider">Contact</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Icon icon="lucide:user" className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
              <span className="text-content-primary font-medium">{nameVal || '—'}</span>
            </div>
            {emailVal && (
              <div className="flex items-center gap-2 text-sm">
                <Icon icon="lucide:mail" className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
                <span className="text-content-secondary">{emailVal}</span>
              </div>
            )}
            {phoneVal && (
              <div className="flex items-center gap-2 text-sm">
                <Icon icon="lucide:phone" className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
                <span className="text-content-secondary">{phoneVal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile answers */}
        {otherAnswers.length > 0 && (
          <div className="space-y-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider">Profile</p>
            <div className="grid grid-cols-1 gap-1.5">
              {otherAnswers.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[11px] text-content-tertiary min-w-[100px] shrink-0 mt-0.5">
                    {a.field?.name || `Field ${i + 1}`}
                  </span>
                  <span className="text-[11px] text-content-primary font-medium leading-snug break-words">
                    {a.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App Row ───────────────────────────────────────────────────────────────────

function AppRow({ app, idx, selected, onToggle }: {
  app: JobApplication; idx: number; selected: boolean; onToggle: () => void;
}) {
  const updateApp = useUpdateJobApplication();
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    await updateApp.mutateAsync({ id: app.id, payload: { status: newStatus } });
    toast.success('Status updated');
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
        className={`transition-colors cursor-pointer ${selected ? 'bg-blue-50/50' : expanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 w-8" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <input type="checkbox" checked={selected} onChange={onToggle} onClick={(e) => e.stopPropagation()} className="rounded border-slate-300 accent-blue-600" />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon icon={expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'} className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
            <div>
              <p className="font-medium text-content-primary">{getApplicantName(app)}</p>
              {getApplicantEmail(app) && <p className="text-xs text-content-tertiary mt-0.5">{getApplicantEmail(app)}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-content-primary">{getJobTitle(app)}</p>
          <p className="text-xs text-content-tertiary mt-0.5">{getExhibitorName(app)}</p>
        </td>
        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
        <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(app.date_created)}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            disabled={updateApp.isPending}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </td>
      </motion.tr>
      {/* Expanded candidate detail row */}
      <AnimatePresence>
        {expanded && (
          <tr key={`detail-${app.id}`}>
            <td colSpan={6} className="p-0 border-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <CandidateDetail app={app} />
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function JobApplicationsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('pending');
  const [page, setPage] = useState(1);
  const bulkUpdate = useBulkUpdateJobApplications();
  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const { data, isLoading, error } = useJobApplications(eventId, { page, limit: 20, status: statusFilter });

  const rows = data?.applications ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const ids = rows.map((r) => r.id);

  const handleBulkStatus = async (status: ApplicationStatus) => {
    await bulkUpdate.mutateAsync({ ids: selectedArray, payload: { status } });
    toast.success(`${count} application${count !== 1 ? 's' : ''} updated to ${status}`);
    clear();
  };

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <h1 className="text-xl font-bold text-content-primary">Hiring Matching</h1>
        <p className="text-content-tertiary mt-1 text-sm">
          Job applications submitted by visitors for exhibitor job postings. Click a row to view candidate profile.
        </p>
      </ContainerHeader>

      <Container>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'}`}>
              {f.label}
            </button>
          ))}
          <span className="text-sm text-content-tertiary ml-1">
            {isLoading ? '...' : `${total} application${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" /><span>Loading applications...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm">Failed to load applications</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:users" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={isAllSelected(ids)}
                      ref={(el) => { if (el) el.indeterminate = isIndeterminate(ids); }}
                      onChange={() => toggleAll(ids)} className="rounded border-slate-300 accent-blue-600" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Applicant</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Job / Exhibitor</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((app, idx) => (
                  <AppRow key={app.id} app={app} idx={idx} selected={isSelected(app.id)} onToggle={() => toggle(app.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5 mr-1" />Previous
            </Button>
            <span className="text-sm text-content-tertiary">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next<Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </Container>

      <BulkActionBar count={count} onClear={clear} actions={[
        { label: 'Reviewing', icon: 'lucide:eye', onClick: () => handleBulkStatus('reviewing'), loading: bulkUpdate.isPending },
        { label: 'Shortlist', icon: 'lucide:star', onClick: () => handleBulkStatus('shortlisted'), loading: bulkUpdate.isPending },
        { label: 'Hire', icon: 'lucide:check-circle', onClick: () => handleBulkStatus('hired'), loading: bulkUpdate.isPending },
        { label: 'Reject', icon: 'lucide:x-circle', onClick: () => handleBulkStatus('rejected'), variant: 'danger', loading: bulkUpdate.isPending },
      ]} />
    </div>
  );
}
