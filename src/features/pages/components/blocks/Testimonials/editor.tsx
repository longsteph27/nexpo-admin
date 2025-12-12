'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
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
    BlockTestimonials,
    BlockTestimonialsTranslation,
    BlockTestimonialSliderItem,
    Testimonial,
    TestimonialTranslation,
} from './types';
import SortableTestimonialItem from './SortableTestimonialItem';
import type { LanguageCode } from '@/types/directus-collections';
import {
    processM2M,
    BlockTestimonialsSchema,
    generateTempId
} from '@/lib/payload';

interface TestimonialsBlockEditorProps {
    formData: BlockTestimonials | Record<string, unknown>;
    updateTranslation: (field: string, value: string | null) => void;
    updateField: (field: string, value: unknown) => void;
    currentTranslation: BlockTestimonialsTranslation | Record<string, unknown>;
    folderId?: string;
    eventId?: string;
}

// Form structure matches the "flattened" editing state
interface FormValues {
    testimonials: (Testimonial & { _junctionId?: string, _sort?: number })[];
}

export default function TestimonialsBlockEditor({
    formData,
    updateTranslation,
    updateField,
    currentTranslation,
    folderId,
    eventId,
}: TestimonialsBlockEditorProps) {
    const blockData = formData as BlockTestimonials;

    // Initial data parsing
    const initialItems = useMemo(() => {
        const items = blockData.testimonials || [];
        return items
            .filter((item): item is BlockTestimonialSliderItem => typeof item !== 'string' && typeof item.testimonials_id !== 'string')
            .map((item) => ({
                ...(item.testimonials_id as Testimonial),
                _junctionId: item.id,
                _sort: item.sort,
            }))
            .sort((a, b) => (a._sort || 0) - (b._sort || 0));
    }, [blockData.testimonials]);

    // Initialize React Hook Form
    const { control, register, setValue, getValues, reset } = useForm<FormValues>({
        defaultValues: {
            testimonials: initialItems,
        },
        mode: 'onChange',
    });

    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: 'testimonials',
        keyName: 'key', // Use 'key' for internal RHF id to avoid conflict with data 'id'
    });

    // Watch for changes to generate payload
    const formTestimonials = useWatch({
        control,
        name: 'testimonials',
    });

    // Local state for UI only (expansion, focus)
    const [focusItemId, setFocusItemId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const currentLangCodeRaw = useMemo(
        () => (currentTranslation as BlockTestimonialsTranslation).languages_code as string | { code: string },
        [currentTranslation]
    );

    const currentLangCode = useMemo(
        () => (typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US')),
        [currentLangCodeRaw]
    );

    // Track if we've initialized the form to prevent loops
    const hasInitialized = useRef(false);

    // Initialize form when testimonials data becomes available
    // IMPORTANT: Watch length, not formData object to avoid loop
    const testimonialsLength = useMemo(() => {
        const items = (formData as Record<string, unknown>).testimonials as (BlockTestimonialSliderItem | string)[] | undefined;
        return items?.length || 0;
    }, [formData]);

    useEffect(() => {
        // Only init once when data becomes available
        if (hasInitialized.current || testimonialsLength === 0) return;

        const formTestimonials = (formData as Record<string, unknown>).testimonials as (BlockTestimonialSliderItem | string)[] | undefined;

        if (formTestimonials && formTestimonials.length > 0) {
            const validItems = formTestimonials
                .filter((item): item is BlockTestimonialSliderItem => typeof item !== 'string' && typeof item.testimonials_id !== 'string')
                .map((item) => ({
                    ...(item.testimonials_id as Testimonial),
                    _junctionId: item.id,
                    _sort: item.sort,
                }))
                .sort((a, b) => (a._sort || 0) - (b._sort || 0));

            // Reset the form with the parsed data
            reset({ testimonials: validItems });

            // Initialize expanded state for items
            setExpanded((prev) => {
                const next: Record<string, boolean> = { ...prev };
                validItems.forEach((item) => {
                    if (next[item.id] === undefined) next[item.id] = false;
                });
                return next;
            });

            hasInitialized.current = true; // Mark as initialized
        }
    }, [testimonialsLength, formData, reset]); // Only re-run if length changes from 0 to N


    // Debounced update to parent form
    // NOTE: We send the junction array format (not CUD structure) to match what PagePayloadManager expects
    const debouncedUpdatePayload = useMemo(
        () => debounce((currentItems: (Testimonial & { _junctionId?: string, _sort?: number })[]) => {

            // Convert form items back to junction structure for parent
            // Keep ALL IDs (including temp) - PagePayloadManager will clean them on final save
            const junctionData = currentItems.map((item, index) => {
                const junctionPayload: any = {
                    sort: index,
                    testimonials_id: {
                        ...item,
                    }
                };

                // Include junction ID if exists
                if (item._junctionId) {
                    junctionPayload.id = item._junctionId;
                }

                // Remove internal fields from nested testimonial
                delete junctionPayload.testimonials_id._junctionId;
                delete junctionPayload.testimonials_id._sort;

                return junctionPayload;
            });

            console.log('Sending Junction Data:', junctionData);
            updateField('testimonials', junctionData);
        }, 500),
        [updateField]
    );

    // Trigger update when form data changes
    useEffect(() => {
        debouncedUpdatePayload(formTestimonials);
    }, [formTestimonials, debouncedUpdatePayload]);


    const addItem = useCallback(() => {
        const newItemId = generateTempId(); // Use new utility
        const junctionId = generateTempId();

        const newItem: Testimonial & { _junctionId?: string, _sort?: number } = {
            id: newItemId,
            _junctionId: junctionId,
            sort: fields.length,
            status: 'published',
            company: '',
            company_logo: null,
            link: null,
            image: null,
            translations: [
                {
                    id: generateTempId() as any, // Temp ID
                    testimonials_id: newItemId,
                    languages_code: 'en-US',
                    title: '',
                    subtitle: '',
                    content: '',
                },
                {
                    id: generateTempId() as any,
                    testimonials_id: newItemId,
                    languages_code: 'vi-VN',
                    title: '',
                    subtitle: '',
                    content: '',
                }
            ]
        };

        append(newItem);
        setFocusItemId(newItemId);
        setExpanded((prev) => ({ ...prev, [newItemId]: true }));
    }, [append, fields.length]);

    const removeItem = useCallback((index: number) => {
        remove(index);
    }, [remove]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            move(oldIndex, newIndex);
        }
    }, [fields, move]);

    const toggleExpand = useCallback((id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // Wrapper for child components to update form
    const updateItem = useCallback((index: number, field: string, value: unknown, isTranslation = false) => {
        if (isTranslation) {
            // Complex logic for translation update
            // We need to find the correct translation index for the current language
            const currentItem = getValues(`testimonials.${index}`);
            const translations = currentItem.translations || [];

            const transIndex = translations.findIndex(t => {
                const code = typeof t.languages_code === 'string'
                    ? t.languages_code
                    : (t.languages_code as { code: string })?.code;
                return code === currentLangCode;
            });

            if (transIndex >= 0) {
                setValue(`testimonials.${index}.translations.${transIndex}.${field}` as any, value, { shouldDirty: true, shouldValidate: true });
            } else {
                // Add new translation if missing
                const newTrans = {
                    id: generateTempId() as any,
                    testimonials_id: currentItem.id,
                    languages_code: currentLangCode,
                    title: '', // Default values for new translation
                    subtitle: '',
                    content: '',
                    [field]: value
                } as TestimonialTranslation;

                // We need to use setValue to push the new array
                setValue(`testimonials.${index}.translations`, [...translations, newTrans], { shouldDirty: true, shouldValidate: true });
            }
        } else {
            setValue(`testimonials.${index}.${field}` as any, value, { shouldDirty: true, shouldValidate: true });
        }
    }, [setValue, getValues, currentLangCode]);


    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Block Section Title</label>
                <Input
                    value={((currentTranslation as Record<string, unknown>).title as string) || ''}
                    onChange={(event) => updateTranslation('title', event.target.value)}
                    placeholder="e.g. What our users say"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Block Headline</label>
                <RichTextEditor
                    value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
                    onChange={(value) => updateTranslation('headline', value)}
                    placeholder="Add a catchy headline..."
                />
            </div>

            <div className="border-t border-neutral-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Testimonials</h3>
                    <Button size="sm" variant="outline" onClick={addItem}>
                        <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
                        Add Testimonial
                    </Button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {fields.map((field, index) => {
                                // IMPORTANT: useFieldArray 'field' does not update with values. 
                                // We must use the watched value 'formTestimonials[index]' for the child component to prevent stale state.
                                // We combine it with 'field.id' (internal RHF id) or 'field.key' if needed, but 'field' itself has the initial data.
                                const itemData = formTestimonials?.[index] || field;

                                return (
                                    <SortableTestimonialItem
                                        key={field.key} // IMPORTANT: Use RHF key for sorting
                                        item={itemData}
                                        index={index}
                                        isExpanded={!!expanded[itemData.id]}
                                        currentLangCode={currentLangCode}
                                        folderId={folderId}
                                        focusItemId={focusItemId}
                                        onToggleExpand={() => toggleExpand(itemData.id)}
                                        onRemove={() => removeItem(index)}
                                        onUpdate={(f, v, t) => updateItem(index, f, v, t)}
                                    />
                                );
                            })}

                            {fields.length === 0 && (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    No testimonials yet. Click &quot;Add Testimonial&quot; to create one.
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
