'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useSaveForm } from '@/hooks/useForms';
import Button from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

type FormField = {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown>;
  translations?: {
    'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
    'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
  };
};

const CATALOG: { id: string; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'textarea', label: 'Textarea' },
  { id: 'email', label: 'Email' },
  { id: 'number', label: 'Number' },
  { id: 'select', label: 'Select' },
  { id: 'multiselect', label: 'Multi Select' },
  { id: 'file', label: 'File' },
  { id: 'image', label: 'Image' },
];

export default function FormBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params?.id || '');
  const formId = String(params?.formId || '');

  const [, setFormMeta] = useState<{ status?: string; on_success?: string; redirect_url?: string; translations?: Array<{ languages_code: string; title?: string; submit_label?: string; success_message?: string }> } | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [formLang, setFormLang] = useState<{ 'en-US': { title?: string; submit_label?: string; success_message?: string }; 'vi-VN': { title?: string; submit_label?: string; success_message?: string } }>({ 'en-US': {}, 'vi-VN': {} });
  const [formSettings, setFormSettings] = useState<{ status?: string; on_success?: string; redirect_url?: string }>({});

  // Use React Query hook to fetch form data
  const { data: formData } = useForm(formId);
  const saveFormMutation = useSaveForm();
  const isSaving = saveFormMutation.isPending;

  // Helper function to parse field translations
  const parseFieldTranslations = (field: unknown) => {
    const f = field as { id: string; name?: string; type?: string; width?: string; sort?: number; is_required?: boolean; validation?: string; translations?: Array<{ languages_code: string; label?: string; placeholder?: string; help?: string; options?: string | null }> };
    const fieldTranslations = f.translations || [];
    console.log(`Field ${f.name} translations:`, fieldTranslations);
    const enFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'en-US');
    const viFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'vi-VN');
    
    // Parse options if they exist
    const parseOptions = (optionsStr: string | null) => {
      if (!optionsStr) return undefined;
      try {
        return JSON.parse(optionsStr);
      } catch {
        return undefined;
      }
    };
    
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      width: f.width,
      sort: f.sort,
      is_required: f.is_required,
      validation: f.validation,
      translations: {
        'en-US': { 
          label: enFieldTranslation?.label || '', 
          placeholder: enFieldTranslation?.placeholder || '', 
          help: enFieldTranslation?.help || '', 
          options: parseOptions(enFieldTranslation?.options || null)
        },
        'vi-VN': { 
          label: viFieldTranslation?.label || '', 
          placeholder: viFieldTranslation?.placeholder || '', 
          help: viFieldTranslation?.help || '', 
          options: parseOptions(viFieldTranslation?.options || null)
        },
      }
    };
  };

  // Process form data when it loads
  React.useEffect(() => {
    if (formData) {
      setFormMeta(formData);
      
      // Properly handle form translations by languages_code
      const translations = ((formData as { translations?: Array<{ languages_code: string; title?: string; submit_label?: string; success_message?: string }> })?.translations || []);
      const enTranslation = translations.find((t) => t.languages_code === 'en-US');
      const viTranslation = translations.find((t) => t.languages_code === 'vi-VN');
      
      setFormLang({
        'en-US': { 
          title: enTranslation?.title || '', 
          submit_label: enTranslation?.submit_label || '', 
          success_message: enTranslation?.success_message || '' 
        },
        'vi-VN': { 
          title: viTranslation?.title || '', 
          submit_label: viTranslation?.submit_label || '', 
          success_message: viTranslation?.success_message || '' 
        },
      });
      setFormSettings({ 
        status: (formData as { status?: string; on_success?: string; redirect_url?: string }).status, 
        on_success: (formData as { status?: string; on_success?: string; redirect_url?: string }).on_success, 
        redirect_url: (formData as { status?: string; on_success?: string; redirect_url?: string }).redirect_url 
      });

      // Process form fields
      const formFields = (formData as { fields?: unknown[] })?.fields || [];
      setFields(formFields.map(parseFieldTranslations));
    }
  }, [formData]);

  // DnD handlers (basic reordering using clicks for now)
  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      const [item] = arr.splice(index, 1);
      arr.splice(newIndex, 0, item);
      return arr.map((f, i) => ({ ...f, sort: i + 1 }));
    });
  };

  const selected = useMemo(() => fields.find((f) => f.id === selectedId) || null, [fields, selectedId]);

  // Save form
  const handleSave = () => {
    if (!formId || !eventId) return;
    
    // Format form data according to schema
    const formData = {
      status: (formSettings.status as 'draft' | 'published' | 'archived') || 'draft',
      on_success: (formSettings.on_success as 'redirect' | 'message') || 'message',
      redirect_url: formSettings.redirect_url || undefined,
      
      translations: {
        'en-US': {
          title: formLang['en-US'].title || '',
          submit_label: formLang['en-US'].submit_label || 'Submit',
          success_message: formLang['en-US'].success_message || 'Thank you for your submission!',
        },
        'vi-VN': {
          title: formLang['vi-VN'].title || '',
          submit_label: formLang['vi-VN'].submit_label || 'Gửi',
          success_message: formLang['vi-VN'].success_message || 'Cảm ơn bạn đã gửi!',
        },
      },
      
      fields: fields.map((field, index) => ({
        id: field.id,
        name: field.name || `field_${index + 1}`,
        type: (field.type as 'input' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'image') || 'input',
        width: (field.width as 'full' | 'half') || 'full',
        sort: field.sort || index,
        is_required: field.is_required || false,
        validation: field.validation || undefined,
        conditions: field.conditions || undefined,
        
        translations: {
          'en-US': {
            label: field.translations?.['en-US']?.label || '',
            placeholder: field.translations?.['en-US']?.placeholder || undefined,
            help: field.translations?.['en-US']?.help || undefined,
            options: field.translations?.['en-US']?.options || undefined,
          },
          'vi-VN': {
            label: field.translations?.['vi-VN']?.label || '',
            placeholder: field.translations?.['vi-VN']?.placeholder || undefined,
            help: field.translations?.['vi-VN']?.help || undefined,
            options: field.translations?.['vi-VN']?.options || undefined,
          },
        },
      })),
    };

    saveFormMutation.mutate(
      { formId, eventId, formData },
      {
        onSuccess: () => {
          toast.success('Form saved successfully!', {
            description: 'All changes have been saved to Directus.',
          });
        },
        onError: (error) => {
          toast.error('Failed to save form', {
            description: error.message,
          });
        },
      }
    );
  };

  // DnD helpers
  const handleCatalogDragStart = (e: React.DragEvent<HTMLButtonElement>, type: string, label: string) => {
    e.dataTransfer.setData('catalog-type', type);
    e.dataTransfer.setData('catalog-label', label);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFieldDragStart = (e: React.DragEvent<HTMLDivElement>, fieldId: string) => {
    e.dataTransfer.setData('field-id', fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('catalog-type');
    const label = e.dataTransfer.getData('catalog-label');
    const fieldId = e.dataTransfer.getData('field-id');
    setDragOverId(null);

    // Add from catalog
    if (type) {
      const id = crypto.randomUUID();
      setFields((prev) => [...prev, { id, type, name: label, sort: prev.length + 1 }]);
      setSelectedId(id);
      return;
    }

    // Move to end from existing field
    if (fieldId) {
      setFields((prev) => {
        const arr = [...prev];
        const idx = arr.findIndex((f) => f.id === fieldId);
        if (idx === -1) return prev;
        const [item] = arr.splice(idx, 1);
        arr.push(item);
        return arr.map((f, i) => ({ ...f, sort: i + 1 }));
      });
    }
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const movedId = e.dataTransfer.getData('field-id');
    const type = e.dataTransfer.getData('catalog-type');
    const label = e.dataTransfer.getData('catalog-label');
    setDragOverId(null);
    if (type) {
      const id = crypto.randomUUID();
      setFields((prev) => {
        const arr = [...prev];
        const targetIdx = arr.findIndex((f) => f.id === targetId);
        const insertIdx = targetIdx < 0 ? arr.length : targetIdx;
        arr.splice(insertIdx, 0, { id, type, name: label, sort: 0 });
        return arr.map((f, i) => ({ ...f, sort: i + 1 }));
      });
      setSelectedId(id);
      return;
    }
    if (!movedId || movedId === targetId) return;
    setFields((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((f) => f.id === movedId);
      const toIdx = arr.findIndex((f) => f.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr.map((f, i) => ({ ...f, sort: i + 1 }));
    });
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, sort: i + 1 })));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">Form Builder</div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">Design your form</h1>
            <p className="text-gray-600 mt-1">Event <span className="font-medium">{eventId}</span> • Form <span className="font-medium">{formId}</span></p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon="lucide:arrow-left" onClick={() => router.push(`/events/${eventId}`)}>Back</Button>
            <Button 
              variant="gradient" 
              icon="lucide:save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Three-panel builder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Catalog */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-3">Field Types</div>
            <div className="grid grid-cols-2 gap-2">
              {CATALOG.map((t) => (
                <motion.button
                  key={t.id}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 cursor-pointer shadow-sm"
                  onClick={() => {
                    const id = crypto.randomUUID();
                    setFields((prev) => [...prev, { id, type: t.id, name: t.label, sort: prev.length + 1 }]);
                    setSelectedId(id);
                  }}
                  draggable
                  onDragStart={(e) => handleCatalogDragStart(e as unknown as React.DragEvent<HTMLButtonElement>, t.id, t.label)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div
            className="lg:col-span-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleCanvasDrop}
          >
            <div className="text-sm font-semibold text-gray-900 mb-3">Form Layout</div>
            <div className="space-y-2">
              <AnimatePresence>
              {fields.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((f, idx) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={() => setSelectedId(f.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow cursor-pointer transition-all ${selectedId === f.id ? 'ring-2 ring-blue-600' : ''} ${dragOverId === f.id ? 'bg-blue-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(e as unknown as React.DragEvent<HTMLDivElement>, f.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(f.id); }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleItemDrop(e, f.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon icon="lucide:grip-vertical" className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{f.name || f.translations?.['en-US']?.label || 'Untitled'}</div>
                      <div className="text-xs text-gray-500 capitalize">{f.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); moveField(idx, -1); }}><Icon icon="lucide:chevron-up" className="w-4 h-4" /></button>
                    <button className="p-1 hover:bg-gray-100 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); moveField(idx, 1); }}><Icon icon="lucide:chevron-down" className="w-4 h-4" /></button>
                    <button className="p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeField(f.id); }}><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Inspector */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-3">Field Settings</div>
            {!selected && <div className="text-sm text-gray-500">Select a field to edit its settings</div>}
            {selected && (
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {/* Language Tabs */}
                <div className="flex items-center gap-2 mb-1">
                  {(['en-US','vi-VN'] as const).map((lng) => (
                    <button
                      key={lng}
                      className={`px-2 py-1 rounded border text-xs ${activeLang === lng ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-200'}`}
                      onClick={() => setActiveLang(lng)}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Label</label>
                  <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={selected.translations?.[activeLang]?.label || ''}
                    onChange={(e) => setFields((prev) => prev.map((f) => {
                      if (f.id !== selected.id) return f;
                      const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                      translations[activeLang] = { ...(translations[activeLang] || {}), label: e.target.value };
                      return { ...f, translations };
                    }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select className="select select-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 capitalize focus:outline-none focus:border-gray-500" value={selected.type || ''}
                    onChange={(e) => setFields((prev) => prev.map((f) => f.id === selected.id ? { ...f, type: e.target.value } : f))}>
                    {CATALOG.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Placeholder</label>
                  <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={selected.translations?.[activeLang]?.placeholder || ''}
                    onChange={(e) => setFields((prev) => prev.map((f) => {
                      if (f.id !== selected.id) return f;
                      const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                      translations[activeLang] = { ...(translations[activeLang] || {}), placeholder: e.target.value };
                      return { ...f, translations };
                    }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Help Text</label>
                  <textarea className="textarea textarea-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" rows={2} value={selected.translations?.[activeLang]?.help || ''}
                    onChange={(e) => setFields((prev) => prev.map((f) => {
                      if (f.id !== selected.id) return f;
                      const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                      translations[activeLang] = { ...(translations[activeLang] || {}), help: e.target.value };
                      return { ...f, translations };
                    }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <select className="select select-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:outline-none focus:border-gray-500" value={selected.width || 'full'}
                    onChange={(e) => setFields((prev) => prev.map((f) => f.id === selected.id ? { ...f, width: e.target.value } : f))}>
                    <option value="full">Full</option>
                    <option value="half">Half</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="req" type="checkbox" checked={!!selected.is_required} onChange={(e) => setFields((prev) => prev.map((f) => f.id === selected.id ? { ...f, is_required: e.target.checked } : f))} />
                  <label htmlFor="req" className="text-sm text-gray-700">Required</label>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Validation</label>
                  <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={selected.validation || ''}
                    onChange={(e) => setFields((prev) => prev.map((f) => f.id === selected.id ? { ...f, validation: e.target.value } : f))} />
                </div>

                {/* Options (for select/multiselect) */}
                {(selected.type === 'select' || selected.type === 'multiselect') && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Options</label>
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-2 mb-1">
                      <div className="col-span-8 text-xs text-gray-500">Label</div>
                      <div className="col-span-3 text-xs text-gray-500">Value</div>
                      <div className="col-span-1" />
                    </div>
                    <div className="space-y-2">
                      {(selected.translations?.[activeLang]?.options || []).map((opt, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            className="col-span-8 input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500"
                            placeholder="Label"
                            value={opt.label || ''}
                            onChange={(e) => setFields((prev) => prev.map((f) => {
                              if (f.id !== selected.id) return f;
                              const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                              const arr = [...(translations[activeLang]?.options || [])];
                              arr[idx] = { ...arr[idx], label: e.target.value };
                              translations[activeLang] = { ...(translations[activeLang] || {}), options: arr };
                              return { ...f, translations };
                            }))}
                          />
                          <input
                            className="col-span-3 input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500"
                            placeholder="Value"
                            value={opt.value || ''}
                            onChange={(e) => setFields((prev) => prev.map((f) => {
                              if (f.id !== selected.id) return f;
                              const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                              const arr = [...(translations[activeLang]?.options || [])];
                              arr[idx] = { ...arr[idx], value: e.target.value };
                              translations[activeLang] = { ...(translations[activeLang] || {}), options: arr };
                              return { ...f, translations };
                            }))}
                          />
                          <button
                            className="col-span-1 p-2 rounded hover:bg-red-50 text-red-600"
                            onClick={() => setFields((prev) => prev.map((f) => {
                              if (f.id !== selected.id) return f;
                              const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                              const arr = [...(translations[activeLang]?.options || [])];
                              arr.splice(idx, 1);
                              translations[activeLang] = { ...(translations[activeLang] || {}), options: arr };
                              return { ...f, translations };
                            }))}
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="pt-1">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-base-300 hover:bg-base-200 cursor-pointer"
                          onClick={() => setFields((prev) => prev.map((f) => {
                            if (f.id !== selected.id) return f;
                            const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                            const arr = [...(translations[activeLang]?.options || [])];
                            arr.push({ label: '', value: '' });
                            translations[activeLang] = { ...(translations[activeLang] || {}), options: arr };
                            return { ...f, translations };
                          }))}
                        >
                          <Icon icon="lucide:plus" className="w-3 h-3" /> Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Form Info below builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">Form Information</div>
            <div className="flex items-center gap-2">
              {(['en-US','vi-VN'] as const).map((lng) => (
                <button key={lng} className={`px-2 py-1 rounded border text-xs ${activeLang === lng ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-200'}`} onClick={() => setActiveLang(lng)}>{lng}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title</label>
              <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={formLang[activeLang].title || ''} onChange={(e) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], title: e.target.value } }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Submit Label</label>
              <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={formLang[activeLang].submit_label || ''} onChange={(e) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], submit_label: e.target.value } }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Success Message</label>
              <textarea className="textarea textarea-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" rows={3} value={formLang[activeLang].success_message || ''} onChange={(e) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], success_message: e.target.value } }))} />
            </div>
          </div>
        </section>
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-900 mb-3">Form Settings</div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select className="select select-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:outline-none focus:border-gray-500" value={formSettings.status || 'draft'} onChange={(e) => setFormSettings((s) => ({ ...s, status: e.target.value }))}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">On Success</label>
              <select className="select select-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:outline-none focus:border-gray-500" value={formSettings.on_success || 'message'} onChange={(e) => setFormSettings((s) => ({ ...s, on_success: e.target.value }))}>
                <option value="redirect">Redirect to URL</option>
                <option value="message">Show Message</option>
              </select>
            </div>
            {formSettings.on_success === 'redirect' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Redirect URL</label>
                <input className="input input-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" value={formSettings.redirect_url || ''} onChange={(e) => setFormSettings((s) => ({ ...s, redirect_url: e.target.value }))} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


