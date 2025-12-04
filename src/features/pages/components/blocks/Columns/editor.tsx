'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import ColumnRowEditor from './ColumnRowEditor';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  BlockColumns,
  BlockColumnsRows,
  BlockColumnsTranslation,
  BlockColumnsRowsTranslation,
  BlockButtonGroup,
  BlockButton,
  BlockButtonTranslation,
  LanguageCode,
} from '@/types/directus-collections';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { DragEndEvent } from '@dnd-kit/core';

interface ColumnsBlockEditorProps {
  formData: BlockColumns | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockColumnsTranslation | Record<string, unknown>;
  folderId?: string;
  eventId?: string;
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

  // Filter out string references (UUID) - only use full objects
  const initialRows = (blockData.rows || []).filter(
    (row): row is BlockColumnsRows => typeof row !== 'string'
  );

  const [rows, setRows] = useState<BlockColumnsRows[]>(initialRows);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sync rows from formData and initialize expanded map (default collapsed)
  useEffect(() => {
    if ((formData as Record<string, unknown>).rows) {
      const formRows = (formData as Record<string, unknown>).rows as (BlockColumnsRows | string)[];
      const validRows = formRows.filter(
        (row): row is BlockColumnsRows => typeof row !== 'string'
      );
      setRows(validRows);
      setExpanded((prev) => {
        const next: Record<string, boolean> = { ...prev };
        validRows.forEach((r) => {
          if (next[r.id] === undefined) next[r.id] = false; // default collapsed
        });
        return next;
      });
    }
  }, [(formData as Record<string, unknown>).rows]);

