'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useSelection } from '@/hooks/useSelection';
import {
  useFacilities, useFacilityCategories, useCreateFacility,
  useUpdateFacility, useDeleteFacility, useDeleteFacilities,
} from '../hooks/useFacilities';
import type { Facility, FacilityStatus } from '../types';
import { toast } from 'sonner';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

const STATUS_MAP: Record<FacilityStatus, { label: string; cls: string }> = {
  published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  draft: { label: 'Draft', cls: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archived', cls: 'bg-gray-100 text-gray-500' },
};

function formatVND(n?: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function formatUSD(n?: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function getImageUrl(image?: { id: string } | string | null) {
  if (!image) return null;
  const id = typeof image === 'object' ? image.id : image;
  return `${DIRECTUS_URL}/assets/${id}?width=64&height=64&fit=cover`;
}

function getCategoryName(cat?: string | { id: string; name: string } | null) {
  if (!cat) return '—';
  return typeof cat === 'object' ? cat.name : cat;
}

// ─── Form Modal ────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  name_vi: string;
  description: string;
  description_vi: string;
  dimension: string;
  price: string;
  price_usd: string;
  status: FacilityStatus;
  category_id: string;
}

const EMPTY_FORM: FormData = {
  name: '', name_vi: '', description: '', description_vi: '',
  dimension: '', price: '', price_usd: '', status: 'draft', category_id: '',
};

function FacilityFormModal({
  facility, eventId, tenantId, categories, onClose,
  onCreate, onUpdate,
}: {
  facility?: Facility | null;
  eventId: number;
  tenantId?: number;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (data: Omit<Partial<Facility>, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Facility>) => Promise<void>;
}) {
  const [form, setForm] = useState<FormData>(() =>
    facility
      ? {
          name: facility.name || '',
          name_vi: facility.name_vi || '',
          description: facility.description || '',
          description_vi: facility.description_vi || '',
          dimension: facility.dimension || '',
          price: facility.price != null ? String(facility.price) : '',
          price_usd: facility.price_usd != null ? String(facility.price_usd) : '',
          status: facility.status || 'draft',
          category_id: typeof facility.category_id === 'object' ? facility.category_id?.id || '' : facility.category_id || '',
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name (EN) is required'); return; }
    setSaving(true);
    try {
      const payload: Omit<Partial<Facility>, 'id'> = {
        name: form.name.trim(),
        name_vi: form.name_vi.trim() || undefined,
        description: form.description.trim() || undefined,
        description_vi: form.description_vi.trim() || undefined,
        dimension: form.dimension.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        price_usd: form.price_usd ? Number(form.price_usd) : undefined,
        status: form.status,
        category_id: form.category_id || undefined,
        event_id: eventId,
        tenant_id: tenantId,
      };
      if (facility) await onUpdate(facility.id, payload);
      else await onCreate(payload);
      onClose();
    } catch {
      toast.error('Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-content-primary">
            {facility ? 'Edit Facility' : 'New Facility'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <Icon icon="lucide:x" className="w-4 h-4 text-content-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as FacilityStatus)} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Category</label>
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="e.g. LED Display Panel" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Tên (Tiếng Việt)</label>
              <input value={form.name_vi} onChange={(e) => set('name_vi', e.target.value)} className={inputCls} placeholder="vd. Màn hình LED" />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Description (English)</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={inputCls} placeholder="English description..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Mô tả (Tiếng Việt)</label>
              <textarea value={form.description_vi} onChange={(e) => set('description_vi', e.target.value)} rows={3} className={inputCls} placeholder="Mô tả tiếng Việt..." />
            </div>
          </div>

          {/* Pricing & Dimension */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Giá (VND)
                <span className="ml-1 text-content-tertiary font-normal">Tenant setup</span>
              </label>
              <input type="number" min="0" step="1000" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} placeholder="e.g. 500000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Price (USD)
                <span className="ml-1 text-content-tertiary font-normal">Portal display</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.price_usd} onChange={(e) => set('price_usd', e.target.value)} className={inputCls} placeholder="e.g. 20.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">Dimension / Unit</label>
              <input value={form.dimension} onChange={(e) => set('dimension', e.target.value)} className={inputCls} placeholder="e.g. 2x2m, per unit" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" size="sm" disabled={saving}>
              {saving ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="lucide:save" className="w-3.5 h-3.5 mr-1" />}
              {facility ? 'Save Changes' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function FacilitiesPage() {
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FacilityStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | Facility | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error } = useFacilities(eventId, {
    page, status: statusFilter, category_id: categoryFilter, search: search || undefined,
  });
  const { data: categories = [] } = useFacilityCategories(eventId);
  const createMutation = useCreateFacility();
  const updateMutation = useUpdateFacility();
  const deleteMutation = useDeleteFacility();
  const deleteManyMutation = useDeleteFacilities();

  const { selected, selectedArray, count, toggle, toggleAll, clear, isSelected, isAllSelected, isIndeterminate } = useSelection();

  const facilities = data?.facilities ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const ids = facilities.map((f) => f.id);

  const handleDelete = async (ids: string[]) => {
    try {
      if (ids.length === 1) await deleteMutation.mutateAsync(ids[0]);
      else await deleteManyMutation.mutateAsync(ids);
      toast.success(`Deleted ${ids.length} facilit${ids.length === 1 ? 'y' : 'ies'}`);
      clear();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setConfirmDelete(null);
    }
  };

  const STATUS_FILTERS: { label: string; value: FacilityStatus | '' }[] = [
    { label: 'All', value: '' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  // Unique categories from fetched list
  const uniqueCategories = categories.filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i);

  return (
    <div className="space-y-4 pb-24">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Facilities</h1>
          <p className="text-content-tertiary mt-1 text-sm">Manage booth equipment and services available for exhibitors to order.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setModal('create')}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />
          Add Facility
        </Button>
      </ContainerHeader>

      <Container>
        {/* Search + Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="relative">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            <input
              type="text" placeholder="Search by name..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100">
                <Icon icon="lucide:x" className="w-3.5 h-3.5 text-content-tertiary" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-content-secondary hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
            <div className="h-4 w-px bg-slate-200" />
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-content-secondary border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="text-sm text-content-tertiary">
              {isLoading ? '...' : `${total} facilit${total !== 1 ? 'ies' : 'y'}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-content-secondary">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-center">
            <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-content-secondary text-sm">Failed to load facilities</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="lucide:package" className="w-10 h-10 text-content-tertiary mb-3" />
            <p className="text-content-primary font-medium">No facilities found</p>
            <p className="text-content-tertiary text-sm mt-1">Add your first facility to get started.</p>
            <Button variant="gradient" size="sm" className="mt-4" onClick={() => setModal('create')}>
              <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />Add Facility
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={isAllSelected(ids)} ref={(el) => { if (el) el.indeterminate = isIndeterminate(ids); }}
                      onChange={() => toggleAll(ids)} className="rounded border-slate-300 accent-blue-600" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary w-14">Image</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Dimension</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Price (VND)</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Price (USD)</th>
                  <th className="text-left px-4 py-3 font-semibold text-content-secondary">Status</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facilities.map((facility, idx) => {
                  const { label, cls } = STATUS_MAP[facility.status] ?? { label: facility.status, cls: '' };
                  const imgUrl = getImageUrl(facility.image);
                  return (
                    <motion.tr key={facility.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      className={`hover:bg-slate-50 transition-colors ${isSelected(facility.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isSelected(facility.id)} onChange={() => toggle(facility.id)} className="rounded border-slate-300 accent-blue-600" />
                      </td>
                      <td className="px-4 py-3">
                        {imgUrl ? (
                          <img src={imgUrl} alt={facility.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Icon icon="lucide:image" className="w-4 h-4 text-content-tertiary" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-content-primary">{facility.name}</p>
                        {facility.name_vi && <p className="text-xs text-content-tertiary">{facility.name_vi}</p>}
                      </td>
                      <td className="px-4 py-3 text-content-secondary text-xs">{getCategoryName(facility.category_id)}</td>
                      <td className="px-4 py-3 text-content-secondary text-xs">{facility.dimension || '—'}</td>
                      <td className="px-4 py-3 font-medium text-content-primary">{formatVND(facility.price)}</td>
                      <td className="px-4 py-3 text-content-secondary">{formatUSD(facility.price_usd)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setModal(facility)} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-content-secondary hover:text-content-primary">
                            <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete([facility.id])} className="p-1.5 rounded-lg hover:bg-red-50 transition text-content-secondary hover:text-red-500">
                            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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

      {/* Facility Form Modal */}
      <AnimatePresence>
        {modal && (
          <FacilityFormModal
            facility={modal === 'create' ? null : modal}
            eventId={eventId}
            categories={uniqueCategories}
            onClose={() => setModal(null)}
            onCreate={async (payload) => { await createMutation.mutateAsync(payload); toast.success('Facility created'); }}
            onUpdate={async (id, payload) => { await updateMutation.mutateAsync({ id, payload }); toast.success('Facility updated'); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="lucide:trash-2" className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-content-primary text-center mb-2">Delete Facilit{confirmDelete.length === 1 ? 'y' : 'ies'}</h3>
              <p className="text-sm text-content-tertiary text-center mb-6">
                Are you sure you want to delete {confirmDelete.length === 1 ? 'this facility' : `${confirmDelete.length} facilities`}? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleteMutation.isPending || deleteManyMutation.isPending}>
                  {(deleteMutation.isPending || deleteManyMutation.isPending)
                    ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                    : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={count}
        onClear={clear}
        actions={[
          {
            label: 'Publish',
            icon: 'lucide:globe',
            onClick: async () => {
              try {
                await Promise.all(selectedArray.map((id) => updateMutation.mutateAsync({ id, payload: { status: 'published' } })));
                toast.success(`Published ${count} facilit${count === 1 ? 'y' : 'ies'}`);
                clear();
              } catch { toast.error('Failed to publish'); }
            },
          },
          {
            label: 'Archive',
            icon: 'lucide:archive',
            onClick: async () => {
              try {
                await Promise.all(selectedArray.map((id) => updateMutation.mutateAsync({ id, payload: { status: 'archived' } })));
                toast.success(`Archived ${count} facilit${count === 1 ? 'y' : 'ies'}`);
                clear();
              } catch { toast.error('Failed to archive'); }
            },
          },
          {
            label: 'Delete',
            icon: 'lucide:trash-2',
            variant: 'danger',
            onClick: () => setConfirmDelete(selectedArray),
          },
        ]}
      />
    </div>
  );
}
