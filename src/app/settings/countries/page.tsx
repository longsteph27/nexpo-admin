'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import directus from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

const FIELD = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

interface Country { id: string; code: string; name: string; }

export default function CountriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newCountry, setNewCountry] = useState({ code: '', name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ code: '', name: '' });
  const [saving, setSaving] = useState(false);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const data = await directus.request(readItems('countries', {
        fields: ['id', 'code', 'name'] as any,
        sort: ['name' as any],
        limit: 500,
      }));
      return data as unknown as Country[];
    },
  });

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const saveNew = async () => {
    if (!newCountry.code || !newCountry.name) return;
    setSaving(true);
    try {
      await directus.request(createItem('countries', { code: newCountry.code.toUpperCase(), name: newCountry.name } as any));
      qc.invalidateQueries({ queryKey: ['countries'] });
      setAdding(false);
      setNewCountry({ code: '', name: '' });
    } finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await directus.request(updateItem('countries', editingId, { code: editForm.code.toUpperCase(), name: editForm.name }));
      qc.invalidateQueries({ queryKey: ['countries'] });
      setEditingId(null);
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this country?')) return;
    await directus.request(deleteItem('countries', id));
    qc.invalidateQueries({ queryKey: ['countries'] });
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Countries</h1>
          <p className="text-sm text-content-tertiary mt-1">{countries.length} countries · used in exhibitor profiles.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setAdding(true)}>
          <Icon icon="lucide:plus" className="w-3.5 h-3.5 mr-1.5" />Add Country
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
        <Input placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Add form */}
      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-700">New Country</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-content-secondary block mb-1">Code (ISO)</label>
              <input className={FIELD} placeholder="VN" maxLength={3} value={newCountry.code} onChange={e => setNewCountry(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-content-secondary block mb-1">Country Name</label>
              <input className={FIELD} placeholder="Vietnam" value={newCountry.name} onChange={e => setNewCountry(f => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="gradient" disabled={!newCountry.code || !newCountry.name || saving} onClick={saveNew}>
              {saving ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewCountry({ code: '', name: '' }); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 justify-center h-40 text-content-secondary">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />Loading...
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary w-20">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-secondary">Name</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((country, idx) => (
                <motion.tr key={country.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                  className="group hover:bg-slate-50 transition-colors">
                  {editingId === country.id ? (
                    <>
                      <td className="px-3 py-2">
                        <input className={FIELD} value={editForm.code} maxLength={3} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={FIELD} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={saveEdit} disabled={saving} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <Icon icon={saving ? 'lucide:loader-2' : 'lucide:check'} className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <Icon icon="lucide:x" className="w-3.5 h-3.5 text-content-tertiary" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-content-secondary">{country.code}</td>
                      <td className="px-4 py-2.5 text-content-primary">{country.name}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => { setEditForm({ code: country.code, name: country.name }); setEditingId(country.id); }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-content-tertiary hover:text-blue-600 transition-colors">
                            <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(country.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-content-tertiary hover:text-red-500 transition-colors">
                            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-content-tertiary text-sm">No countries match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
