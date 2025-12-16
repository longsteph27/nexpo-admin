import React, { memo } from 'react';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import ThemeSelector from '@/components/ui/ThemeSelector';

interface PageBuilderHeaderProps {
    // Edit Mode Control
    isInlineEditMode: boolean;
    onToggleEditMode: () => void;
    onCancelEdit: () => void;

    // Save Control
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    onSave: () => void;

    // Page Info
    pageTitle: string;
    pagePermalink: string;
    onEditMetadata: () => void;

    // Preview Controls
    previewDevice: 'desktop' | 'tablet' | 'mobile';
    onPreviewDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
    previewLang: 'en-US' | 'vi-VN';
    onPreviewLangChange: (lang: 'en-US' | 'vi-VN') => void;
    previewScale: number;
    onPreviewScaleChange: (scale: number) => void;

    // Site Context
    siteId?: number;
    onViewPublic: () => void;
    onToggleThemeSidebar?: () => void;
}

const PageBuilderHeader = memo(function PageBuilderHeader({
    isInlineEditMode,
    onToggleEditMode,
    onCancelEdit,
    hasUnsavedChanges,
    isSaving,
    onSave,
    pageTitle,
    pagePermalink,
    onEditMetadata,
    previewDevice,
    onPreviewDeviceChange,
    previewLang,
    onPreviewLangChange,
    previewScale,
    onPreviewScaleChange,
    siteId,
    onViewPublic,
    onToggleThemeSidebar,
}: PageBuilderHeaderProps) {
    return (
        <div className="bg-white px-6 py-2 grid gap-2 grid-cols-10 items-center shadow-sm sticky top-0 z-30">
            {/* Left Section - Edit/Cancel/Save buttons */}
            <div className="col-span-4 flex items-center justify-start space-x-4">
                {!isInlineEditMode ? (
                    <>
                        <Button
                            variant="gradient"
                            size="sm"
                            onClick={onToggleEditMode}
                            className="text-white"
                        >
                            <Icon icon="lucide:edit-3" className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        {hasUnsavedChanges && (
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCancelEdit}
                        >
                            <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            size="sm"
                            onClick={onSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="text-white"
                            title={!hasUnsavedChanges ? 'No changes to save' : undefined}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </>
                )}
            </div>

            {/* Center Section - Page Metadata */}
            <div className="col-span-2 flex justify-center">
                {isInlineEditMode ? (
                    <div
                        className="flex flex-col items-center cursor-pointer"
                        onClick={onEditMetadata}
                    >
                        <span className="text-sm font-semibold text-neutral-900">{pageTitle}</span>
                        <span className="text-xs text-neutral-500">{pagePermalink}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-neutral-900">{pageTitle}</span>
                        <span className="text-xs text-neutral-500">{pagePermalink}</span>
                    </div>
                )}
            </div>

            {/* Right Section - Controls */}
            <div className="col-span-4 flex items-center justify-end space-x-1">
                {/* Preview Device Buttons */}
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                    <button
                        onClick={() => onPreviewDeviceChange('desktop')}
                        className={`p-2 rounded transition-colors ${previewDevice === 'desktop'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        title="Desktop"
                    >
                        <Icon icon="lucide:monitor" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPreviewDeviceChange('mobile')}
                        className={`p-2 rounded transition-colors ${previewDevice === 'mobile'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        title="Mobile"
                    >
                        <Icon icon="lucide:smartphone" className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-6 w-px bg-neutral-200" />

                {/* Language Switcher */}
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                    <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${previewLang === 'en-US'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        onClick={() => onPreviewLangChange('en-US')}
                    >
                        EN
                    </button>
                    <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${previewLang === 'vi-VN'
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                        onClick={() => onPreviewLangChange('vi-VN')}
                    >
                        VI
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 rounded-lg">
                    <button
                        onClick={() => onPreviewScaleChange(Math.max(0.5, previewScale - 0.1))}
                        className="p-2 rounded transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-white hover:shadow-sm"
                        title="Zoom Out"
                    >
                        <Icon icon="lucide:minus" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPreviewScaleChange(1)}
                        className="px-2 py-1.5 text-xs font-medium min-w-[3rem] text-center rounded transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-white hover:shadow-sm"
                        title="Reset Zoom"
                    >
                        {Math.round(previewScale * 100)}%
                    </button>
                    <button
                        onClick={() => onPreviewScaleChange(Math.min(1.5, previewScale + 0.1))}
                        className="p-2 rounded transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-white hover:shadow-sm"
                        title="Zoom In"
                    >
                        <Icon icon="lucide:plus" className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Theme Selector Toggle */}
                {siteId && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleThemeSidebar}
                        className="text-neutral-600 hover:text-neutral-900"
                        title="Site Styles"
                    >
                        <Icon icon="lucide:paintbrush" className="w-5 h-5" />
                    </Button>
                )}

                {/* View Public Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewPublic}
                    title="View Public Page"
                    className="text-neutral-600 hover:text-neutral-900"
                >
                    <Icon icon="lucide:arrow-up-right" className="w-6 h-6" />
                </Button>

            </div>
        </div>
    );
});

export default PageBuilderHeader;
