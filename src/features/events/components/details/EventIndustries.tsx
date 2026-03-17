'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import directus from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

interface EventIndustry {
  id: string;
  name: string;
  status: string;
  sort?: number;
}

async function fetchIndustries(eventId: number): Promise<EventIndustry[]> {
  const data = await directus.request(
    readItems('event_industries', {
      filter: { event_id: { _eq: eventId } } as any,
      fields: ['id', 'name', 'status', 'sort'] as any,
      sort: ['sort', 'name'] as any,
      limit: -1,
    })
  );
  return data as unknown as EventIndustry[];
}

export default function EventIndustries({ eventId }: { eventId: number }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { data: industries = [], isLoading } = useQuery({
    queryKey: ['event_industries', eventId],
    queryFn: () => fetchIndustries(eventId),
    enabled: !!eventId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['event_industries', eventId] });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      directus.request(createItem('event_industries', { event_id: eventId, name, status: 'published' } as any)),
    onSuccess: () => { invalidate(); setNewName(''); setAdding(false); toast.success('Industry added'); },
    onError: () => toast.error('Failed to add industry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      directus.request(updateItem('event_industries', id, { name } as any)),
    onSuccess: () => { invalidate(); setEditingId(null); toast.success('Industry updated'); },
    onError: () => toast.error('Failed to update industry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => directus.request(deleteItem('event_industries', id)),
    onSuccess: () => { invalidate(); toast.success('Industry removed'); },
    onError: () => toast.error('Failed to remove industry'),
  });

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(name);
  };

  const handleEdit = (ind: EventIndustry) => {
    setEditingId(ind.id);
    setEditingName(ind.name);
  };

  const handleSaveEdit = () => {
    const name = editingName.trim();
    if (!name || !editingId) return;
    updateMutation.mutate({ id: editingId, name });
  };

  return (
    <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary">Industries</h2>
          <p className="text-xs text-content-tertiary mt-0.5">Industries associated with this event</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
            Add Industry
          </Button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {/* Add row */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2"
            >
              <Input
                autoFocus
                placeholder="Industry name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="gradient"
                onClick={handleAdd}
                disabled={createMutation.isPending || !newName.trim()}
              >
                {createMutation.isPending ? (
                  <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                ) : 'Add'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewName(''); }}>
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Industry list */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-content-tertiary text-sm">
            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : industries.length === 0 && !adding ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon icon="lucide:building-2" className="w-8 h-8 text-content-tertiary mb-2" />
            <p className="text-sm text-content-secondary font-medium">No industries yet</p>
            <p className="text-xs text-content-tertiary mt-0.5">Click "Add Industry" to associate industries with this event</p>
          </div>
        ) : (
          <div className="space-y-1">
            {industries.map((ind) => (
              <motion.div
                key={ind.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 group px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Icon icon="lucide:tag" className="w-3.5 h-3.5 text-blue-500 shrink-0" />

                {editingId === ind.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 h-7 text-sm py-0"
                    />
                    <Button size="sm" variant="gradient" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-content-primary">{ind.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(ind)}
                        className="p-1 rounded hover:bg-slate-200 text-content-tertiary hover:text-content-primary transition-colors"
                      >
                        <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(ind.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1 rounded hover:bg-red-100 text-content-tertiary hover:text-red-600 transition-colors"
                      >
                        <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
