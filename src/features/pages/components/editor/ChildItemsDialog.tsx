'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavigationItem {
  id?: string;
  type: 'page' | 'url';
  url?: string;
  page?: any;
  sort: number;
  open_in_new_tab?: boolean;
  icon?: string;
  label?: string;
  translations: Array<{
    languages_code: string;
    title: string;
  }>;
}

interface ChildItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[]; // Changed from 'children' to 'items' to avoid React reserved prop
  pagesData?: any[];
  activeLang: 'en-US' | 'vi-VN';
  onSave: (items: NavigationItem[]) => void;
}

// Common icon options for navigation
const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'lucide:home', label: 'Home' },
  { value: 'lucide:info', label: 'Info' },
  { value: 'lucide:mail', label: 'Mail' },
  { value: 'lucide:phone', label: 'Phone' },
  { value: 'lucide:users', label: 'Users' },
  { value: 'lucide:settings', label: 'Settings' },
  { value: 'lucide:file-text', label: 'File' },
  { value: 'lucide:image', label: 'Image' },
  { value: 'lucide:video', label: 'Video' },
  { value: 'lucide:link', label: 'Link' },
  { value: 'lucide:external-link', label: 'External Link' },
  { value: 'lucide:download', label: 'Download' },
  { value: 'lucide:upload', label: 'Upload' },
  { value: 'lucide:search', label: 'Search' },
  { value: 'lucide:heart', label: 'Heart' },
  { value: 'lucide:star', label: 'Star' },
  { value: 'lucide:bell', label: 'Bell' },
  { value: 'lucide:menu', label: 'Menu' },
  { value: 'lucide:shopping-cart', label: 'Shopping Cart' },
];

