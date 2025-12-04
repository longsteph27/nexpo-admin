import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { BuilderFormField } from '../types';

export const CATALOG = [
  { id: 'input', label: 'Input', icon: 'lucide:type' },
  { id: 'textarea', label: 'Textarea', icon: 'lucide:align-left' },
  { id: 'email', label: 'Email', icon: 'lucide:mail' },
  { id: 'number', label: 'Number', icon: 'lucide:hash' },
  { id: 'select', label: 'Select', icon: 'lucide:chevron-down' },
  { id: 'multiselect', label: 'Multi Select', icon: 'lucide:list' },
  { id: 'file', label: 'File', icon: 'lucide:paperclip' },
  { id: 'image', label: 'Image', icon: 'lucide:image' },
];

export function useFormFields(
  fields: BuilderFormField[],
  setFields: React.Dispatch<React.SetStateAction<BuilderFormField[]>>,
  eventId: string,
  tenantId: number | undefined
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  // Add field from catalog
  const addFieldFromCatalog = useCallback((type: string, label: string) => {
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
      validation: '',
      conditions: null as any,
      event_id: Number(eventId),
      tenant_id: Number(tenantId),
      translations: {
        create: [
          {
            label: label,
            languages_code: { code: 'en-US' },
            placeholder: '',
            help: '',
            options: [],
          },
          {
            label: label,
            languages_code: { code: 'vi-VN' },
            placeholder: '',
            help: '',
            options: [],
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
      validation: '',
      conditions: null as any,
      width: 'full',
      translations: {
        'en-US': {
          label: label,
          placeholder: '',
          help: '',
          options: [],
        },
        'vi-VN': {
          label: label,
          placeholder: '',
          help: '',
          options: [],
        },
      },
      _payload: payload,
    };

    setFields((prev) => [...prev, newField]);
    return id;
  }, [fields.length, eventId, tenantId, setFields]);

  // Helper function to update field and its payload
  const updateField = useCallback((id: string, updates: any) => {
    setFields((prev) => {
      const updated = prev.map((f) => {
        if (f.id !== id) return f;

        const updatedField = { ...f, ...updates };

        // Always preserve _payload for new fields (fields without real ID from database)
        if ((f as any)._payload) {
          (updatedField as any)._payload = {
            ...(f as any)._payload,
            // Update basic fields in payload
            name: updates.name !== undefined ? updates.name : (f as any)._payload.name,
            type: updates.type !== undefined ? updates.type : (f as any)._payload.type,
            width: updates.width !== undefined ? updates.width : (f as any)._payload.width,
            sort: updates.sort !== undefined ? updates.sort : (f as any)._payload.sort,
            is_required: updates.is_required !== undefined ? updates.is_required : (f as any)._payload.is_required,
            validation: updates.validation !== undefined ? updates.validation : (f as any)._payload.validation,
            conditions: updates.conditions !== undefined ? updates.conditions : (f as any)._payload.conditions,
            // Update translations in payload if they exist
            translations: (f as any)._payload.translations ? {
              ...(f as any)._payload.translations,
              create: (f as any)._payload.translations.create.map((t: any) => {
                const langCode = t.languages_code?.code;

                // Handle both object format (from UI) and direct updates
                let translationUpdate = null;
                if (updates.translations) {
                  // If updates.translations is object format { 'en-US': {...}, 'vi-VN': {...} }
                  if (typeof updates.translations === 'object' && !Array.isArray(updates.translations)) {
                    translationUpdate = updates.translations[langCode];
                  }
                  // If updates.translations is array format (direct update)
                  else if (Array.isArray(updates.translations)) {
                    translationUpdate = updates.translations.find((ut: any) =>
                      ut.languages_code?.code === langCode || ut.languages_code === langCode
                    );
                  }
                }

                return {
                  ...t,
                  label: translationUpdate?.label !== undefined ? translationUpdate.label : t.label,
                  placeholder: translationUpdate?.placeholder !== undefined ? translationUpdate.placeholder : t.placeholder,
                  help: translationUpdate?.help !== undefined ? translationUpdate.help : t.help,
                  options: translationUpdate?.options !== undefined ? translationUpdate.options : t.options,
                };
              }),
            } : undefined,
          };
        }

        return updatedField;
      });

      return updated;
    });
  }, [setFields]);

  // Remove field
  const removeField = useCallback((id: string, selectedId: string | null, setSelectedId: (id: string | null) => void) => {
    setFields((prev) => {
      const updated = prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, sort: i + 1 }));
      return updated;
    });
    if (selectedId === id) setSelectedId(null);
  }, [setFields]);

  // Move field using buttons
  const moveField = useCallback((index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const arr = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;

      const updated = arrayMove(arr, index, newIndex).map((f, i) => ({
        ...f,
        sort: i + 1
      }));

      return updated;
    });
  }, [setFields]);

  // Drag handlers
  const handleDragStart = useCallback((event: any) => {
    setActiveId(String(event.active.id));
    setDropPosition(null);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    const { active, over } = event;

    // Handle catalog items being dragged
    if (String(active.id).startsWith('catalog-')) {
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
    }
    // Handle existing fields being reordered
    else if (over && over.id !== active.id) {
      const activeIndex = fields.findIndex(f => f.id === active.id);
      const overIndex = fields.findIndex(f => f.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        // Calculate the new position based on where we're hovering
        let newPosition = overIndex;

        // If dragging over a field, determine if we should place before or after
        if (event.activatorEvent) {
          const overElement = document.querySelector(`[data-sortable-id="${over.id}"]`);
          if (overElement) {
            const rect = overElement.getBoundingClientRect();
            const relativeY = event.activatorEvent.clientY - rect.top;

            // If dragging in the upper half, place before; lower half, place after
            if (relativeY < rect.height / 2) {
              newPosition = overIndex;
            } else {
              newPosition = overIndex + 1;
            }
          }
        }

        // Perform live sorting during drag
        setFields((prev) => {
          const oldIndex = prev.findIndex((f) => f.id === active.id);
          let newIndex = prev.findIndex((f) => f.id === over.id);

          // Handle special case for placing at the end
          if (newPosition > overIndex) {
            newIndex = newPosition - 1; // Adjust for arrayMove behavior
          }

          // Ensure newIndex is within bounds
          newIndex = Math.max(0, Math.min(newIndex, prev.length - 1));

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

          const updated = arrayMove(prev, oldIndex, newIndex).map((f, i) => ({
            ...f,
            sort: i + 1
          }));

          return updated;
        });

        setDropPosition(newPosition);
      }
    } else {
      setDropPosition(null);
    }
  }, [fields, setFields]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setDropPosition(null);

    console.log('[FormBuilder] Drag end:', { active, over, fields: fields.length });

    if (!over) return;

    // Check if dragging from catalog
    if (String(active.id).startsWith('catalog-')) {
      const catalogItem = CATALOG.find(item => `catalog-${item.id}` === active.id);
      if (catalogItem && (over.id === 'form-preview' || fields.some(f => f.id === over.id))) {
        // Add new field from catalog at specified position
        const id = crypto.randomUUID();
        const fieldName = `${catalogItem.id}_${Date.now()}`;

        console.log('[FormBuilder] Adding field from catalog:', { catalogItem, over, fields: fields.length });

        setFields((prev) => {
          let insertIndex = prev.length; // Default to end

          if (over.id !== 'form-preview') {
            // Find the field index to insert before
            const fieldIndex = prev.findIndex(f => f.id === over.id);
            if (fieldIndex !== -1) {
              insertIndex = fieldIndex;
            }
          }

          // Create payload truyền vào cũng phải update lại sort order cho đúng
          const payload = {
            name: fieldName,
            type: catalogItem.id,
            width: 'full',
            sort: insertIndex + 1,
            is_required: false,
            validation: '',
            conditions: null as any,
            event_id: Number(eventId),
            tenant_id: Number(tenantId),
            translations: {
              create: [
                {
                  languages_code: { code: 'en-US' },
                  label: catalogItem.label,
                  placeholder: '',
                  help: '',
                  options: []
                },
                {
                  languages_code: { code: 'vi-VN' },
                  label: catalogItem.label,
                  placeholder: '',
                  help: '',
                  options: []
                }
              ],
              update: [],
              delete: [],
            },
          };

          const newField = {
            id,
            name: fieldName,
            type: catalogItem.id,
            width: 'full',
            sort: insertIndex + 1,
            is_required: false,
            validation: '',
            conditions: null as any,
            translations: {
              'en-US': {
                id: `${id}_en`,
                label: catalogItem.label,
                placeholder: '',
                help: '',
                options: []
              },
              'vi-VN': {
                id: `${id}_vi`,
                label: catalogItem.label,
                placeholder: '',
                help: '',
                options: []
              }
            },
            _payload: payload,
          };

          const updated = [...prev];
          updated.splice(insertIndex, 0, newField);

          // Update sort values
          updated.forEach((field, index) => {
            field.sort = index + 1;
          });

          return updated;
        });
        return id;
      }
      return;
    }

    // Handle field reordering - live sorting already handled in handleDragOver
    // No need to do anything here since sorting is done during drag
  }, [fields, eventId, tenantId, setFields]);

  return {
    // State
    activeId,
    setActiveId,
    dropPosition,
    setDropPosition,

    // Actions
    addFieldFromCatalog,
    updateField,
    removeField,
    moveField,

    // Drag handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
