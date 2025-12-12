'use client';

import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { debounce } from 'lodash';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import { generateTempId } from '@/lib/payload';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';

interface TeamBlockEditorProps {
    formData: any;
    updateTranslation: (field: string, value: string | null) => void;
    updateField: (field: string, value: unknown) => void;
    currentTranslation: any;
    folderId?: string;
    eventId?: string;
}

interface SocialMediaItem {
    service: string;
    url: string;
}

interface TeamMember {
    id: string;
    sort?: number;
    name?: string;
    image?: string;
    job_title?: string; // fallback
    bio?: string; // fallback
    social_media?: SocialMediaItem[];
    translations?: any[];
}

interface FormValues {
    team: TeamMember[];
}

const SOCIAL_SERVICES = [
    { value: 'twitter', label: 'Twitter / X', icon: 'ri:twitter-x-line' },
    { value: 'facebook', label: 'Facebook', icon: 'ri:facebook-circle-fill' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'ri:linkedin-fill' },
    { value: 'instagram', label: 'Instagram', icon: 'ri:instagram-line' },
    { value: 'github', label: 'GitHub', icon: 'ri:github-fill' },
    { value: 'website', label: 'Website', icon: 'ri:global-line' },
];

// Nested component for Social Media
const TeamMemberSocials = ({ nestIndex, control }: { nestIndex: number; control: Control<FormValues> }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `team.${nestIndex}.social_media`,
    });

    return (
        <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Social Media</label>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => append({ service: 'twitter', url: '' })}
                    className="h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Icon icon="lucide:plus" className="w-3 h-3 mr-1" />
                    Add Link
                </Button>
            </div>

            <div className="space-y-2">
                {fields.map((field, k) => (
                    <div key={field.id} className="flex gap-2 items-start">
                        <div className="w-1/3 min-w-[120px]">
                            <div className="relative">
                                <select
                                    {...control.register(`team.${nestIndex}.social_media.${k}.service`)}
                                    className="w-full text-sm border-neutral-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-8 h-9"
                                >
                                    {SOCIAL_SERVICES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                    <Icon icon={SOCIAL_SERVICES.find(s => s.value === control.getValues(`team.${nestIndex}.social_media.${k}.service`) || 'twitter')?.icon || 'lucide:link'} />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Input
                                {...control.register(`team.${nestIndex}.social_media.${k}.url`)}
                                placeholder="https://..."
                                className="h-9"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(k)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded mt-0.5 transition-colors"
                        >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No social links.</p>
                )}
            </div>
        </div>
    );
};