export default function ChildItemsDialog({
  isOpen,
  onClose,
  items: initialItems,
  pagesData,
  activeLang,
  onSave
}: ChildItemsDialogProps) {
  const [children, setChildren] = useState<NavigationItem[]>([]);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [childEditLang, setChildEditLang] = useState<Record<string, 'en-US' | 'vi-VN'>>({});
  const [showIconPicker, setShowIconPicker] = useState<Record<string, boolean>>({});

  // Initialize children from props
  useEffect(() => {
    if (isOpen) {
      setChildren(initialItems || []);
    }
  }, [isOpen, initialItems]);

  const addChild = () => {
    const newChild: NavigationItem = {
      id: `temp-child-${Date.now()}`,
      type: 'page',
      sort: children.length,
      translations: [
        { languages_code: 'en-US', title: '' },
        { languages_code: 'vi-VN', title: '' }
      ]
    };
    setChildren([...children, newChild]);
    setExpandedChild(newChild.id!);
  };

  const updateChild = (index: number, field: string, value: any, lang?: 'en-US' | 'vi-VN') => {
    const newChildren = [...children];
    const childId = newChildren[index].id || `child-${index}`;
    
    if (field === 'title') {
      const editLang = lang || childEditLang[childId] || activeLang;
      const transIndex = newChildren[index].translations.findIndex(
        t => t.languages_code === editLang
      );
      if (transIndex >= 0) {
        newChildren[index].translations[transIndex].title = value;
      } else {
        newChildren[index].translations.push({
          languages_code: editLang,
          title: value
        });
      }
    } else {
      (newChildren[index] as any)[field] = value;
    }
    
    setChildren(newChildren);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index).map((child, i) => ({ ...child, sort: i })));
    setExpandedChild(null);
  };

  const moveChild = (index: number, direction: 'up' | 'down') => {
    const newChildren = [...children];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChildren.length) return;
    
    [newChildren[index], newChildren[targetIndex]] = [newChildren[targetIndex], newChildren[index]];
    setChildren(newChildren.map((child, i) => ({ ...child, sort: i })));
  };

  const getChildEditLang = (child: NavigationItem, index: number) => {
    const childId = child.id || `child-${index}`;
    return childEditLang[childId] || activeLang;
  };

  const setChildEditLangForItem = (childId: string, lang: 'en-US' | 'vi-VN') => {
    setChildEditLang((prev) => ({ ...prev, [childId]: lang }));
  };

  const currentChildTitle = (child: NavigationItem, index: number) => {
    const editLang = getChildEditLang(child, index);
    return child.translations.find(t => t.languages_code === editLang)?.title || '';
  };

  const handleSave = () => {
    onSave(children);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-neutral-200">
          <DialogTitle className="flex items-center space-x-3">
            <Icon icon="lucide:list-tree" className="w-5 h-5 text-neutral-700" />
            <span>Manage Child Items</span>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {children.map((child, index) => {
              const childId = child.id || `child-${index}`;
              
              return (
                <div key={childId} className="border border-neutral-200 rounded-lg overflow-hidden">
                  {/* Child Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => setExpandedChild(expandedChild === childId ? null : childId)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Icon icon="lucide:grip-vertical" className="w-4 h-4 text-neutral-400" />
                      {child.icon && (
                        <Icon icon={child.icon} className="w-4 h-4 text-neutral-600" />
                      )}
                      <span className="text-sm font-medium text-neutral-900">
                        {currentChildTitle(child, index) || `Child ${index + 1}`}
                      </span>
                      {child.type === 'url' && (
                        <span className="text-xs text-neutral-500">{child.url}</span>
                      )}
                      {child.type === 'page' && child.page && (
                        <span className="text-xs text-neutral-500">
                          ({pagesData?.find((p: any) => p.id === child.page?.id)?.translations?.find((t: any) => t.languages_code === activeLang)?.title || 'Page'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChild(index, 'up');
                          }}
                          className="p-1 hover:bg-neutral-200 rounded"
                        >
                          <Icon icon="lucide:chevron-up" className="w-4 h-4" />
                        </button>
                      )}
                      {index < children.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChild(index, 'down');
                          }}
                          className="p-1 hover:bg-neutral-200 rounded"
                        >
                          <Icon icon="lucide:chevron-down" className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChild(index);
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Icon icon="lucide:trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Child Form */}
                  {expandedChild === childId && (
                    <div className="p-4 space-y-4 bg-white">
                      {/* Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={child.type}
                          onValueChange={(value) => updateChild(index, 'type', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="page">Page</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Page Selection - Only show when type is 'page' */}
                      {child.type === 'page' && pagesData && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Select Page
                          </label>
                          <Select
                            value={child.page?.id || ''}
                            onValueChange={(value) => {
                              const selectedPage = pagesData.find((p: any) => p.id === value);
                              updateChild(index, 'page', selectedPage || null);
                              if (selectedPage) {
                                const editLang = getChildEditLang(child, index);
                                const pageTitle = selectedPage.translations?.find((t: any) => t.languages_code === editLang)?.title || 
                                                 selectedPage.translations?.[0]?.title || '';
                                if (!currentChildTitle(child, index)) {
                                  updateChild(index, 'title', pageTitle, editLang);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="-- Select a page --" />
                            </SelectTrigger>
                            <SelectContent>
                              {pagesData.map((page: any) => {
                                const pageTitle = page.translations?.find((t: any) => t.languages_code === activeLang)?.title || 
                                                 page.translations?.[0]?.title || 'Untitled';
                                return (
                                  <SelectItem key={page.id} value={page.id}>
                                    {pageTitle}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* URL Input - Only show when type is 'url' */}
                      {child.type === 'url' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              URL <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={child.url || ''}
                              onChange={(e) => updateChild(index, 'url', e.target.value)}
                              placeholder="https://example.com"
                              className="w-full"
                            />
                          </div>

                          {/* Open in new tab - Only show when type is 'url' */}
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={child.open_in_new_tab || false}
                                onChange={(e) => updateChild(index, 'open_in_new_tab', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-neutral-700">Open in new tab</span>
                            </label>
                          </div>
                        </>
                      )}

                      {/* Title with Language Switcher */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-neutral-700">
                            Title <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => setChildEditLangForItem(childId, 'en-US')}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                getChildEditLang(child, index) === 'en-US'
                                  ? 'bg-white text-neutral-900 shadow-sm'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              EN
                            </button>
                            <button
                              type="button"
                              onClick={() => setChildEditLangForItem(childId, 'vi-VN')}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                getChildEditLang(child, index) === 'vi-VN'
                                  ? 'bg-white text-neutral-900 shadow-sm'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              VI
                            </button>
                          </div>
                        </div>
                        <Input
                          value={currentChildTitle(child, index)}
                          onChange={(e) => {
                            const editLang = getChildEditLang(child, index);
                            updateChild(index, 'title', e.target.value, editLang);
                          }}
                          placeholder={`Enter title (${getChildEditLang(child, index) === 'en-US' ? 'English' : 'Vietnamese'})`}
                          className="w-full"
                        />
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Icon
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <Input
                              value={child.icon || ''}
                              onChange={(e) => updateChild(index, 'icon', e.target.value)}
                              placeholder="e.g., lucide:home"
                              className="w-full pr-10"
                            />
                            {child.icon && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Icon icon={child.icon} className="w-5 h-5 text-neutral-600" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowIconPicker({ ...showIconPicker, [childId]: !showIconPicker[childId] })}
                            className="px-3 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 text-sm"
                          >
                            <Icon icon="lucide:grid" className="w-4 h-4" />
                          </button>
                        </div>
                        {showIconPicker[childId] && (
                          <div className="mt-2 p-3 border border-neutral-200 rounded-lg bg-neutral-50 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-4 gap-2">
                              {ICON_OPTIONS.map((icon) => (
                                <button
                                  key={icon.value}
                                  type="button"
                                  onClick={() => {
                                    updateChild(index, 'icon', icon.value);
                                    setShowIconPicker({ ...showIconPicker, [childId]: false });
                                  }}
                                  className={`p-2 rounded border-2 transition-colors ${
                                    child.icon === icon.value
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-neutral-200 hover:border-blue-300'
                                  }`}
                                  title={icon.label}
                                >
                                  {icon.value ? (
                                    <Icon icon={icon.value} className="w-5 h-5 mx-auto text-neutral-700" />
                                  ) : (
                                    <span className="text-xs text-neutral-400">None</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Label (Multiline Text) */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Label
                        </label>
                        <textarea
                          value={child.label || ''}
                          onChange={(e) => updateChild(index, 'label', e.target.value)}
                          placeholder="Label to help users. Displays below the link in dropdown nav menus."
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          Label to help users. Displays below the link in dropdown nav menus.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {children.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Icon icon="lucide:list-tree" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No child items yet</p>
              </div>
            )}
          </div>

          <button
            onClick={addChild}
            className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium text-neutral-700"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
            <span>Add Child Item</span>
          </button>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
          >
            <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

