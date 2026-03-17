'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { toast } from 'sonner';
import { useJobs, useUpdateJob } from '../hooks/useJobs';
import type { JobRequirement, JobStatus } from '../types';

const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

const STATUS_FILTERS: { label: string; value: JobStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_STYLE: Record<string, { label: string; fg: string; bg: string }> = {
  published: { label: 'Published', fg: '#065f46', bg: '#d1fae5' },
  draft: { label: 'Draft', fg: '#92400e', bg: '#fef3c7' },
  closed: { label: 'Closed', fg: '#6b7280', bg: '#f3f4f6' },
};

function getExhibitorName(job: JobRequirement): string {
  const ex = job.exhibitor_id;
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

function JobRow({ job, idx }: { job: JobRequirement; idx: number }) {
  const updateJob = useUpdateJob();

  const handleStatusChange = async (newStatus: JobStatus) => {
    await updateJob.mutateAsync({ id: job.id, payload: { status: newStatus } });
    toast.success('Status updated');
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="hover:bg-slate-50 transition-colors"
    >
      <td className="px-4 py-3">
        <p className="font-medium text-content-primary">{job.job_title}</p>
        {job.salary_range && (
          <p className="text-xs text-content-tertiary mt-0.5">{job.salary_range}</p>
        )}
      </td>
      <td className="px-4 py-3 text-content-secondary text-sm">{getExhibitorName(job)}</td>
      <td className="px-4 py-3">
        {job.employment_type && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-content-primary">
            {EMPLOYMENT_LABEL[job.employment_type] ?? job.employment_type}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-content-secondary text-sm">{job.quantity ?? '—'}</td>
      <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
      <td className="px-4 py-3 text-content-tertiary text-xs">{formatDate(job.date_created)}</td>
      <td className="px-4 py-3">
        <select
          value={job.status}
          onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
          onClick={(e) => e.stopPropagation()}
          disabled={updateJob.isPending}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </td>
    </motion.tr>
  );
}

export function JobPostingsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error } = useJobs(eventId, {
    page, limit: 20, status: statusFilter, search: search || undefined,
  });

  const rows = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <ContainerHeader>
        <h1 className="text-xl font-bold text-content-primary">Job Postings</h1>
        <p className="text-content-tertiary mt-1 text-sm">
          Job listings posted by exhibitors for this event.
        </p>
      </ContainerHeader>

      <Container>
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by job title or exhibitor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 transition">
                <Icon icon="lucide:x" className="w-3.5 h-3.5 text-content-tertiary" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-content-tertiary">
              {isLoading ? '...' : `${total} job${total !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading jobs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-content-secondary text-sm">Failed to load job postings</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:briefcase" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No job postings yet</p>
            <p className="text-content-tertiary text-sm mt-1">Exhibitors create jobs from the portal</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Job Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Exhibitor</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Qty</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((job, idx) => <JobRow key={job.id} job={job} idx={idx} />)}
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
    </div>
  );
}
