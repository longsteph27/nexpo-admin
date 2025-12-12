'use client';

import React, { memo } from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TestimonialItemEditor from './TestimonialItemEditor';
import type { Testimonial } from './types';
import { assetsApi } from '@/lib/api';

interface SortableTestimonialItemProps {
    item: Testimonial;
    index: number;
    isExpanded: boolean;
    currentLangCode: string;
    folderId?: string;
    focusItemId: string | null;
    onToggleExpand: () => void;
    onRemove: () => void;
    onUpdate: (field: string, value: unknown, isTranslation?: boolean) => void;
}

function SortableTestimonialItem({
    item,
    index,
    isExpanded,
    currentLangCode,
    folderId,
    focusItemId,
    onToggleExpand,
    onRemove,
    onUpdate,
}: SortableTestimonialItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1, // Ensure dragging item is on top
    } as React.CSSProperties;

    // Extract title/content for header display
    const displayTitle = (() => {
        const trans = item.translations?.find((t) => {
            const code = typeof t.languages_code === 'string'
                ? t.languages_code
                : (t.languages_code as { code: string })?.code;
            return code === currentLangCode;
        });
        return trans?.title || item.company || `Testimonial ${index + 1}`;
    })();

    // Helper to get image URL safely
    const getImageUrl = (img: any) => {
        if (!img) return null;
        if (typeof img === 'string') return assetsApi.getAssetUrl(img);
        if (typeof img === 'object' && img.id) return assetsApi.getAssetUrl(img.id);
        return null;
    };

    const companyLogoUrl = getImageUrl(item.company_logo);

    return (
        <div ref={setNodeRef} style={style} className={`bg-neutral-50 border rounded-lg overflow-hidden mb-3 ${isDragging ? 'shadow-lg ring-1 ring-blue-500/50 opacity-90' : ''}`}>
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
                        {companyLogoUrl ? (
                            <img src={companyLogoUrl} className="w-8 h-8 rounded-full object-cover border bg-white" alt="" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                <Icon icon="lucide:message-square-quote" className="w-4 h-4 text-neutral-400" />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate select-none text-neutral-700">{displayTitle}</span>
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

            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-neutral-200 mt-2 bg-white">
                    <div className="pt-4">
                        <TestimonialItemEditor
                            item={item}
                            index={index}
                            currentLangCode={currentLangCode}
                            folderId={folderId}
                            onUpdate={onUpdate}
                            autoFocus={item.id === focusItemId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(SortableTestimonialItem, (prev, next) => {
    return (
        prev.item === next.item &&
        prev.index === next.index &&
        prev.isExpanded === next.isExpanded &&
        prev.currentLangCode === next.currentLangCode &&
        prev.focusItemId === next.focusItemId
    );
});
