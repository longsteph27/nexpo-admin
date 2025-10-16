'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useSaveForm, useSaveFormWithFields } from '@/hooks/useForms';
import { useAuth } from '@/contexts/AuthContext';
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
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

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

const CATALOG: { id: string; label: string; icon: string }[] = [
  { id: 'input', label: 'Input', icon: 'lucide:type' },
  { id: 'textarea', label: 'Textarea', icon: 'lucide:align-left' },
  { id: 'email', label: 'Email', icon: 'lucide:mail' },
  { id: 'number', label: 'Number', icon: 'lucide:hash' },
  { id: 'select', label: 'Select', icon: 'lucide:chevron-down' },
  { id: 'multiselect', label: 'Multi Select', icon: 'lucide:list' },
  { id: 'file', label: 'File', icon: 'lucide:paperclip' },
  { id: 'image', label: 'Image', icon: 'lucide:image' },
];

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
      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 w-full h-full text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-content-primary shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
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
  index,
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
  index: number;
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
        className={`group relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
          isSelected 
            ? 'border-blue-500 bg-blue-50/50' 
            : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={onSelect}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: isDragging ? 0.3 : 1, 
          y: 0, 
          scale: 1,
          borderColor: isSelected ? '#3b82f6' : 'transparent',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
        }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.3, 
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {fieldLabel}
          {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Render field based on type */}
        {field.type === 'textarea' ? (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none"
            placeholder={fieldPlaceholder}
            rows={3}
            disabled
            readOnly
          />
        ) : field.type === 'select' ? (
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none" disabled>
            <option>{fieldPlaceholder || 'Select an option'}</option>
            {fieldOptions.map((opt, i) => (
              <option key={i}>{opt.label}</option>
            ))}
          </select>
        ) : field.type === 'multiselect' ? (
          <div className="space-y-2 pointer-events-none">
            {fieldOptions.map((opt, i) => (
              <label key={i} className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" disabled />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 pointer-events-none"
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
  dropPosition = null
}: {
  children: React.ReactNode;
  fields: FormField[];
  activeLang: 'en-US' | 'vi-VN';
  formLang: any;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
  isAnyDragging?: boolean;
  dropPosition?: number | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-preview',
  });

  return (
    <div className="relative h-full">
      {/* Main content container */}
      <div 
        ref={setNodeRef}
        className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full overflow-y-auto transition-colors ${
          isOver ? 'border-blue-400 bg-blue-50/30' : ''
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
                  strategy={verticalListSortingStrategy}
                >
                  {fields.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((f, idx) => (
                    <SortableFieldItem
                      key={f.id || `temp-${idx}`}
                      field={f}
                      index={idx}
                      isSelected={selectedId === f.id}
                      activeLang={activeLang}
                      onSelect={() => onSelect(f.id)}
                      onMoveUp={() => onMoveUp(idx)}
                      onMoveDown={() => onMoveDown(idx)}
                      onRemove={() => onRemove(f.id)}
                      isAnyDragging={isAnyDragging}
                      showDropIndicator={dropPosition === idx}
                    />
                  ))}
                </SortableContext>
                
                {/* Drop indicator at the end */}
                {dropPosition === fields.length && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 4 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-blue-500 rounded-full mt-2"
                  />
                )}
                
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
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-blue-50/20" />
        
        {/* Drop zone indicator */}
        <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/30 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
            >
              <Icon icon="lucide:plus" className="w-8 h-8 text-white" />
            </motion.div>
            <motion.p 
              className="text-lg font-semibold text-blue-600 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Drop here to add field
            </motion.p>
            <motion.p 
              className="text-sm text-blue-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Anywhere in this area
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


export default function FormBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const { selectedTenant } = useAuth();
  const eventId = String(params?.id || '');
  const formId = String(params?.formId || '');
  const tenantId = selectedTenant?.id;

  const [, setFormMeta] = useState<{ status?: string; on_success?: string; redirect_url?: string; translations?: Array<{ languages_code: string; title?: string; submit_label?: string; success_message?: string }> } | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [formLang, setFormLang] = useState<{ 'en-US': { title?: string; submit_label?: string; success_message?: string }; 'vi-VN': { title?: string; submit_label?: string; success_message?: string } }>({ 'en-US': {}, 'vi-VN': {} });
  const [formSettings, setFormSettings] = useState<{ status?: string; on_success?: string; redirect_url?: string }>({});

  // Use React Query hook to fetch form data
  const { data: formData } = useForm(formId);
  const saveFormMutation = useSaveForm();
  const saveFormWithFieldsMutation = useSaveFormWithFields();
  const isSaving = saveFormMutation.isPending || saveFormWithFieldsMutation.isPending;

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // dnd-kit drag start handler
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setDropPosition(null);
  };

  // dnd-kit drag over handler
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    
    // Only handle catalog items
    if (!String(active.id).startsWith('catalog-')) return;
    
    if (over && over.id !== 'form-preview') {
      // Find the field index
      const fieldIndex = fields.findIndex(f => f.id === over.id);
      if (fieldIndex !== -1) {
        setDropPosition(fieldIndex);
      }
    } else if (over && over.id === 'form-preview') {
      // Drop at the end
      setDropPosition(fields.length);
    }
  };

  // dnd-kit drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDropPosition(null);

    if (!over) return;

    // Check if dragging from catalog
    if (String(active.id).startsWith('catalog-')) {
      const catalogItem = CATALOG.find(item => `catalog-${item.id}` === active.id);
      if (catalogItem && (over.id === 'form-preview' || fields.some(f => f.id === over.id))) {
        // Add new field from catalog at specified position
        const id = crypto.randomUUID();
        setFields((prev) => {
          let insertIndex = prev.length; // Default to end
          
          if (over.id !== 'form-preview') {
            // Find the field index to insert before
            const fieldIndex = prev.findIndex(f => f.id === over.id);
            if (fieldIndex !== -1) {
              insertIndex = fieldIndex;
            }
          }
          
          const newField = { 
            id, 
            type: catalogItem.id, 
            name: catalogItem.label, 
            sort: insertIndex + 1 
          };
          
          const updated = [...prev];
          updated.splice(insertIndex, 0, newField);
          
          // Update sort values
          updated.forEach((field, index) => {
            field.sort = index + 1;
          });
          
          console.log('[handleDragEnd] Added field from catalog:', { id, type: catalogItem.id, label: catalogItem.label, insertIndex });
          return updated;
        });
        setSelectedId(id);
      }
      return;
    }

    // Handle field reordering
    if (active.id === over.id) return;

    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      console.log('[handleDragEnd] Reordering:', { 
        activeId: active.id, 
        overId: over.id, 
        oldIndex, 
        newIndex 
      });

      const updated = arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ 
        ...f, 
        sort: i + 1 
      }));

      console.log('[handleDragEnd] Updated sorts:', updated.map(f => ({ 
        id: f.id, 
        name: f.name, 
        sort: f.sort 
      })));

      return updated;
    });
  };

  // Move field using buttons
  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      
      console.log('[moveField] Moving field from index', index, 'to', newIndex);
      
      const updated = arrayMove(arr, index, newIndex).map((f, i) => ({ 
        ...f, 
        sort: i + 1 
      }));
      
      console.log('[moveField] Updated sorts:', updated.map(f => ({ id: f.id, name: f.name, sort: f.sort })));
      
      return updated;
    });
  };

  const selected = useMemo(() => fields.find((f) => f.id === selectedId) || null, [fields, selectedId]);

  // Helper function to process translations with create/update/delete structure
  const processTranslations = (translations: any[], originalTranslations: any[] = []) => {
    if (!translations || translations.length === 0) {
      return undefined;
    }

    const translationsPayload: any = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[]
    };

    const originalTranslationIds = new Set(originalTranslations.map((t: any) => t.id));
    const currentTranslationIds = new Set(translations.map(t => t.id).filter(id => id));

    // Find translations to delete
    for (const originalTranslation of originalTranslations) {
      if (!currentTranslationIds.has(originalTranslation.id)) {
        translationsPayload.delete.push(originalTranslation.id);
      }
    }

    // Categorize current translations
    for (const translation of translations) {
      if (translation.id && originalTranslationIds.has(translation.id)) {
        // Update existing translation
        translationsPayload.update.push(translation);
      } else if (!translation.id) {
        // Create new translation
        translationsPayload.create.push(translation);
      }
    }

    return translationsPayload;
  };

  // Helper function to compare field objects deeply
  const areFieldsEqual = (field1: any, field2: any) => {
    if (!field1 || !field2) return false;
    
    return (
      field1.name === field2.name &&
      field1.type === field2.type &&
      field1.width === field2.width &&
      field1.sort === field2.sort &&
      field1.is_required === field2.is_required &&
      field1.validation === field2.validation &&
      field1.conditions === field2.conditions
    );
  };

  // Helper function to process form fields with optimized create/update/delete structure
  const processFormFields = (currentFields: any[], originalFields: any[] = []) => {
    console.log('[processFormFields] Processing fields:', {
      currentFields: currentFields.length,
      originalFields: originalFields.length,
      currentFieldsWithPayload: currentFields.filter(f => f._payload).length,
    });

    const fieldsPayload: any = {
      create: [] as any[],
      update: [] as any[],
      delete: [] as string[]
    };

    // Track processed field IDs to avoid duplicates
    const processedIds = new Set<string>();

    // 1. Process new fields (have _payload)
    for (const field of currentFields) {
      if (field._payload) {
        console.log('[processFormFields] Adding new field to create:', field._payload);
        fieldsPayload.create.push(field._payload);
        processedIds.add(field.id);
      }
    }

    // 2. Process existing fields (check for changes)
    const originalFieldIds = new Set(originalFields.map((f: any) => f.id));
    
    for (const field of currentFields) {
      if (field.id && originalFieldIds.has(field.id) && !processedIds.has(field.id)) {
        const originalField = originalFields.find((f: any) => f.id === field.id);
        if (originalField) {
          const hasChanges = !areFieldsEqual(field, originalField);
          
          if (hasChanges) {
            console.log('[processFormFields] Field has changes, adding to update:', {
              fieldId: field.id,
              original: originalField,
              current: field,
            });
            
            const fieldData = {
              id: field.id,
              name: field.name,
              type: field.type,
              width: field.width,
              sort: field.sort,
              is_required: field.is_required,
              validation: field.validation,
              conditions: field.conditions,
              event_id: Number(eventId),
              tenant_id: Number(tenantId),
      translations: {
                create: [],
                update: [],
                delete: [],
              },
            };
            fieldsPayload.update.push(fieldData);
          } else {
            console.log('[processFormFields] Field unchanged, skipping:', field.id);
          }
        }
        processedIds.add(field.id);
      }
    }

    // 3. Find fields to delete
    const currentFieldIds = new Set(currentFields.map(f => f.id).filter(id => id));
    for (const originalField of originalFields) {
      if (!currentFieldIds.has(originalField.id)) {
        console.log('[processFormFields] Field deleted, adding to delete:', originalField.id);
        fieldsPayload.delete.push(originalField.id);
      }
    }

    console.log('[processFormFields] Final payload:', fieldsPayload);
    return fieldsPayload;
  };

  // Save form
  const handleSave = () => {
    if (!formId || !eventId || !tenantId) return;
    
    // Get original form data for comparison
    const originalForm = formData as any;
    const originalTranslations = originalForm?.translations || [];
    const originalFields = originalForm?.fields || [];

           // No form translations in this payload - only fields
      
    // Process form fields with create/update/delete structure
    const processedFields = fields.map((field, index) => ({
        id: field.id,
        name: field.name || `field_${index + 1}`,
        type: (field.type as 'input' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'image') || 'input',
        width: (field.width as 'full' | 'half') || 'full',
        sort: field.sort || index,
        is_required: field.is_required || false,
        validation: field.validation || undefined,
        conditions: field.conditions || undefined,
        // Preserve _payload for new fields
        _payload: field._payload,
    }));

    console.log('[handleSave] Processed fields:', {
      originalFields: fields,
      processedFields: processedFields,
      fieldsWithPayload: processedFields.filter(f => f._payload),
    });

           // Format form data with create/update/delete structure (only fields)
           const processedFieldsPayload = processFormFields(processedFields, originalFields);
           
           const formDataWithFields = {
             status: (formSettings.status as 'draft' | 'published' | 'archived') || 'draft',
             on_success: (formSettings.on_success as 'redirect' | 'message') || 'message',
             redirect_url: formSettings.redirect_url || undefined,
             event_id: Number(eventId),
             tenant_id: Number(tenantId),
             
             fields: processedFieldsPayload,
           };

           console.log('[handleSave] Current fields state:', {
             fields: fields,
             fieldsWithPayload: fields.filter(f => f._payload),
             processedFields: processedFields,
             processedFieldsPayload: processedFieldsPayload,
           });

           // Debug: Check if we have any fields with _payload
           const fieldsWithPayload = fields.filter(f => f._payload);
           console.log('[handleSave] Fields with payload:', {
             count: fieldsWithPayload.length,
             fields: fieldsWithPayload.map(f => ({
               id: f.id,
               name: f.name,
               type: f.type,
               hasPayload: !!f._payload,
               payload: f._payload
             }))
           });

    console.log('[handleSave] Saving form with payload:', {
      formId,
      eventId,
      tenantId,
      formData: formDataWithFields,
    });

           console.log('[handleSave] Calling saveFormWithFieldsMutation with:', {
             formId,
             eventId,
             tenantId: Number(tenantId),
             formData: formDataWithFields,
             fieldsInPayload: formDataWithFields.fields,
             createCount: formDataWithFields.fields.create.length,
             updateCount: formDataWithFields.fields.update.length,
             deleteCount: formDataWithFields.fields.delete.length,
           });

           saveFormWithFieldsMutation.mutate(
             { 
               formId, 
               eventId, 
               tenantId: Number(tenantId), 
               formData: formDataWithFields 
             },
             {
               onSuccess: (data) => {
                 console.log('[handleSave] Save successful:', data);
          toast.success('Form saved successfully!', {
            description: 'All changes have been saved to Directus.',
          });
        },
        onError: (error) => {
                 console.error('[handleSave] Save failed:', error);
          toast.error('Failed to save form', {
            description: error.message,
          });
        },
      }
    );
  };

  // Add field from catalog
  const addFieldFromCatalog = (type: string, label: string) => {
      const id = crypto.randomUUID();
      const fieldName = `${type}_${Date.now()}`;
      const fieldSort = fields.length;
      
      // Create pre-built payload structure first
      const payload = {
        name: fieldName,
        type: type,
        width: 'full',
        sort: fieldSort,
        is_required: false,
        validation: undefined,
        conditions: undefined,
        event_id: Number(eventId),
        tenant_id: Number(tenantId),
        translations: {
          create: [
            {
              label: label,
              languages_code: { code: 'en-US' },
              placeholder: undefined,
              help: undefined,
              options: undefined,
            },
            {
              label: label,
              languages_code: { code: 'vi-VN' },
              placeholder: undefined,
              help: undefined,
              options: undefined,
            },
          ],
          update: [],
          delete: [],
        },
      };
      
      // Create new field with pre-built payload structure
      const newField = {
        id,
        type,
        name: fieldName,
        sort: fieldSort,
        is_required: false,
        validation: undefined,
        conditions: undefined,
        width: 'full',
        translations: {
          'en-US': {
            label: label,
            placeholder: undefined,
            help: undefined,
            options: undefined,
          },
          'vi-VN': {
            label: label,
            placeholder: undefined,
            help: undefined,
            options: undefined,
          },
        },
        // Use the pre-built payload
        _payload: payload,
      };

      setFields((prev) => {
        const updated = [...prev, newField];
        console.log('[addFieldFromCatalog] Added field with payload:', { 
          id, 
          type, 
          label, 
          payload: newField._payload,
          totalFields: updated.length,
          fieldsWithPayload: updated.filter(f => f._payload).length
        });
        return updated;
      });
      setSelectedId(id);
  };

  // Helper function to update field and its payload
  const updateField = (id: string, updates: any) => {
    setFields((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      
      const updatedField = { ...f, ...updates };
      
      // Always preserve _payload for new fields (fields without real ID from database)
      if (f._payload) {
        updatedField._payload = {
          ...f._payload,
          ...updates,
          // Update translations in payload if they exist
          translations: f._payload.translations ? {
            ...f._payload.translations,
            create: f._payload.translations.create.map((t: any) => ({
              ...t,
              label: updates.translations?.[t.languages_code?.code || t.languages_code]?.label || t.label,
              placeholder: updates.translations?.[t.languages_code?.code || t.languages_code]?.placeholder || t.placeholder,
              help: updates.translations?.[t.languages_code?.code || t.languages_code]?.help || t.help,
              options: updates.translations?.[t.languages_code?.code || t.languages_code]?.options || t.options,
            })),
          } : undefined,
        };
        
        console.log('[updateField] Preserved _payload for field:', {
          id,
          updates,
          payload: updatedField._payload
        });
      }
      
      return updatedField;
    }));
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
            <h1 className="mt-2 text-2xl font-bold text-content-primary tracking-tight">Design your form</h1>
            <p className="text-content-secondary mt-1">Event <span className="font-medium">{eventId}</span> • Form <span className="font-medium">{formId}</span></p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
              <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
              Back
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
          <PanelGroup direction="horizontal" className="min-h-[600px]">
            {/* Catalog Panel */}
            <Panel defaultSize={20} minSize={15} maxSize={30}>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full">
            <div className="text-sm font-semibold text-content-primary mb-3">Field Types</div>
            <div className="grid grid-cols-2 gap-2">
                  <SortableContext items={CATALOG.map(t => `catalog-${t.id}`)}>
                    <AnimatePresence>
                      {CATALOG.map((t, index) => (
                        <motion.div
                  key={t.id}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -20 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                          layout
                        >
                          <CatalogItem
                            item={t}
                            onClick={() => addFieldFromCatalog(t.id, t.label)}
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
            <div className="relative h-full">
              <FormPreviewDroppable
                fields={fields}
                activeLang={activeLang}
                formLang={formLang}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMoveUp={(idx) => moveField(idx, -1)}
                onMoveDown={(idx) => moveField(idx, 1)}
                onRemove={removeField}
                isAnyDragging={!!activeId}
                dropPosition={dropPosition}
              >
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Icon icon="lucide:eye" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-content-primary">Form Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  {(['en-US','vi-VN'] as const).map((lng) => (
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
            <div className="text-sm font-semibold text-content-primary mb-3">Field Settings</div>
            {!selected && <div className="text-sm text-content-tertiary">Select a field to edit its settings</div>}
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
                  <label className="block text-xs text-content-secondary mb-1">Type</label>
                  <Select value={selected.type || ''} onValueChange={(value) => updateField(selected.id, { type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOG.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
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
                  <label className="block text-xs text-content-secondary mb-1">Help Text</label>
                  <textarea className="textarea textarea-ghost w-full rounded-none px-0 border-0 border-b border-gray-300 focus:border-gray-500" rows={2} value={selected.translations?.[activeLang]?.help || ''}
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
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="half">Half</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="req" type="checkbox" checked={!!selected.is_required} onChange={(e) => updateField(selected.id, { is_required: e.target.checked })} />
                  <label htmlFor="req" className="text-sm text-content-primary">Required</label>
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
                      <div className="col-span-8 text-xs text-content-tertiary">Label</div>
                      <div className="col-span-3 text-xs text-content-tertiary">Value</div>
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
            <div className="text-sm font-semibold text-content-primary">Form Information</div>
            <div className="flex items-center gap-2">
              {(['en-US','vi-VN'] as const).map((lng) => (
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
          <div className="text-sm font-semibold text-content-primary mb-3">Form Settings</div>
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
            <div className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 text-sm rounded-lg border border-gray-200 bg-white text-content-primary shadow-lg">
              {activeId.startsWith('catalog-') ? (
                <>
                  <Icon icon={CATALOG.find(t => `catalog-${t.id}` === activeId)?.icon || 'lucide:type'} className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium">{CATALOG.find(t => `catalog-${t.id}` === activeId)?.label || 'Field'}</span>
                </>
              ) : (
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50 min-w-[200px]">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {fields.find(f => f.id === activeId)?.translations?.[activeLang]?.label || fields.find(f => f.id === activeId)?.name || 'Field'}
                  </div>
                  <div className="w-full h-8 bg-gray-200 rounded border"></div>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
    </div>
  );
}



