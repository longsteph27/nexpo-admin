'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { businessMatchingApi } from '../api';
import type { BusinessRequirement, BusinessRequirementType } from '../types';

const TYPE_CONFIG: Record<BusinessRequirementType, { label: string; cls: string }> = {
  buyer:       { label: 'Buyer',       cls: 'bg-blue-100 text-blue-700' },
  distributor: { label: 'Distributor', cls: 'bg-indigo-100 text-indigo-700' },
  supplier:    { label: 'Supplier',    cls: 'bg-teal-100 text-teal-700' },
  partner:     { label: 'Partner',     cls: 'bg-purple-100 text-purple-700' },
  investor:    { label: 'Investor',    cls: 'bg-amber-100 text-amber-700' },
  other:       { label: 'Other',       cls: 'bg-gray-100 text-gray-600' },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Draft',     cls: 'bg-gray-100 text-gray-500' },
  published:  { label: 'Published', cls: 'bg-green-100 text-green-700' },
  closed:     { label: 'Closed',    cls: 'bg-orange-100 text-orange-600' },
  archived:   { label: 'Archived',  cls: 'bg-red-100 text-red-500' },
};

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Buyer', value: 'buyer' },
  { label: 'Distributor', value: 'distributor' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Partner', value: 'partner' },
  { label: 'Investor', value: 'investor' },
];

function getExhibitorName(req: BusinessRequirement): string {
  const ex = req.exhibitor_id;
  if (!ex || typeof ex === 'string') return '—';
  const t = ex.translations?.find(t => t.languages_code === 'vi-VN') || ex.translations?.[0];
  return t?.company_name || '—';
}

export function BusinessRequirementsPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['business-requirements', eventId],
    queryFn: () => businessMatchingApi.getRequirements(eventId),
  });

  const filtered = requirements.filter(r => {
    if (typeFilter && r.requirement_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const exhibitor = getExhibitorName(r).toLowerCase();
      const summary = (r.summary || '').toLowerCase();
      const goals = (r.partnership_goals || '').toLowerCase();
      if (!exhibitor.includes(q) && !summary.includes(q) && !goals.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-content-primary">Business Requirements</h1>
            <p className="text-content-tertiary mt-1 text-sm">Partnership requirements posted by exhibitors.</p>
          </div>
        </div>
      </ContainerHeader>

      <Container>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {TYPE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-tertiary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search requirements..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-48"
              />
            </div>
            <span className="text-sm text-content-tertiary">
              {isLoading ? '...' : `${filtered.length} requirement${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-content-secondary">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:briefcase" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No requirements found</p>
            <p className="text-content-tertiary text-sm mt-1">Business requirements are created from exhibitor form submissions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(req => {
              const typeCfg = TYPE_CONFIG[req.requirement_type] ?? { label: req.requirement_type, cls: 'bg-gray-100 text-gray-600' };
              const statusCfg = STATUS_CONFIG[req.status] ?? { label: req.status, cls: 'bg-gray-100 text-gray-500' };
              const isOpen = expanded === req.id;
              const exhibitor = getExhibitorName(req);
              return (
                <div key={req.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : req.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-content-primary">{exhibitor}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCfg.cls}`}>{typeCfg.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
                      </div>
                      {req.summary && (
                        <p className="text-xs text-content-secondary mt-0.5 line-clamp-1">{req.summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {req.industry_focus && req.industry_focus.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Icon icon="lucide:tag" className="w-3.5 h-3.5 text-content-tertiary" />
                          <span className="text-xs text-content-tertiary">{req.industry_focus.slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                      <span className="text-xs text-content-tertiary">
                        {req.date_created ? new Date(req.date_created).toLocaleDateString('vi-VN') : ''}
                      </span>
                      <Icon icon={isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'} className="w-4 h-4 text-content-tertiary" />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {req.partnership_goals && (
                          <div>
                            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Partnership Goals</p>
                            <p className="text-content-primary text-sm">{req.partnership_goals}</p>
                          </div>
                        )}
                        {req.target_markets && req.target_markets.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Target Markets</p>
                            <div className="flex flex-wrap gap-1">
                              {req.target_markets.map((m, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {req.industry_focus && req.industry_focus.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Industry Focus</p>
                            <div className="flex flex-wrap gap-1">
                              {req.industry_focus.map((ind, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{ind}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {req.company_size_preference && req.company_size_preference.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">Company Size Preference</p>
                            <div className="flex flex-wrap gap-1">
                              {req.company_size_preference.map((s, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
