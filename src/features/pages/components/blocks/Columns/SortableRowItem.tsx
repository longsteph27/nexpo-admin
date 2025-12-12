'use client';

import React, { memo } from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ColumnRowEditor from './ColumnRowEditor';
import type {
  BlockColumnsRows,
  BlockColumnsTranslation,
} from '@/types/directus-collections';

interface SortableRowItemProps {
  row: BlockColumnsRows;
  index: number;
  isExpanded: boolean;
  currentLangCode: string;
  currentTranslation: BlockColumnsTranslation | Record<string, unknown>;
  folderId?: string;
  focusRowId: string | null;
  onToggleExpand: () => void;
  onRemove: () => void;
  onUpdate: (field: string, value: unknown, isTranslation?: boolean) => void;
  onAddButton: () => void;
  onUpdateButton: (buttonIndex: number, field: string, value: unknown) => void;
  onRemoveButton: (buttonId: string) => void;
}

/**
 * Memoized sortable row component.
 * Only re-renders if these specific props change:
 * - row data itself
 * - isExpanded state
 * - Handler references (via useCallback in parent)
 */
function SortableRowItem({
  row,
  index,
  isExpanded,
  currentLangCode,
  currentTranslation,
  folderId,
  focusRowId,
  onToggleExpand,
  onRemove,
  onUpdate,
  onAddButton,
  onUpdateButton,
  onRemoveButton,
}: SortableRowItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  } as React.CSSProperties;

  // Extract title for header display
  const rowTitle = (() => {
    const trans = row.translations?.find((t) => {
      const code = typeof t.languages_code === 'string'
        ? t.languages_code
        : (t.languages_code as { code: string })?.code;
      return code === currentLangCode;
    });
    return ((trans?.title || trans?.headline || '') as string).substring(0, 50);
  })();

  return (

    <div ref={setNodeRef} style={style} className={`bg-neutral-50 border rounded-lg overflow-hidden mb-3 ${isDragging ? 'shadow-lg ring-1 ring-blue-500/50 opacity-90' : ''}`}>
      {/* Header */}
      <div
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-600"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <Icon icon="lucide:grip-vertical" className="w-4 h-4" />
          </button>
          <Icon
            icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
            className="w-4 h-4 text-neutral-500 flex-shrink-0"
          />

          <div className="flex items-center gap-3 min-w-0">
            {/* Simple row icon since rows don't always have a main image */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${row.image ? 'border overflow-hidden' : 'bg-neutral-200'}`}>
              {/* We won't fetch the image here to keep it simple, or we could if assetsApi was imported. 
                    For now, a generic icon or the row number is fine, or mimic Team style fully?
                    Let's use a generic 'Columns' icon or similar. 
                */}
              <Icon icon="lucide:columns" className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate select-none text-neutral-700">Row {index + 1}</span>
              {rowTitle && <span className="text-xs text-neutral-500 truncate max-w-[300px]">{rowTitle}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Icon icon="lucide:trash-2" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-neutral-200 mt-2 bg-white">
          <div className="pt-4">
            <ColumnRowEditor
              row={row}
              rowIndex={index}
              currentTranslation={currentTranslation}
              folderId={folderId}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddButton={onAddButton}
              onUpdateButton={onUpdateButton}
              onRemoveButton={onRemoveButton}
              autoFocus={row.id === focusRowId}
              frameless
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SortableRowItem, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.row === nextProps.row && // Same row object reference
    prevProps.index === nextProps.index &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.currentLangCode === nextProps.currentLangCode &&
    prevProps.focusRowId === nextProps.focusRowId &&
    prevProps.onToggleExpand === nextProps.onToggleExpand &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onAddButton === nextProps.onAddButton &&
    prevProps.onUpdateButton === nextProps.onUpdateButton &&
    prevProps.onRemoveButton === nextProps.onRemoveButton
  );
});

