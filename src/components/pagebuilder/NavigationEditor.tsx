'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { Input } from '@/components/ui/input';

interface NavigationItem {
  id: string;
  type: string;
  url?: string;
  sort: number;
  translations: Array<{
    languages_code: string;
    title: string;
  }>;
}

interface NavigationEditorProps {
  type: 'header' | 'footer';
  items: NavigationItem[];
  onChange: (items: NavigationItem[]) => void;
  activeLang: 'en-US' | 'vi-VN';
}

export default function NavigationEditor({
  type,
  items,
  onChange,
  activeLang,
}: NavigationEditorProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const addItem = () => {
    const newItem: NavigationItem = {
      id: `temp-nav-${Date.now()}`,
      type: 'link',
      url: '',
      sort: items.length,
      translations: [
        { languages_code: 'en-US', title: '' },
        { languages_code: 'vi-VN', title: '' },
      ],
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'title') {
      const transIndex = newItems[index].translations.findIndex(
        t => t.languages_code === activeLang
      );
      if (transIndex >= 0) {
        newItems[index].translations[transIndex].title = value;
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onChange(newItems.map((item, i) => ({ ...item, sort: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 capitalize">
            {type} Navigation
          </h3>
          <p className="text-xs text-neutral-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const currentTranslation = item.translations.find(t => t.languages_code === activeLang);
          const isExpanded = expandedItem === item.id;

          return (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex flex-col space-y-1">
                    <button
                      className="p-0.5 hover:bg-neutral-100 rounded disabled:opacity-30"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <Icon icon="lucide:chevron-up" className="w-3 h-3" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-neutral-100 rounded disabled:opacity-30"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                    >
                      <Icon icon="lucide:chevron-down" className="w-3 h-3" />
                    </button>
                  </div>

                  <Icon icon="lucide:link" className="w-4 h-4 text-neutral-500" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {currentTranslation?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {item.url || 'No URL'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  >
                    <Icon
                      icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                      className="w-4 h-4 text-neutral-600"
                    />
                  </button>
                  <button
                    className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600"
                    onClick={() => removeItem(index)}
                  >
                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-neutral-200 p-4 space-y-3 bg-neutral-50"
                >
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Title
                    </label>
                    <Input
                      size="sm"
                      value={currentTranslation?.title || ''}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      placeholder="Menu item title..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Link Type
                    </label>
                    <select
                      className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.type}
                      onChange={(e) => updateItem(index, 'type', e.target.value)}
                    >
                      <option value="link">External Link</option>
                      <option value="page">Internal Page</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      URL
                    </label>
                    <Input
                      size="sm"
                      value={item.url || ''}
                      onChange={(e) => updateItem(index, 'url', e.target.value)}
                      placeholder="/about or https://..."
                    />
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
            <Icon icon="lucide:navigation" className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No navigation items</p>
          </div>
        )}
      </div>
    </div>
  );
}

