'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Icon } from '@iconify/react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Import custom hooks and utilities
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useFormFields } from '@/hooks/useFormFields';
import { CATALOG, FormField } from '@/lib/utils/formBuilderUtils';


// Catalog Item Component (Draggable)
function CatalogItem({
  item,
  onClick
}: {
  item: { id: string; label: string; icon: string };
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: `catalog-${item.id}`,
    data: {
      type: 'catalog-item',
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 w-full h-full text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-content-primary shadow-sm transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''
        }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.95 : 1,
        y: 0
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{
        scale: 1.05,
        backgroundColor: '#f9fafb',
        borderColor: '#3b82f6',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
      >
        <Icon icon={item.icon} className="w-4 h-4 text-gray-600" />
      </motion.div>
      <motion.span
        className="text-xs font-medium"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.2 }}
      >
        {item.label}
      </motion.span>
    </motion.button>
  );
}

// Sortable Field Item Component
function SortableFieldItem({
  field,
  isSelected,
  activeLang,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  isAnyDragging = false,
  showDropIndicator = false
}: {
  field: FormField;
  isSelected: boolean;
  activeLang: 'en-US' | 'vi-VN';
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isAnyDragging?: boolean;
  showDropIndicator?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldLabel = field.translations?.[activeLang]?.label || field.name || 'Untitled Field';
  const fieldPlaceholder = field.translations?.[activeLang]?.placeholder || '';
  const fieldHelp = field.translations?.[activeLang]?.help || '';
  const fieldOptions = field.translations?.[activeLang]?.options || [];

  return (
    <>
      {/* Drop Indicator Above */}
      {showDropIndicator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-blue-500 rounded-full mb-2"
        />
      )}

      <motion.div
        ref={setNodeRef}
        style={{
          ...style,
          pointerEvents: (isDragging || isAnyDragging) ? 'none' : 'auto'
        }}
        className={`group relative p-3 rounded-lg border-2 transition-all cursor-pointer ${isSelected
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
          } ${isDragging ? 'opacity-30 scale-95' : ''}`}
        onClick={onSelect}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: isDragging ? 0.3 : 1,
          y: 0,
          scale: isDragging ? 0.95 : 1,
          borderColor: isSelected ? '#3b82f6' : 'transparent',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          zIndex: isDragging ? 1000 : 'auto'
        }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          duration: isDragging ? 0.1 : 0.3,
          ease: "easeOut",
          layout: { duration: 0.2 }
        }}
        whileHover={{
          borderColor: isSelected ? '#3b82f6' : '#d1d5db',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)'
        }}
      >
        {/* Field Actions - Show on hover or when selected */}
        <motion.div
          className="absolute -top-2 -right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={{ scale: 0.8 }}
          animate={{
            scale: isSelected ? 1 : 0.8
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            title="Move up"
            whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:chevron-up" className="w-3 h-3 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            title="Move down"
            whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:chevron-down" className="w-3 h-3 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-1 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 text-red-600"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Delete"
            whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:trash-2" className="w-3 h-3" />
          </motion.button>
        </motion.div>

        {/* Drag Handle */}
        <motion.div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={{ scale: 0.8, x: -10 }}
          animate={{
            scale: isSelected ? 1 : 0.8,
            x: isSelected ? 0 : -10
          }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="p-1 bg-white border border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing"
            whileHover={{
              scale: 1.1,
              backgroundColor: '#f8fafc',
              borderColor: '#3b82f6'
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:grip-vertical" className="w-3 h-3 text-gray-400" />
          </motion.div>
        </motion.div>

        {/* Field Preview */}
        <div className="min-h-[80px] flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {fieldLabel}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {/* Render field based on type */}
          {field.type === 'textarea' ? (
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none flex-1"
              placeholder={fieldPlaceholder}
              rows={3}
              disabled
              readOnly
            />
          ) : field.type === 'select' ? (
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none h-10" disabled>
              <option>{fieldPlaceholder || 'Select an option'}</option>
              {fieldOptions.map((opt, i) => (
                <option key={i}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'multiselect' ? (
            <div className="space-y-2 pointer-events-none flex-1">
              {fieldOptions.slice(0, 3).map((opt, i) => (
                <label key={i} className="flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded" disabled />
                  <span>{opt.label}</span>
                </label>
              ))}
              {fieldOptions.length > 3 && (
                <div className="text-xs text-gray-500">+{fieldOptions.length - 3} more options...</div>
              )}
            </div>
          ) : (
            <input
              type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none h-10"
              placeholder={fieldPlaceholder}
              disabled
              readOnly
            />
          )}

          {fieldHelp && (
            <p className="text-xs text-gray-500 mt-1">{fieldHelp}</p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// Form Preview Droppable Component
function FormPreviewDroppable({
  children,
  fields,
  activeLang,
  formLang,
  selectedId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  isAnyDragging = false,
  dropPosition = null,
  activeId = null
}: {
  children: React.ReactNode;
  fields: FormField[];
  activeLang: 'en-US' | 'vi-VN';
  formLang: { 'en-US': { title?: string; submit_label?: string; success_message?: string }; 'vi-VN': { title?: string; submit_label?: string; success_message?: string } };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
  isAnyDragging?: boolean;
  dropPosition?: number | null;
  activeId?: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-preview',
  });

  return (
    <div className="relative h-full">
      {/* Main content container */}
      <div
        ref={setNodeRef}
        className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full overflow-y-auto transition-colors ${isOver ? 'border-blue-400 bg-blue-50/30' : ''
          }`}
      >
        {children}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {fields.length === 0 ? (
              <motion.div
                key="empty-state"
                className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
                >
                  <Icon icon="lucide:mouse-pointer-click" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                </motion.div>
                <motion.p
                  className="text-sm text-gray-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  Drag field types from the left or click to add fields
                </motion.p>
              </motion.div>
            ) : (
              <div className="relative">
                <SortableContext
                  items={fields.map(f => f.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {fields.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((field, idx) => (
                      <div
                        key={field.id || `temp-${idx}`}
                        className={`${field.width === 'half'
                          ? 'md:col-span-1'
                          : 'col-span-1 md:col-span-2'
                          } self-start`}
                      >
                        {/* Drop overlay before this field */}
                        {isAnyDragging && dropPosition === idx && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="border-2 border-dashed border-blue-500 rounded-lg bg-blue-50/50 min-h-[120px] flex items-center justify-center relative mb-4"
                          >
                            <div className="text-center text-blue-600">
                              <Icon icon="lucide:plus" className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                              <p className="text-sm font-medium">Drop here</p>
                              <p className="text-xs text-blue-500 mt-1">Position {idx + 1}</p>
                            </div>

                            {/* Show preview of field being dragged */}
                            {isAnyDragging && !String(activeId || '').startsWith('catalog-') && (
                              <div className="absolute inset-2 border border-blue-300 rounded bg-blue-100/30 flex items-center justify-center">
                                <div className="text-xs text-blue-600 font-medium">
                                  {fields.find(f => f.id === activeId)?.translations?.[activeLang]?.label ||
                                    fields.find(f => f.id === activeId)?.name || 'Field'}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        <SortableFieldItem
                          field={field}
                          isSelected={selectedId === field.id}
                          activeLang={activeLang}
                          onSelect={() => onSelect(field.id)}
                          onMoveUp={() => onMoveUp(idx)}
                          onMoveDown={() => onMoveDown(idx)}
                          onRemove={() => onRemove(field.id)}
                          isAnyDragging={isAnyDragging}
                          showDropIndicator={false}
                        />
                      </div>
                    ))}

                    {/* Drop overlay at the end */}
                    {isAnyDragging && dropPosition === fields.length && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="col-span-1 md:col-span-2 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50/50 min-h-[120px] flex items-center justify-center relative mt-4"
                      >
                        <div className="text-center text-blue-600">
                          <Icon icon="lucide:plus" className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p className="text-sm font-medium">Drop here</p>
                          <p className="text-xs text-blue-500 mt-1">At the end</p>
                        </div>

                        {/* Show preview of field being dragged */}
                        {isAnyDragging && !String(activeId || '').startsWith('catalog-') && (
                          <div className="absolute inset-2 border border-blue-300 rounded bg-blue-100/30 flex items-center justify-center">
                            <div className="text-xs text-blue-600 font-medium">
                              {fields.find(f => f.id === activeId)?.translations?.[activeLang]?.label ||
                                fields.find(f => f.id === activeId)?.name || 'Field'}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </SortableContext>

                {/* Drop zone for adding new fields at the end */}
                <div className="min-h-[4px] w-full" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button Preview - Always at bottom */}
        <AnimatePresence>
          {fields.length > 0 && (
            <motion.div
              className="mt-6 pt-4 border-t border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.button
                type="button"
                className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm opacity-50 cursor-not-allowed"
                disabled
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                {formLang[activeLang]?.submit_label || 'Submit'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Coverage Drop Zone Overlay - Independent of content */}
      <motion.div
        className="absolute inset-0 z-30"
        initial={{ opacity: 0, pointerEvents: 'none' }}
        animate={{
          opacity: isOver ? 1 : 0,
          pointerEvents: isOver ? 'auto' : 'none'
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30
        }}
      >
        {/* Semi-transparent overlay with animated border */}
        <div className="absolute inset-0 bg-blue-50/20" />

        {/* Animated dashed border around entire drop zone */}

      </motion.div>
    </div>
  );
}


export default function FormBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params?.id || '');
  const formId = String(params?.formId || '');

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


  return (
    <div className="w-full h-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">Form Builder</div>
          <h1 className="mt-2 text-2xl font-bold text-content-primary tracking-tight">Design your form</h1>
          <p className="text-content-secondary mt-1">Event <span className="font-medium">{eventId}</span> • Form <span className="font-medium">{formId}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Back
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
            disabled={isSaving}
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



