'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface CatalogItemProps {
  item: { id: string; label: string; icon: string };
  onClick: () => void;
}

export function CatalogItem({ item, onClick }: CatalogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: `catalog-${item.id}`,
    data: {
      type: 'catalog-item',
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 w-full h-full text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-content-primary shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 0.95 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{
        scale: 1.05,
        backgroundColor: '#f9fafb',
        borderColor: '#3b82f6',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.3, type: 'spring' }}
      >
        <Icon icon={item.icon} className="w-4 h-4 text-gray-600" />
      </motion.div>
      <motion.span
        className="text-xs font-medium"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.2 }}
      >
        {item.label}
      </motion.span>
    </motion.button>
  );
}


