'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { BuilderFormField as FormField } from '../../types';
import { SortableFieldItem } from './SortableFieldItem';

export interface FormPreviewDroppableProps {
  children: React.ReactNode;
  fields: FormField[];
  activeLang: 'en-US' | 'vi-VN';
  formLang: {
    'en-US': { title?: string; submit_label?: string; success_message?: string };
    'vi-VN': { title?: string; submit_label?: string; success_message?: string };
  };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
  isAnyDragging?: boolean;
  dropPosition?: number | null;
  activeId?: string | null;
}

export function FormPreviewDroppable({
  children,
  fields,
  activeLang,
  formLang,
  selectedId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  isAnyDragging = false,
  dropPosition = null,
  activeId = null,
}: FormPreviewDroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-preview',
  });

  return (
    <div className="relative h-full">
      <div
        ref={setNodeRef}
        className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full overflow-y-auto transition-colors ${
          isOver ? 'border-blue-400 bg-blue-50/30' : ''
        }`}
      >
        {children}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {fields.length === 0 ? (
              <motion.div
                key="empty-state"
                className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, type: 'spring' }}
                >
                  <Icon icon="lucide:mouse-pointer-click" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                </motion.div>
                <motion.p
                  className="text-sm text-gray-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  Drag field types from the left or click to add fields
                </motion.p>
              </motion.div>
            ) : (
              <div className="relative">
                <SortableContext items={fields.map((f) => f.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {fields
                      .slice()
                      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                      .map((field, idx) => (
                        <div
                          key={field.id || `temp-${idx}`}
                          className={`${field.width === 'half' ? 'md:col-span-1' : 'col-span-1 md:col-span-2'} self-start`}
                        >
                          {isAnyDragging && dropPosition === idx && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="border-2 border-dashed border-blue-500 rounded-lg bg-blue-50/50 min-h-[120px] flex items-center justify-center relative mb-4"
                            >
                              <div className="text-center text-blue-600">
                                <Icon icon="lucide:plus" className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                                <p className="text-sm font-medium">Drop here</p>
                                <p className="text-xs text-blue-500 mt-1">Position {idx + 1}</p>
                              </div>

                              {isAnyDragging && !String(activeId || '').startsWith('catalog-') && (
                                <div className="absolute inset-2 border border-blue-300 rounded bg-blue-100/30 flex items-center justify-center">
                                  <div className="text-xs text-blue-600 font-medium">
                                    {fields.find((f) => f.id === activeId)?.translations?.[activeLang]?.label ||
                                      fields.find((f) => f.id === activeId)?.name ||
                                      'Field'}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}

                          <SortableFieldItem
                            field={field}
                            isSelected={selectedId === field.id}
                            activeLang={activeLang}
                            onSelect={() => onSelect(field.id)}
                            onMoveUp={() => onMoveUp(idx)}
                            onMoveDown={() => onMoveDown(idx)}
                            onRemove={() => onRemove(field.id)}
                            isAnyDragging={isAnyDragging}
                            showDropIndicator={false}
                          />
                        </div>
                      ))}

                    {isAnyDragging && dropPosition === fields.length && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="col-span-1 md:col-span-2 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50/50 min-h-[120px] flex items-center justify-center relative mt-4"
                      >
                        <div className="text-center text-blue-600">
                          <Icon icon="lucide:plus" className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                          <p className="text-sm font-medium">Drop here</p>
                          <p className="text-xs text-blue-500 mt-1">At the end</p>
                        </div>

                        {isAnyDragging && !String(activeId || '').startsWith('catalog-') && (
                          <div className="absolute inset-2 border border-blue-300 rounded bg-blue-100/30 flex items-center justify-center">
                            <div className="text-xs text-blue-600 font-medium">
                              {fields.find((f) => f.id === activeId)?.translations?.[activeLang]?.label ||
                                fields.find((f) => f.id === activeId)?.name ||
                                'Field'}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </SortableContext>

                <div className="min-h-[4px] w-full" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {fields.length > 0 && (
            <motion.div
              className="mt-6 pt-4 border-t border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.button
                type="button"
                className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm opacity-50 cursor-not-allowed"
                disabled
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                {formLang[activeLang]?.submit_label || 'Submit'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute inset-0 z-30"
        initial={{ opacity: 0, pointerEvents: 'none' }}
        animate={{
          opacity: isOver ? 1 : 0,
          pointerEvents: isOver ? 'auto' : 'none',
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
        }}
      >
        <div className="absolute inset-0 bg-blue-50/20" />
      </motion.div>
    </div>
  );
}

