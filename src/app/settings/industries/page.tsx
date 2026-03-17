'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import directus from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

const FIELD = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

interface IndustryCategoryTranslation { id?: number; languages_code?: string; category?: string; }
interface IndustryCategory { id: string; status: string; sort?: number; translations?: IndustryCategoryTranslation[]; }
interface IndustryName { id: string; status: string; industry_category_id?: string; translations?: { id?: number; languages_code?: string; industry_name?: string }[]; }

function getCategoryName(cat: IndustryCategory): string {
  const en = cat.translations?.find(t => t.languages_code === 'en-US');
  const vi = cat.translations?.find(t => t.languages_code === 'vi-VN');
  return en?.category || vi?.category || '(no name)';
}

function getIndustryName(ind: IndustryName): string {
  const en = ind.translations?.find(t => t.languages_code === 'en-US');
  const vi = ind.translations?.find(t => t.languages_code === 'vi-VN');
  return en?.industry_name || vi?.industry_name || '(no name)';
}

export default function IndustriesPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ en: '', vi: '' });
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ en: '', vi: '' });
  const [addingIndustry, setAddingIndustry] = useState<string | null>(null);
  const [newIndustry, setNewIndustry] = useState({ en: '', vi: '' });
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<IndustryCategory[]>({
    queryKey: ['industry_categories'],
    queryFn: async () => {
      const data = await directus.request(readItems('industry_categories', {
        fields: ['id', 'status', 'sort', 'translations.id', 'translations.languages_code', 'translations.category'] as any,
        sort: ['sort' as any, 'date_created' as any],
        limit: 200,
      }));
      return data as unknown as IndustryCategory[];
    },
  });

  const { data: industries = [] } = useQuery<IndustryName[]>({
    queryKey: ['industry_names'],
    queryFn: async () => {
      const data = await directus.request(readItems('industry_names', {
        fields: ['id', 'status', 'industry_category_id', 'translations.id', 'translations.languages_code', 'translations.industry_name'] as any,
        limit: 1000,
      }));
      return data as unknown as IndustryName[];
    },
  });

  const saveCategory = async (id: string | null, en: string, vi: string) => {
    setSavingId(id ?? 'new');
    try {
      const payload: Record<string, unknown> = {
        status: 'published',
        translations: {
          ...(id ? {} : { create: [] }),
          ...(id ? { update: [] } : {}),
        },
      };
      // Build translations upsert
      if (id) {
        const cat = categories.find(c => c.id === id);
        const enTrans = cat?.translations?.find(t => t.languages_code === 'en-US');
        const viTrans = cat?.translations?.find(t => t.languages_code === 'vi-VN');
        const updates: unknown[] = [];
        const creates: unknown[] = [];
        if (enTrans?.id) updates.push({ id: enTrans.id, category: en });
        else creates.push({ languages_code: 'en-US', category: en });
        if (viTrans?.id) updates.push({ id: viTrans.id, category: vi });
        else creates.push({ languages_code: 'vi-VN', category: vi });
        payload.translations = { update: updates, create: creates };
        await directus.request(updateItem('industry_categories', id, payload as any));
      } else {
        payload.translations = {
          create: [
            { languages_code: 'en-US', category: en },
            { languages_code: 'vi-VN', category: vi },
          ],
        };
        await directus.request(createItem('industry_categories', payload as any));
      }
      qc.invalidateQueries({ queryKey: ['industry_categories'] });
      setEditingCat(null);
      setAddingCat(false);
      setNewCat({ en: '', vi: '' });
    } finally {
      setSavingId(null);
    }
  };

  const saveIndustry = async (categoryId: string, en: string, vi: string) => {
    setSavingId('ind');
    try {
      await directus.request(createItem('industry_names', {
        status: 'published',
        industry_category_id: categoryId,
        translations: { create: [{ languages_code: 'en-US', industry_name: en }, { languages_code: 'vi-VN', industry_name: vi }] },
      } as any));
      qc.invalidateQueries({ queryKey: ['industry_names'] });
      setAddingIndustry(null);
      setNewIndustry({ en: '', vi: '' });
    } finally {
      setSavingId(null);
    }
  };

  const deleteIndustry = async (id: string) => {
    await directus.request(deleteItem('industry_names', id));
    qc.invalidateQueries({ queryKey: ['industry_names'] });
  };

  const deleteCat = async (id: string) => {
    await directus.request(deleteItem('industry_categories', id));
    qc.invalidateQueries({ queryKey: ['industry_categories'] });
    qc.invalidateQueries({ queryKey: ['industry_names'] });
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Industries</h1>
          <p className="text-sm text-content-tertiary mt-1">Manage industry categories and their sub-industries.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setAddingCat(true)}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 justify-center h-40 text-content-secondary">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />Loading...
        </div>
      ) : (
        <div className="space-y-2">
          {/* Add new category form */}
          <AnimatePresence>
            {addingCat && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-700">New Category</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-content-secondary block mb-1">English</label>
                    <input className={FIELD} placeholder="e.g. Technology" value={newCat.en} onChange={e => setNewCat(f => ({ ...f, en: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium text-content-secondary block mb-1">Vietnamese</label>
                    <input className={FIELD} placeholder="e.g. Công nghệ" value={newCat.vi} onChange={e => setNewCat(f => ({ ...f, vi: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="gradient" disabled={!newCat.en || savingId === 'new'} onClick={() => saveCategory(null, newCat.en, newCat.vi)}>
                    {savingId === 'new' ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingCat(false); setNewCat({ en: '', vi: '' }); }}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {categories.map(cat => {
            const catIndustries = industries.filter(i => i.industry_category_id === cat.id);
            const isExpanded = expandedId === cat.id;
            const isEditing = editingCat === cat.id;
            return (
              <div key={cat.id} className="border border-slate-200 bg-white rounded-xl overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpandedId(isExpanded ? null : cat.id)} className="flex items-center gap-2 flex-1 text-left">
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <Icon icon="lucide:chevron-right" className="w-4 h-4 text-content-tertiary" />
                    </motion.div>
                    {isEditing ? null : (
                      <span className="font-medium text-content-primary text-sm">
                        {getCategoryName(cat)}
                        <span className="ml-2 text-xs text-content-tertiary font-normal">({catIndustries.length})</span>
                      </span>
                    )}
                  </button>
                  {!isEditing && (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setCatForm({ en: cat.translations?.find(t => t.languages_code === 'en-US')?.category || '', vi: cat.translations?.find(t => t.languages_code === 'vi-VN')?.category || '' }); setEditingCat(cat.id); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-content-tertiary hover:text-blue-600 transition-colors">
                        <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this category?')) deleteCat(cat.id); }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-content-tertiary hover:text-red-500 transition-colors">
                        <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline edit */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-content-secondary block mb-1">English</label>
                          <input className={FIELD} value={catForm.en} onChange={e => setCatForm(f => ({ ...f, en: e.target.value }))} /></div>
                        <div><label className="text-xs font-medium text-content-secondary block mb-1">Vietnamese</label>
                          <input className={FIELD} value={catForm.vi} onChange={e => setCatForm(f => ({ ...f, vi: e.target.value }))} /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="gradient" disabled={savingId === cat.id} onClick={() => saveCategory(cat.id, catForm.en, catForm.vi)}>
                          {savingId === cat.id ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded industries list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100">
                      <div className="px-4 py-2 space-y-1">
                        {catIndustries.length === 0 && !addingIndustry && (
                          <p className="text-xs text-content-tertiary py-2">No industries yet.</p>
                        )}
                        {catIndustries.map(ind => (
                          <div key={ind.id} className="flex items-center justify-between py-1.5 group">
                            <span className="text-sm text-content-primary">{getIndustryName(ind)}</span>
                            <button onClick={() => { if (confirm('Delete?')) deleteIndustry(ind.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-content-tertiary hover:text-red-500 transition-all">
                              <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {/* Add industry inline */}
                        <AnimatePresence>
                          {addingIndustry === cat.id && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-2 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input className={FIELD} placeholder="English" value={newIndustry.en} onChange={e => setNewIndustry(f => ({ ...f, en: e.target.value }))} />
                                <input className={FIELD} placeholder="Tiếng Việt" value={newIndustry.vi} onChange={e => setNewIndustry(f => ({ ...f, vi: e.target.value }))} />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="gradient" disabled={!newIndustry.en || savingId === 'ind'} onClick={() => saveIndustry(cat.id, newIndustry.en, newIndustry.vi)}>
                                  {savingId === 'ind' ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setAddingIndustry(null); setNewIndustry({ en: '', vi: '' }); }}>Cancel</Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {addingIndustry !== cat.id && (
                          <button onClick={() => { setAddingIndustry(cat.id); setNewIndustry({ en: '', vi: '' }); }}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 py-1.5 transition-colors">
                            <Icon icon="lucide:plus" className="w-3.5 h-3.5" />Add industry
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {categories.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Icon icon="lucide:layers" className="w-10 h-10 text-content-tertiary mb-3" />
              <p className="text-content-primary font-medium">No industry categories yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
