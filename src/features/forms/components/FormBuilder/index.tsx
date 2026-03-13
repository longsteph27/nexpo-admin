'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useFormFields, CATALOG } from '../../hooks/useFormFields';
import { CatalogItem } from './CatalogItem';
import { FormPreviewDroppable } from './FormPreviewDroppable';
import { ConditionsEditor } from './ConditionsEditor';
import { buildFormEmbedScriptSnippet } from '../../services/formBuilderService';

export interface FormBuilderProps {
  eventId: string;
  formId: string;
}


export function FormBuilder({ eventId, formId }: FormBuilderProps) {
  const router = useRouter();

  // Use custom hooks
  const {
    fields,
    selectedId,
    setSelectedId,
    activeLang,
    setActiveLang,
    formLang,
    setFormLang,
    formSettings,
    setFormSettings,
    selected,
    isSaving,
    handleSave,
    setFields,
    savedForm,
    canSave,
  } = useFormBuilder(formId, eventId);
  const {
    activeId,
    dropPosition,
    addFieldFromCatalog,
    updateField,
    removeField,
    moveField,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useFormFields(fields, setFields, eventId, undefined);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://app.nexpo.vn';

  const handleCopyEmbedScript = React.useCallback(() => {
    if (!savedForm) {
      toast.error('Please save the form before copying the embed script.');
      return;
    }

    const snippet = buildFormEmbedScriptSnippet(savedForm, { directusUrl });
    if (!snippet) {
      toast.error('Unable to generate embed script for this form.');
      return;
    }

    const copyToClipboard = async (text: string) => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    copyToClipboard(snippet)
      .then(() => {
        toast.success('Embed script copied to clipboard.');
      })
      .catch(() => {
        toast.error('Failed to copy embed script.');
      });
  }, [savedForm, directusUrl]);

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">Form Builder</div>
          <h1 className="mt-2 text-2xl font-bold text-content-primary tracking-tight">Design your form</h1>
          {/* <p className="text-content-secondary mt-1">Event <span className="font-medium">{eventId}</span> • Form <span className="font-medium">{formId}</span></p> */}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyEmbedScript}
            disabled={!savedForm}
          >
            <Icon icon="lucide:copy" className="w-4 h-4 mr-2" />
            Copy Script
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/events/${eventId}/forms/${formId}/email-template`)}
          >
            <Icon icon="lucide:mail" className="w-4 h-4 mr-2" />
            Email Template
          </Button>
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={!canSave}
          >
            <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Three-panel builder with resizable panels */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <PanelGroup direction="horizontal" className="h-[calc(100vh-200px)]">
          {/* Catalog Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full overflow-y-auto">
              <div className="text-sm font-semibold text-content-primary mb-3">Field Types</div>
              <div className="grid grid-cols-2 gap-2">
                <SortableContext items={CATALOG.map(t => `catalog-${t.id}`)}>
                  <AnimatePresence>
                    {CATALOG.map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                        layout
                      >
                        <CatalogItem
                          item={t}
                          onClick={() => {
                            const newId = addFieldFromCatalog(t.id, t.label);
                            setSelectedId(newId);
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="group relative w-2 flex items-center justify-center cursor-col-resize">
            <div className="w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-all duration-200 group-hover:h-16" />
          </PanelResizeHandle>

          {/* Form Preview Panel */}
          <Panel defaultSize={50} minSize={30}>
            <div className="relative h-full overflow-y-auto">
              <FormPreviewDroppable
                fields={fields}
                activeLang={activeLang}
                formLang={formLang}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMoveUp={(idx) => moveField(idx, -1)}
                onMoveDown={(idx) => moveField(idx, 1)}
                onRemove={(id) => removeField(id, selectedId, setSelectedId)}
                isAnyDragging={!!activeId}
                dropPosition={dropPosition}
                activeId={activeId}
              >
                {/* Preview Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Icon icon="lucide:eye" className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-content-primary">Form Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['en-US', 'vi-VN'] as const).map((lng) => (
                      <button
                        key={lng}
                        className={`px-2 py-1 rounded text-xs ${activeLang === lng ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setActiveLang(lng)}
                      >
                        {lng === 'en-US' ? 'EN' : 'VI'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Title & Description */}
                {(formLang[activeLang]?.title || formLang[activeLang]?.submit_label) && (
                  <div className="mb-6 text-center">
                    {formLang[activeLang]?.title && (
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {formLang[activeLang].title}
                      </h2>
                    )}
                  </div>
                )}
              </FormPreviewDroppable>

            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="group relative w-2 flex items-center justify-center cursor-col-resize">
            <div className="w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-all duration-200 group-hover:h-16" />
          </PanelResizeHandle>

          {/* Inspector Panel */}
          <Panel defaultSize={30} minSize={20} maxSize={40}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="lucide:settings-2" className="w-4 h-4 text-blue-600" />
                <div className="text-sm font-semibold text-content-primary">Field Settings</div>
              </div>
              {!selected && <div className="text-sm text-content-tertiary">Select a field to edit its settings</div>}
              {selected && (
                <motion.div className="space-y-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Language Tabs */}
                  <div className="flex items-center gap-2 mb-1">
                    {(['en-US', 'vi-VN'] as const).map((lng) => (
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
                    <Input
                      label="Label"
                      value={selected.translations?.[activeLang]?.label || ''}
                      onChange={(e) => setFields((prev) => prev.map((f) => {
                        if (f.id !== selected.id) return f;
                        const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                        translations[activeLang] = { ...(translations[activeLang] || {}), label: e.target.value };
                        return { ...f, translations };
                      }))}
                    />
                  </div>
                  <div>
                    <Input
                      label="Field Name"
                      value={selected.name || ''}
                      onChange={(e) => updateField(selected.id, { name: e.target.value })}
                      placeholder="e.g., user_email, phone_number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-content-secondary mb-2">Type</label>
                    <Select value={selected.type || ''} onValueChange={(value) => updateField(selected.id, { type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATALOG.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <Icon icon={t.icon} className="w-3 h-3" />
                              {t.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      label="Placeholder"
                      value={selected.translations?.[activeLang]?.placeholder || ''}
                      onChange={(e) => setFields((prev) => prev.map((f) => {
                        if (f.id !== selected.id) return f;
                        const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                        translations[activeLang] = { ...(translations[activeLang] || {}), placeholder: e.target.value };
                        return { ...f, translations };
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-content-secondary mb-2">Help Text</label>
                    <textarea
                      className="w-full border-0 border-b-2 rounded-sm border-nexpo-light-gray focus:border-gray-900 outline-none py-2 px-3 text-content-primary bg-transparent placeholder-gray-400 resize-none"
                      rows={2}
                      value={selected.translations?.[activeLang]?.help || ''}
                      onChange={(e) => setFields((prev) => prev.map((f) => {
                        if (f.id !== selected.id) return f;
                        const translations = { ...(f.translations || {}) } as { 'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] }; 'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] } };
                        translations[activeLang] = { ...(translations[activeLang] || {}), help: e.target.value };
                        return { ...f, translations };
                      }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-content-secondary mb-1">Width</label>
                    <Select value={selected.width || 'full'} onValueChange={(value) => updateField(selected.id, { width: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select width" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">
                          <div className="flex items-center gap-2">
                            <Icon icon="lucide:maximize-2" className="w-3 h-3" />
                            Full
                          </div>
                        </SelectItem>
                        <SelectItem value="half">
                          <div className="flex items-center gap-2">
                            <Icon icon="lucide:minimize-2" className="w-3 h-3" />
                            Half
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="req" type="checkbox" checked={!!selected.is_required} onChange={(e) => updateField(selected.id, { is_required: e.target.checked })} />
                    <label htmlFor="req" className="text-xs text-content-secondary">Required</label>
                  </div>
                  
                  {/* Group Field Setting - Only show if form allows groups */}
                  {formSettings.is_allow_group && (
                    <div className="flex items-center gap-2">
                      <input 
                        id="group-field" 
                        type="checkbox" 
                        checked={!!selected.is_group_field} 
                        onChange={(e) => updateField(selected.id, { is_group_field: e.target.checked })} 
                      />
                      <label htmlFor="group-field" className="text-xs text-content-secondary">Group Field</label>
                    </div>
                  )}
                  <div>
                    <Input
                      label="Validation"
                      value={selected.validation || ''}
                      onChange={(e) => updateField(selected.id, { validation: e.target.value })}
                    />
                  </div>

                  {/* Options (for select/multiselect) */}
                  {(selected.type === 'select' || selected.type === 'multiselect') && (
                    <div>
                      <label className="block text-xs text-content-secondary mb-2">Options</label>
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 mb-1">
                        <div className="col-span-8 text-xs text-content-secondary">Label</div>
                        <div className="col-span-3 text-xs text-content-secondary">Value</div>
                        <div className="col-span-1" />
                      </div>
                      <div className="space-y-2">
                        {(selected.translations?.[activeLang]?.options || []).map((opt, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-8">
                              <Input
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
                            </div>
                            <div className="col-span-3">
                              <Input
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
                            </div>
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
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-base-300 hover:bg-base-200"
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

                  {/* Conditions */}
                  <div className="pt-3 border-t border-gray-100">
                    <ConditionsEditor
                      conditions={selected.conditions || []}
                      allFields={fields}
                      currentFieldId={selected.id}
                      activeLang={activeLang}
                      onChange={(conds) => updateField(selected.id, { conditions: conds })}
                    />
                  </div>
                </motion.div>
              )}

              {/* Form Info & Settings */}
              <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:info" className="w-4 h-4 text-blue-600" />
                      <div className="text-sm font-semibold text-content-primary">Form Information</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['en-US', 'vi-VN'] as const).map((lng) => (
                        <button key={lng} className={`px-2 py-1 rounded border text-xs ${activeLang === lng ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-200'}`} onClick={() => setActiveLang(lng)}>{lng}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Input
                        label="Title"
                        value={formLang[activeLang].title || ''}
                        onChange={(e) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], title: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <Input
                        label="Submit Label"
                        value={formLang[activeLang].submit_label || ''}
                        onChange={(e) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], submit_label: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-content-secondary mb-1">Success Message</label>
                      <RichTextEditor
                        value={formLang[activeLang].success_message || ''}
                        onChange={(value) => setFormLang((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], success_message: value } }))}
                        placeholder="Enter success message..."
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="lucide:sliders" className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-semibold text-content-primary">Form Settings</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-content-secondary mb-1">Status</label>
                      <Select value={formSettings.status || 'draft'} onValueChange={(value) => setFormSettings((s) => ({ ...s, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-content-secondary mb-1">On Success</label>
                      <Select value={formSettings.on_success || 'message'} onValueChange={(value) => setFormSettings((s) => ({ ...s, on_success: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="redirect">Redirect to URL</SelectItem>
                          <SelectItem value="message">Show Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formSettings.on_success === 'redirect' && (
                      <div>
                        <Input
                          label="Redirect URL"
                          value={formSettings.redirect_url || ''}
                          onChange={(e) => setFormSettings((s) => ({ ...s, redirect_url: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    {/* Group Settings */}
                    <div className="flex items-center gap-2">
                      <input 
                        id="allow-group" 
                        type="checkbox" 
                        checked={!!formSettings.is_allow_group} 
                        onChange={(e) => setFormSettings((s) => ({ ...s, is_allow_group: e.target.checked }))} 
                      />
                      <label htmlFor="allow-group" className="text-xs text-content-secondary">Allow Group Registration</label>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </Panel>
        </PanelGroup>


        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="flex items-center justify-center">
              {activeId.startsWith('catalog-') ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg shadow-lg">
                  <Icon
                    icon={CATALOG.find(t => `catalog-${t.id}` === activeId)?.icon || 'lucide:type'}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    {CATALOG.find(t => `catalog-${t.id}` === activeId)?.label || 'Field'}
                  </span>
                </div>
              ) : (
                <div className="bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 min-w-[200px]">
                  <div className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <Icon icon="lucide:move" className="w-3 h-3" />
                    {fields.find(f => f.id === activeId)?.translations?.[activeLang]?.label ||
                      fields.find(f => f.id === activeId)?.name || 'Field'}
                    {fields.find(f => f.id === activeId)?.is_required && <span className="text-red-500">*</span>}
                  </div>

                  {/* Simple field preview */}
                  <div className="w-full h-8 bg-gray-100 border border-gray-300 rounded text-xs flex items-center px-2 text-gray-500">
                    {fields.find(f => f.id === activeId)?.type || 'field'} preview
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default FormBuilder;