  const addRow = () => {
    const newRow: BlockColumnsRows = {
      id: `temp-row-${Date.now()}`,
      sort: rows.length,
      translations: [
        { block_columns_rows_id: '', languages_code: 'en-US' as LanguageCode, title: '', headline: '', content: '' },
        { block_columns_rows_id: '', languages_code: 'vi-VN' as LanguageCode, title: '', headline: '', content: '' },
      ],
      image_position: 'left',
      image: null,
      event_id: eventId ? Number(eventId) : undefined,
      tenant_id: undefined,
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    setFocusRowId(newRow.id);
    setExpanded((prev) => ({ ...prev, [newRow.id]: true })); // expand new row
    updateField('rows', newRows);
  };

  const removeRow = (index: number) => {
    const removedId = rows[index]?.id;
    const newRows = rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sort: i }));
    setRows(newRows);
    setExpanded((prev) => {
      const next = { ...prev };
      if (removedId) delete next[removedId];
      return next;
    });
    updateField('rows', newRows);
  };

  const currentLangCodeRaw = (currentTranslation as BlockColumnsTranslation).languages_code as string | { code: string };
  const currentLangCode = typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US');

  const updateRow = (
    index: number,
    field: string,
    value: string | number | boolean | null,
    isTranslation = false
  ) => {
    const newRows = [...rows];

    // Safety check: if row is a string (UUID reference), convert to object
    if (typeof newRows[index] === 'string') {
      console.warn(`[ColumnsBlockEditor] Row ${index} is a string reference (${newRows[index]}), converting to object`);
      newRows[index] = {
        id: newRows[index] as unknown as string,
        sort: index,
        translations: [
          { block_columns_rows_id: '', languages_code: 'en-US' as LanguageCode, title: '', headline: '', content: '' },
          { block_columns_rows_id: '', languages_code: 'vi-VN' as LanguageCode, title: '', headline: '', content: '' },
        ],
        image_position: 'left',
        image: null,
      };
    }

    if (isTranslation) {
      if (!newRows[index].translations) {
        newRows[index].translations = [
          { block_columns_rows_id: '', languages_code: 'en-US' as LanguageCode },
          { block_columns_rows_id: '', languages_code: 'vi-VN' as LanguageCode },
        ];
      }

      const translationIndex =
        newRows[index].translations?.findIndex((translation) => {
          const translationLang =
            typeof translation.languages_code === 'string'
              ? translation.languages_code
              : ((translation.languages_code as { code: string })?.code || '');
          return translationLang === currentLangCode;
        }) ?? -1;

      if (translationIndex >= 0 && newRows[index].translations) {
        newRows[index].translations[translationIndex] = {
          ...newRows[index].translations[translationIndex],
          [field]: value,
        } as any;
      } else {
        if (!newRows[index].translations) {
          newRows[index].translations = [] as any;
        }
        (newRows[index].translations as any).push({
          block_columns_rows_id: '',
          languages_code: currentLangCode as LanguageCode,
          [field]: value,
        } as any);
      }
    } else {
      (newRows[index] as Record<string, unknown>)[field] = value;
    }

    setRows(newRows);
    updateField('rows', newRows);
  };

  // Drag end reorder
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({ ...r, sort: i }));
    setRows(reordered);
    updateField('rows', reordered);
  };

  // Ensure button group exists on a row
  const ensureButtonGroup = (rowIndex: number): BlockButtonGroup => {
    const newRows = [...rows];
    if (typeof newRows[rowIndex] === 'string') {
      newRows[rowIndex] = {
        id: newRows[rowIndex] as unknown as string,
        sort: rowIndex,
        translations: [
          { block_columns_rows_id: '', languages_code: 'en-US' as LanguageCode, title: '', headline: '', content: '' },
          { block_columns_rows_id: '', languages_code: 'vi-VN' as LanguageCode, title: '', headline: '', content: '' },
        ],
        image_position: 'left',
        image: null,
      };
    }

    let buttonGroup =
      typeof newRows[rowIndex].button_group === 'object' && newRows[rowIndex].button_group !== null
        ? (newRows[rowIndex].button_group as BlockButtonGroup)
        : null;

    if (!buttonGroup || typeof buttonGroup === 'string') {
      buttonGroup = {
        id: `temp-button-group-${Date.now()}`,
        buttons: [],
        alignment: 'start',
        event_id: eventId ? Number(eventId) : undefined,
        tenant_id: undefined,
      };
      newRows[rowIndex].button_group = buttonGroup;
      setRows(newRows);
      updateField('rows', newRows);
    }

    return buttonGroup;
  };

  // Button handlers
  const handleAddButton = (rowIndex: number) => {
    const buttonGroup = ensureButtonGroup(rowIndex);
    const buttons = buttonGroup.buttons || [];
    const newButton: BlockButton = {
      id: `temp-button-${Date.now()}`,
      sort: buttons.length,
      variant: 'solid',
      color: 'primary',
      open_in_new_window: false,
      translations: [
        { block_button_id: '', languages_code: 'en-US' as LanguageCode, label: '' },
        { block_button_id: '', languages_code: 'vi-VN' as LanguageCode, label: '' },
      ],
    };
    buttonGroup.buttons = [...buttons, newButton];
    const newRows = [...rows];
    newRows[rowIndex].button_group = buttonGroup;
    setRows(newRows);
    updateField('rows', newRows);
  };

  const handleUpdateButton = (rowIndex: number, buttonIndex: number, field: string, value: unknown) => {
    const newRows = [...rows];
    const buttonGroup =
      typeof newRows[rowIndex].button_group === 'object' && newRows[rowIndex].button_group !== null
        ? (newRows[rowIndex].button_group as BlockButtonGroup)
        : null;
    if (!buttonGroup || !buttonGroup.buttons || !buttonGroup.buttons[buttonIndex]) return;

    if (field === 'label' || field === 'href') {
      const translations = buttonGroup.buttons[buttonIndex].translations || [];
      const translationIndex =
        translations.findIndex((translation) => {
          const translationLang =
            typeof translation.languages_code === 'string'
              ? translation.languages_code
              : ((translation.languages_code as { code: string })?.code || '');
          return translationLang === currentLangCode;
        }) ?? -1;

      if (translationIndex >= 0) {
        translations[translationIndex] = {
          ...translations[translationIndex],
          [field]: value,
        } as BlockButtonTranslation;
      } else {
        translations.push({
          block_button_id: '',
          languages_code: currentLangCode as LanguageCode,
          label: field === 'label' ? (value as string) : '',
          href: field === 'href' ? (value as string) : '',
        });
      }
      buttonGroup.buttons[buttonIndex].translations = translations;
    } else {
      (buttonGroup.buttons[buttonIndex] as Record<string, unknown>)[field] = value;
    }

    newRows[rowIndex].button_group = buttonGroup;
    setRows(newRows);
    updateField('rows', newRows);
  };

  const handleRemoveButton = (rowIndex: number, buttonId: string) => {
    const newRows = [...rows];
    const buttonGroup =
      typeof newRows[rowIndex].button_group === 'object' && newRows[rowIndex].button_group !== null
        ? (newRows[rowIndex].button_group as BlockButtonGroup)
        : null;
    if (buttonGroup && buttonGroup.buttons) {
      buttonGroup.buttons = buttonGroup.buttons.filter((button) => button.id !== buttonId);
      newRows[rowIndex].button_group = buttonGroup;
      setRows(newRows);
      updateField('rows', newRows);
    }
  };

  // Sortable row wrapper
  function SortableRow({ row, index }: { row: BlockColumnsRows; index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    const rowTitle = (() => {
      const trans = row.translations?.find((t) => {
        const code = typeof t.languages_code === 'string' ? t.languages_code : (t.languages_code as { code: string })?.code;
        return code === currentLangCode;
      }) as any;
      return (trans?.title || trans?.headline || '').toString();
    })();

    const isExpanded = !!expanded[row.id];

    return (
      <div ref={setNodeRef} style={style} className={`border rounded-lg bg-white shadow-sm ${isDragging ? 'ring-2 ring-blue-400' : ''}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b bg-neutral-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <button
              className="cursor-grab active:cursor-grabbing p-1 text-neutral-500 hover:text-neutral-700"
              aria-label="Drag handle"
              {...attributes}
              {...listeners}
            >
              <Icon icon="lucide:grip-vertical" className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-neutral-700">Row {index + 1}</span>
            {rowTitle && <span className="text-xs text-neutral-500 truncate max-w-[240px]">— {rowTitle}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 text-neutral-500 hover:text-neutral-700"
              onClick={() => setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Icon icon="lucide:chevron-down" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              className="p-1 text-red-600 hover:text-red-700"
              onClick={() => removeRow(index)}
              aria-label="Remove row"
            >
              <Icon icon="lucide:trash-2" className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="p-4">
            <ColumnRowEditor
              row={row}
              rowIndex={index}
              currentTranslation={currentTranslation}
              folderId={folderId}
              onUpdate={(field, value, isTranslation) =>
                updateRow(index, field, value as string | number | boolean | null, isTranslation)
              }
              onRemove={() => removeRow(index)}
              onAddButton={() => handleAddButton(index)}
              onUpdateButton={(buttonIndex, field, value) => handleUpdateButton(index, buttonIndex, field, value)}
              onRemoveButton={(buttonId) => handleRemoveButton(index, buttonId)}
              autoFocus={row.id === focusRowId}
              frameless
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Block Title
        </label>
        <Input
          value={((currentTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Optional block title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Block Headline
        </label>
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
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {rows.map((row, index) => (
                <SortableRow key={row.id} row={row} index={index}>
                  {/* content rendered inside SortableRow */}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}




