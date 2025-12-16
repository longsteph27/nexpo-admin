'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuilderFormField as FormField } from '../../types';

export interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  activeLang: 'en-US' | 'vi-VN';
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isAnyDragging?: boolean;
  showDropIndicator?: boolean;
}

export function SortableFieldItem({
  field,
  isSelected,
  activeLang,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  isAnyDragging = false,
  showDropIndicator = false,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldLabel = field.translations?.[activeLang]?.label || field.name || 'Untitled Field';
  const fieldPlaceholder = field.translations?.[activeLang]?.placeholder || '';
  const fieldHelp = field.translations?.[activeLang]?.help || '';
  const fieldOptions = field.translations?.[activeLang]?.options || [];

  return (
    <>
      {showDropIndicator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-blue-500 rounded-full mb-2"
        />
      )}

      <motion.div
        ref={setNodeRef}
        style={{
          ...style,
          pointerEvents: isDragging || isAnyDragging ? 'none' : 'auto',
        }}
        className={`group relative p-3 rounded-lg border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
          } ${isDragging ? 'opacity-30 scale-95' : ''}`}
        onClick={onSelect}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: isDragging ? 0.3 : 1,
          y: 0,
          scale: isDragging ? 0.95 : 1,
          borderColor: isSelected ? '#3b82f6' : 'transparent',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          zIndex: isDragging ? 1000 : 'auto',
        }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          duration: isDragging ? 0.1 : 0.3,
          ease: 'easeOut',
          layout: { duration: 0.2 },
        }}
        whileHover={{
          borderColor: isSelected ? '#3b82f6' : '#d1d5db',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <motion.div
          className="absolute -top-2 -right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={{ scale: 0.8 }}
          animate={{
            scale: isSelected ? 1 : 0.8,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            title="Move up"
            whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:chevron-up" className="w-3 h-3 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            title="Move down"
            whileHover={{ scale: 1.1, backgroundColor: '#f3f4f6' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:chevron-down" className="w-3 h-3 text-gray-600" />
          </motion.button>
          <motion.button
            className="p-1 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Delete"
            whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:trash-2" className="w-3 h-3" />
          </motion.button>
        </motion.div>

        <motion.div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={{ scale: 0.8, x: -10 }}
          animate={{
            scale: isSelected ? 1 : 0.8,
            x: isSelected ? 0 : -10,
          }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="p-1 bg-white border border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing"
            whileHover={{
              scale: 1.1,
              backgroundColor: '#f8fafc',
              borderColor: '#3b82f6',
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <Icon icon="lucide:grip-vertical" className="w-3 h-3 text-gray-400" />
          </motion.div>
        </motion.div>

        <div className="min-h-[80px] flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {fieldLabel}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              className="w-full px-4 py-4 border border-gray-300 rounded-md text-sm bg-white text-gray-900 pointer-events-none flex-1"
              placeholder={fieldPlaceholder}
              rows={4}
              disabled
              readOnly
            />
          ) : field.type === 'select' ? (
            <select
              className="w-full px-4 py-4 border border-gray-300 rounded-md text-sm bg-white text-gray-900 pointer-events-none appearance-none"
              disabled
            >
              <option>{fieldPlaceholder || 'Select an option'}</option>
              {fieldOptions.map((opt, i) => (
                <option key={i}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'multiselect' ? (
            <div className="space-y-2 pointer-events-none flex-1">
              {fieldOptions.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </div>
              ))}
              {fieldOptions.length === 0 && <span className="text-sm text-gray-400 italic">No options defined</span>}
            </div>
          ) : field.type === 'file' || field.type === 'image' ? (
            <div className="relative pointer-events-none">
              <input
                type="file"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                disabled
              />
            </div>
          ) : (
            <input
              type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
              className="w-full px-4 py-4 border border-gray-300 rounded-md text-sm bg-white text-gray-900 pointer-events-none"
              placeholder={fieldPlaceholder}
              disabled
              readOnly
            />
          )}

          {fieldHelp && <p className="text-xs text-gray-500 mt-1">{fieldHelp}</p>}
        </div>
      </motion.div>
    </>
  );
}

