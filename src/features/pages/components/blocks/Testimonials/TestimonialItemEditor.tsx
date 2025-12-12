'use client';

import React, { useMemo } from 'react';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Testimonial, TestimonialTranslation } from './types';

interface TestimonialItemEditorProps {
    item: Testimonial;
    index: number;
    currentLangCode: string;
    folderId?: string;
    onUpdate: (field: string, value: unknown, isTranslation?: boolean) => void;
    autoFocus?: boolean;
}

export default function TestimonialItemEditor({
    item,
    currentLangCode,
    folderId,
    onUpdate,
    autoFocus,
}: TestimonialItemEditorProps) {

    // Helper to get current translation or create a default one
    const currentTrans = useMemo(() => {
        const trans = item.translations?.find((t) => {
            const code = typeof t.languages_code === 'string'
                ? t.languages_code
                : (t.languages_code as { code: string })?.code;
            return code === currentLangCode;
        });
        return trans || { title: '', subtitle: '', content: '' };
    }, [item.translations, currentLangCode]);

    const title = currentTrans.title || '';
    const subtitle = currentTrans.subtitle || '';
    const content = currentTrans.content || '';

    // Handle Image Upload/Change
    const handleImageChange = (assetId: string | string[]) => {
        const id = Array.isArray(assetId) ? assetId[0] : assetId;
        onUpdate('image', id, false);
    };

    // Handle Company Logo Upload/Change
    const handleCompanyLogoChange = (assetId: string | string[]) => {
        const id = Array.isArray(assetId) ? assetId[0] : assetId;
        onUpdate('company_logo', id, false);
    };

    return (
        <div className="space-y-4">
            {/* Person Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">Person Name (Title)</label>
                    <Input
                        value={title}
                        onChange={(e) => onUpdate('title', e.target.value, true)}
                        placeholder="e.g. John Doe"
                        autoFocus={autoFocus}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">Job Title / Role (Subtitle)</label>
                    <Input
                        value={subtitle}
                        onChange={(e) => onUpdate('subtitle', e.target.value, true)}
                        placeholder="e.g. CEO, Tech Corp"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Content</label>
                <RichTextEditor
                    value={content}
                    onChange={(value) => onUpdate('content', value, true)}
                    placeholder="Testimonial text..."
                />
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-4">
                <h4 className="text-sm font-semibold text-neutral-900">Additional Info</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-700">Company Name</label>
                            <Input
                                value={item.company || ''}
                                onChange={(e) => onUpdate('company', e.target.value, false)}
                                placeholder="Company Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-700">Company Link</label>
                            <Input
                                value={item.link || ''}
                                onChange={(e) => onUpdate('link', e.target.value, false)}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-700">Status</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={item.status || 'published'}
                                onChange={(e) => onUpdate('status', e.target.value, false)}
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-x-4 flex ">
                        <div className="space-y-2 flex-1">
                            <label className="block text-sm font-medium text-neutral-700">Person Image</label>
                            <div className="w-full h-auto">
                                <ImageUpload
                                    value={item.image ? (typeof item.image === 'string' ? item.image : item.image.id) : ''}
                                    onChange={handleImageChange}
                                    folderId={folderId}
                                    multiple={false}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 flex-1">
                            <label className="block text-sm font-medium text-neutral-700">Company Logo</label>
                            <div className="w-full h-auto">
                                <ImageUpload
                                    value={item.company_logo ? (typeof item.company_logo === 'string' ? item.company_logo : item.company_logo.id) : ''}
                                    onChange={handleCompanyLogoChange}
                                    folderId={folderId}
                                    multiple={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