// Sub-component for Sortable Item to handle DnD logic cleanly
const SortableTeamItem = ({
    item,
    index,
    isExpanded,
    onToggleExpand,
    onRemove,
    onUpdate,
    currentLangCode,
    folderId,
    control
}: {
    item: TeamMember;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onRemove: () => void;
    onUpdate: (field: string, value: any, isTrans?: boolean) => void;
    currentLangCode: string;
    folderId?: string;
    control: Control<FormValues>;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getTransValue = (field: string) => {
        const trans = item.translations?.find((t: any) =>
            (typeof t.languages_code === 'string' ? t.languages_code : t.languages_code?.code) === currentLangCode
        );
        return trans?.[field] || item[field as keyof TeamMember] || '';
    };

    const displayJobTitle = getTransValue('job_title');
    const displayBio = getTransValue('bio');

    return (
        <div ref={setNodeRef} style={style} className="bg-neutral-50 border rounded-lg overflow-hidden mb-3">
            <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <button type="button" className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-neutral-600" {...attributes} {...listeners}>
                        <Icon icon="lucide:grip-vertical" className="w-4 h-4" />
                    </button>
                    <Icon
                        icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                        className="w-4 h-4 text-neutral-500 flex-shrink-0"
                    />
                    <div className="flex items-center gap-3">
                        {item.image ? (
                            <img src={assetsApi.getAssetUrl(item.image)} className="w-8 h-8 rounded-full object-cover border" alt="" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                                <Icon icon="lucide:user" className="w-4 h-4 text-neutral-400" />
                            </div>
                        )}
                        <span className="text-sm font-semibold truncate select-none">{item.name || `Member ${index + 1}`}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    >
                        <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-neutral-200 mt-2 bg-white">
                    <div className="pt-4">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                        <Input
                            placeholder="Name..."
                            value={item.name || ''}
                            onChange={(e) => onUpdate('name', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Job Title ({currentLangCode})</label>
                        <Input
                            placeholder="Job Title..."
                            value={displayJobTitle}
                            onChange={(e) => onUpdate('job_title', e.target.value, true)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Photo</label>
                        <ImageUpload
                            value={item.image || ''}
                            onChange={(id) => onUpdate('image', id)}
                            folderId={folderId}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Bio ({currentLangCode})</label>
                        <RichTextEditor
                            value={displayBio}
                            onChange={(v) => onUpdate('bio', v, true)}
                            placeholder="Short bio..."
                        />
                    </div>

                    {/* Social Media Editor */}
                    <TeamMemberSocials nestIndex={index} control={control} />
                </div>
            )}
        </div>
    );
};


export default function TeamBlockEditor({
    formData,
    updateTranslation,
    updateField,
    currentTranslation,
    folderId,
}: TeamBlockEditorProps) {
    const blockData = formData;

    const currentLangCodeRaw = useMemo(
        () => (currentTranslation).languages_code as string | { code: string },
        [currentTranslation]
    );
    const currentLangCode = useMemo(
        () => (typeof currentLangCodeRaw === 'string' ? currentLangCodeRaw : (currentLangCodeRaw?.code || 'en-US')),
        [currentLangCodeRaw]
    );

    const initialItems = useMemo(() => {
        return (blockData.team || [])
            .filter((t: any) => typeof t !== 'string')
            .map((t: any) => ({
                ...t,
                image: t.image && typeof t.image === 'object' ? t.image.id : t.image
            }));
    }, [blockData.team]);

    const { control, reset, setValue, getValues } = useForm<FormValues>({
        defaultValues: {
            team: initialItems,
        },
        mode: 'onChange',
    });

    const { fields, append, remove, move, replace } = useFieldArray({
        control,
        name: 'team',
        keyName: 'key',
    });

    const formTeam = useWatch({ control, name: 'team' });

    // Init Data
    const hasInitialized = useRef(false);
    const teamDataLength = (formData.team as any[])?.length || 0;

    useEffect(() => {
        if (!hasInitialized.current && teamDataLength > 0) {
            const validItems = (formData.team || [])
                .filter((t: any) => typeof t !== 'string')
                .map((t: any) => ({
                    ...t,
                    image: t.image && typeof t.image === 'object' ? t.image.id : t.image
                }));
            reset({ team: validItems });
            hasInitialized.current = true;
        }
    }, [teamDataLength, formData, reset]);

    // Debounced Update
    const debouncedUpdatePayload = useMemo(
        () => debounce((items: TeamMember[]) => {
            // Map to correct payload structure with sort
            const payload = items.map((item, idx) => {
                const { id, ...rest } = item;
                const finalItem = { ...rest, sort: idx };
                // Keep ID if it's not temporary
                if (id && !id.startsWith('temp-')) {
                    (finalItem as any).id = id;
                }
                return finalItem;
            });
            updateField('team', payload);
        }, 500),
        [updateField]
    );

    useEffect(() => {
        if (formTeam) {
            debouncedUpdatePayload(formTeam as TeamMember[]);
        }
    }, [formTeam, debouncedUpdatePayload]);


    // Logic
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addMember = () => {
        const newId = generateTempId();
        append({
            id: newId,
            sort: fields.length,
            name: '',
            image: null,
            social_media: [],
            translations: [
                { languages_code: 'en-US', job_title: '', bio: '' },
                { languages_code: 'vi-VN', job_title: '', bio: '' },
            ]
        } as any);
        setExpandedItems(prev => ({ ...prev, [newId]: true }));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = fields.findIndex(f => f.id === active.id);
        const newIndex = fields.findIndex(f => f.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            move(oldIndex, newIndex);
        }
    };

    const updateItem = (index: number, field: string, value: any, isTrans = false) => {
        if (isTrans) {
            const currentItem = getValues(`team.${index}`);
            const translations = currentItem.translations || [];
            const transIndex = translations.findIndex((t: any) => {
                const code = typeof t.languages_code === 'string' ? t.languages_code : t.languages_code?.code;
                return code === currentLangCode;
            });

            if (transIndex >= 0) {
                setValue(`team.${index}.translations.${transIndex}.${field}` as any, value, { shouldDirty: true });
            } else {
                const newTrans = {
                    languages_code: currentLangCode,
                    [field]: value
                };
                setValue(`team.${index}.translations` as any, [...translations, newTrans], { shouldDirty: true });
            }
        } else {
            setValue(`team.${index}.${field}` as any, value, { shouldDirty: true });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Section Title</label>
                <Input
                    value={(currentTranslation.title as string) || ''}
                    onChange={(e) => updateTranslation('title', e.target.value)}
                    placeholder="Meet our team..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Headline</label>
                <RichTextEditor
                    value={(currentTranslation.headline as string) || ''}
                    onChange={(v) => updateTranslation('headline', v)}
                    placeholder="Headline..."
                />
            </div>

            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-neutral-900">Team Members ({fields.length})</h3>
                    <Button size="sm" variant="outline" onClick={addMember}>
                        <Icon icon="lucide:plus" className="w-4 h-4 mr-1" /> Add Member
                    </Button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div>
                            {fields.map((field, index) => {
                                const itemData = formTeam?.[index] || field;
                                return (
                                    <SortableTeamItem
                                        key={field.key}
                                        item={itemData as TeamMember}
                                        index={index}
                                        isExpanded={!!expandedItems[itemData.id]}
                                        onToggleExpand={() => toggleExpand(itemData.id)}
                                        onRemove={() => remove(index)}
                                        onUpdate={(f, v, t) => updateItem(index, f, v, t)}
                                        currentLangCode={currentLangCode}
                                        folderId={folderId}
                                        control={control}
                                    />
                                );
                            })}
                            {fields.length === 0 && <p className="text-center text-neutral-500 py-8 text-sm">No team members added.</p>}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
