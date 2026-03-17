'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import directus from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';
import { useAuthStore } from '@/store/auth';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';
const FIELD = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

interface FacilityCategory { id: string; name: string; description?: string; status: string; }
interface FacilitySubCategory { id: string; name: string; description?: string; category_id?: string; }
interface Facility { id: string; name: string; dimension?: string; price?: number; status: string; category_id?: string; sub_category_id?: string; image?: { id: string } | string | null; }

function formatPrice(p?: number | null) {
  if (p == null) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);
}

const EMPTY_CAT = { name: '', description: '' };
const EMPTY_ITEM = { name: '', dimension: '', price: '' };

export default function FacilitiesPage() {
  const qc = useQueryClient();
  const { selectedTenant } = useAuthStore();
  const tenantId = selectedTenant?.id;

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery<FacilityCategory[]>({
    queryKey: ['facility_categories', tenantId],
    queryFn: async () => {
      const f: Record<string, unknown> = {};
      if (tenantId) f.tenant_id = { _eq: tenantId };
      const data = await directus.request(readItems('facility_categories', {
        filter: f as any,
        fields: ['id', 'name', 'description', 'status'] as any,
        sort: ['sort' as any, 'name' as any],
        limit: 200,
      }));
      return data as unknown as FacilityCategory[];
    },
    enabled: true,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['facilities_all', tenantId],
    queryFn: async () => {
      const f: Record<string, unknown> = {};
      if (tenantId) f.tenant_id = { _eq: tenantId };
      const data = await directus.request(readItems('facilities', {
        filter: f as any,
        fields: ['id', 'name', 'dimension', 'price', 'status', 'category_id', 'sub_category_id', 'image.id'] as any,
        limit: 1000,
      }));
      return data as unknown as Facility[];
    },
    enabled: true,
  });

  const saveCategory = async (id: string | null) => {
    if (!catForm.name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: catForm.name, description: catForm.description, status: 'published' };
      if (tenantId) payload.tenant_id = tenantId;
      if (id) await directus.request(updateItem('facility_categories', id, payload as any));
      else await directus.request(createItem('facility_categories', payload as any));
      qc.invalidateQueries({ queryKey: ['facility_categories'] });
      setAddingCat(false);
      setEditingCat(null);
      setCatForm(EMPTY_CAT);
    } finally { setSaving(false); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    await directus.request(deleteItem('facility_categories', id));
    qc.invalidateQueries({ queryKey: ['facility_categories'] });
    qc.invalidateQueries({ queryKey: ['facilities_all'] });
  };

  const saveFacilityItem = async (categoryId: string) => {
    if (!itemForm.name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: itemForm.name, dimension: itemForm.dimension || null,
        price: itemForm.price ? parseFloat(itemForm.price) : null,
        status: 'published', category_id: categoryId,
      };
      if (tenantId) payload.tenant_id = tenantId;
      await directus.request(createItem('facilities', payload as any));
      qc.invalidateQueries({ queryKey: ['facilities_all'] });
      setAddingItem(null);
      setItemForm(EMPTY_ITEM);
    } finally { setSaving(false); }
  };

  const deleteFacility = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await directus.request(deleteItem('facilities', id));
    qc.invalidateQueries({ queryKey: ['facilities_all'] });
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Facility Catalog</h1>
          <p className="text-sm text-content-tertiary mt-1">Manage booth equipment and service categories available for exhibitors to order.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => { setAddingCat(true); setCatForm(EMPTY_CAT); }}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 justify-center h-40 text-content-secondary">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />Loading...
        </div>
      ) : (
        <div className="space-y-2">
          {/* New category form */}
          <AnimatePresence>
            {addingCat && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-700">New Category</p>
                <input className={FIELD} placeholder="Category name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                <input className={FIELD} placeholder="Description (optional)" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" variant="gradient" disabled={!catForm.name || saving} onClick={() => saveCategory(null)}>
                    {saving ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingCat(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {categories.map(cat => {
            const items = facilities.filter(f => f.category_id === cat.id);
            const isExp = expandedCat === cat.id;
            const isEdit = editingCat === cat.id;
            return (
              <div key={cat.id} className="border border-slate-200 bg-white rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpandedCat(isExp ? null : cat.id)} className="flex items-center gap-2 flex-1 text-left">
                    <motion.div animate={{ rotate: isExp ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary" />
                    </motion.div>
                    {!isEdit && (
                      <div>
                        <span className="font-medium text-content-primary text-sm">{cat.name}</span>
                        <span className="ml-2 text-xs text-content-tertiary">({items.length} items)</span>
                        {cat.description && <p className="text-xs text-content-tertiary mt-0.5">{cat.description}</p>}
                      </div>
                    )}
                  </button>
                  {!isEdit && (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setCatForm({ name: cat.name, description: cat.description || '' }); setEditingCat(cat.id); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-content-tertiary hover:text-blue-600 transition-colors">
                        <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCat(cat.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-content-tertiary hover:text-red-500 transition-colors">
                        <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isEdit && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                      <input className={FIELD} placeholder="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                      <input className={FIELD} placeholder="Description" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="gradient" disabled={saving} onClick={() => saveCategory(cat.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100">
                      {/* Items table */}
                      {items.length > 0 && (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Name</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Dimension</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Price</th>
                              <th className="px-4 py-2 w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map(item => {
                              const imgUrl = item.image
                                ? `${DIRECTUS_URL}/assets/${typeof item.image === 'object' ? (item.image as { id: string }).id : item.image}`
                                : null;
                              return (
                                <tr key={item.id} className="group hover:bg-slate-50">
                                  <td className="px-4 py-2.5 flex items-center gap-2">
                                    {imgUrl
                                      ? <img src={imgUrl} className="w-7 h-7 rounded object-cover border border-slate-200" />
                                      : <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center"><Icon icon="lucide:package" className="w-3.5 h-3.5 text-slate-400" /></div>
                                    }
                                    <span className="font-medium text-content-primary">{item.name}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-content-secondary">{item.dimension || '—'}</td>
                                  <td className="px-4 py-2.5 text-content-secondary">{formatPrice(item.price) || '—'}</td>
                                  <td className="px-4 py-2.5">
                                    <button onClick={() => deleteFacility(item.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-content-tertiary hover:text-red-500 transition-all">
                                      <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {/* Add item inline */}
                      <div className="px-4 py-3">
                        <AnimatePresence>
                          {addingItem === cat.id ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <input className={FIELD} placeholder="Name *" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
                                <input className={FIELD} placeholder="Dimension (e.g. 1m²)" value={itemForm.dimension} onChange={e => setItemForm(f => ({ ...f, dimension: e.target.value }))} />
                                <input type="number" className={FIELD} placeholder="Price (VND)" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="gradient" disabled={!itemForm.name || saving} onClick={() => saveFacilityItem(cat.id)}>Add Item</Button>
                                <Button size="sm" variant="outline" onClick={() => { setAddingItem(null); setItemForm(EMPTY_ITEM); }}>Cancel</Button>
                              </div>
                            </motion.div>
                          ) : (
                            <button onClick={() => { setAddingItem(cat.id); setItemForm(EMPTY_ITEM); }}
                              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors">
                              <Icon icon="lucide:plus" className="w-3.5 h-3.5" />Add item
                            </button>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {categories.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Icon icon="lucide:package" className="w-10 h-10 text-content-tertiary mb-3" />
              <p className="text-content-primary font-medium">No facility categories yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
