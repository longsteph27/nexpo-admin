'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import SortableRowItem from './SortableRowItem';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type {
  BlockColumns,
  BlockColumnsRows,
  BlockColumnsTranslation,
  LanguageCode,
} from '@/types/directus-collections';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { generateTempId } from '@/lib/payload';

interface ColumnsBlockEditorProps {
  formData: BlockColumns | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockColumnsTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
}

// Form structure
interface FormValues {
  rows: BlockColumnsRows[];
}

export default function ColumnsBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  folderId,
  eventId,
}: ColumnsBlockEditorProps) {
  const blockData = formData as BlockColumns;

  // Initial data parsing
  const initialRows = useMemo(() => {
    return (blockData.rows || [])
      .filter((row): row is BlockColumnsRows => typeof row !== 'string')
      .map(row => ({
        ...row,
        id: row.id ? String(row.id) : generateTempId()
      }))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }, [blockData.rows]);

  // Initialize React Hook Form
  const { control, reset, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      rows: initialRows,
    },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'rows',
    keyName: 'key',
  });

  // Watch for changes
  const formRows = useWatch({
    control,
    name: 'rows',
  });

  // Local state for UI only
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentLangCodeRaw = useMemo(
    () => (currentTranslation as BlockColumnsTranslation).languages_code as string | { code: string },
    [currentTranslation]
  );

  const currentLangCode = useMemo(
    () => (typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US')),
    [currentLangCodeRaw]
  );

  // Track initialization to prevent loops
  const hasInitialized = useRef(false);

  // Initialize form when rows data becomes available
  // IMPORTANT: Watch length, not formData object to avoid loop
  const rowsLength = useMemo(() => {
    const rows = (formData as Record<string, unknown>).rows as (BlockColumnsRows | string)[] | undefined;
    return rows?.length || 0;
  }, [formData]);

  useEffect(() => {
    // Only init once when data becomes available
    if (hasInitialized.current || rowsLength === 0) return;

    const formRowsData = (formData as Record<string, unknown>).rows as (BlockColumnsRows | string)[] | undefined;

    if (formRowsData && formRowsData.length > 0) {
      const validRows = formRowsData
        .filter((row): row is BlockColumnsRows => typeof row !== 'string')
        .map(row => ({
          ...row,
          id: row.id ? String(row.id) : generateTempId()
        }))
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));

      reset({ rows: validRows });

      setExpanded((prev) => {
        const next: Record<string, boolean> = { ...prev };
        validRows.forEach((r) => {
          if (next[r.id] === undefined) next[r.id] = false;
        });
        return next;
      });

      hasInitialized.current = true;
    }
  }, [rowsLength, formData, reset]); // Only re-run if length changes from 0 to N

  // Debounced update to parent form
  // Debounced update to parent form
  const debouncedUpdate = useMemo(
    () => debounce((currentRows: BlockColumnsRows[]) => {
      // Map to correct payload structure with sort index
      const payload = currentRows.map((row, idx) => ({
        ...row,
        sort: idx,
      }));
      updateField('rows', payload);
    }, 500),
    [updateField]
  );

  // Trigger update when form data changes
  useEffect(() => {
    if (formRows) {
      debouncedUpdate(formRows);
    }
  }, [formRows, debouncedUpdate]);

  const addRow = useCallback(() => {
    const newRowId = generateTempId();

    const newRow: BlockColumnsRows = {
      id: newRowId,
      sort: fields.length,
      translations: [
        {
          block_columns_rows_id: '',
          languages_code: 'en-US' as LanguageCode,
          title: '',
          headline: '',
          content: '',
        },
        {
          block_columns_rows_id: '',
          languages_code: 'vi-VN' as LanguageCode,
          title: '',
          headline: '',
          content: '',
        },
      ],
      image_position: 'left',
      image: null,
      event_id: eventId ? Number(eventId) : undefined,
      tenant_id: undefined,
    };

    append(newRow);
    setFocusRowId(newRowId);
    setExpanded((prev) => ({ ...prev, [newRowId]: true }));
  }, [append, fields.length, eventId]);

  const removeRow = useCallback((index: number) => {
    const rowToRemove = fields[index];
    if (rowToRemove) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[rowToRemove.id];
        return next;
      });
    }
    remove(index);
  }, [fields, remove]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Use explicit string conversion for comparison to handle potential number/string mismatches
    const oldIndex = fields.findIndex((f) => String(f.id) === String(active.id));
    const newIndex = fields.findIndex((f) => String(f.id) === String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      move(oldIndex, newIndex);
    }
  }, [fields, move]);

  const toggleExpand = useCallback((rowId: string) => {
    setExpanded(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  }, []);

  // Update row field (translations or direct fields)
  const updateRow = useCallback((index: number, field: string, value: unknown, isTranslation = false) => {
    if (isTranslation) {
      const currentRow = getValues(`rows.${index}`);
      const translations = currentRow.translations || [];

      const transIndex = translations.findIndex(t => {
        const code = typeof t.languages_code === 'string'
          ? t.languages_code
          : (t.languages_code as { code: string })?.code;
        return code === currentLangCode;
      });

      if (transIndex >= 0) {
        setValue(`rows.${index}.translations.${transIndex}.${field}` as any, value, { shouldDirty: true });
      } else {
        // Add new translation if missing
        const newTrans = {
          block_columns_rows_id: '',
          languages_code: currentLangCode,
          title: '',
          headline: '',
          content: '',
          [field]: value
        };
        setValue(`rows.${index}.translations`, [...translations, newTrans], { shouldDirty: true });
      }
    } else {
      setValue(`rows.${index}.${field}` as any, value, { shouldDirty: true });
    }
  }, [setValue, getValues, currentLangCode]);

  // Button group operations
  const ensureButtonGroup = useCallback((rowIndex: number) => {
    const currentRow = getValues(`rows.${rowIndex}`);
    let buttonGroup = typeof currentRow.button_group === 'object' && currentRow.button_group !== null
      ? currentRow.button_group
      : null;

    if (!buttonGroup) {
      buttonGroup = {
        id: generateTempId(),
        buttons: [],
        alignment: 'start',
        event_id: eventId ? Number(eventId) : undefined,
        tenant_id: undefined,
      };
      setValue(`rows.${rowIndex}.button_group` as any, buttonGroup, { shouldDirty: true });
    }

    return buttonGroup;
  }, [getValues, setValue, eventId]);

  const handleAddButton = useCallback((rowIndex: number) => {
    const buttonGroup = ensureButtonGroup(rowIndex);
    const buttons = buttonGroup.buttons || [];

    const newButton = {
      id: generateTempId(),
      sort: buttons.length,
      variant: 'solid',
      color: 'primary',
      open_in_new_window: false,
      translations: [
        { block_button_id: '', languages_code: 'en-US' as LanguageCode, label: '', href: '' },
        { block_button_id: '', languages_code: 'vi-VN' as LanguageCode, label: '', href: '' },
      ],
    };

    setValue(`rows.${rowIndex}.button_group.buttons` as any, [...buttons, newButton], { shouldDirty: true });
  }, [ensureButtonGroup, setValue]);

  const handleUpdateButton = useCallback((rowIndex: number, buttonIndex: number, field: string, value: unknown) => {
    const currentRow = getValues(`rows.${rowIndex}`);
    const buttonGroup = currentRow.button_group;
    if (!buttonGroup || typeof buttonGroup !== 'object' || !buttonGroup.buttons) return;

    const button = buttonGroup.buttons[buttonIndex];
    if (!button) return;

    if (field === 'label' || field === 'href') {
      const translations = button.translations || [];
      const transIndex = translations.findIndex(t => {
        const code = typeof t.languages_code === 'string'
          ? t.languages_code
          : (t.languages_code as { code: string })?.code;
        return code === currentLangCode;
      });

      if (transIndex >= 0) {
        setValue(
          `rows.${rowIndex}.button_group.buttons.${buttonIndex}.translations.${transIndex}.${field}` as any,
          value,
          { shouldDirty: true }
        );
      }
    } else {
      setValue(
        `rows.${rowIndex}.button_group.buttons.${buttonIndex}.${field}` as any,
        value,
        { shouldDirty: true }
      );
    }
  }, [getValues, setValue, currentLangCode]);

  const handleRemoveButton = useCallback((rowIndex: number, buttonId: string) => {
    const currentRow = getValues(`rows.${rowIndex}`);
    const buttonGroup = currentRow.button_group;
    if (!buttonGroup || typeof buttonGroup !== 'object' || !buttonGroup.buttons) return;

    const newButtons = buttonGroup.buttons.filter(btn => btn.id !== buttonId);
    setValue(`rows.${rowIndex}.button_group.buttons` as any, newButtons, { shouldDirty: true });
  }, [getValues, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Block Title</label>
        <Input
          value={((currentTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Optional block title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Block Headline</label>
        <RichTextEditor
          value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Optional block headline..."
        />
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">Columns / Rows</h3>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
            Add Row
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const rowData = formRows?.[index] || field;

                return (
                  <SortableRowItem
                    key={field.key}
                    row={rowData}
                    index={index}
                    isExpanded={!!expanded[rowData.id]}
                    currentLangCode={currentLangCode}
                    currentTranslation={currentTranslation}
                    folderId={folderId}
                    focusRowId={focusRowId}
                    onToggleExpand={() => toggleExpand(rowData.id)}
                    onRemove={() => removeRow(index)}
                    onUpdate={(f, v, t) => updateRow(index, f, v, t)}
                    onAddButton={() => handleAddButton(index)}
                    onUpdateButton={(btnIdx, f, v) => handleUpdateButton(index, btnIdx, f, v)}
                    onRemoveButton={(btnId) => handleRemoveButton(index, btnId)}
                  />
                );
              })}

              {fields.length === 0 && (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No rows. Click &quot;Add Row&quot; to create one.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
