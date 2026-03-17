'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

export interface BulkAction {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionBar({ count, onClear, actions }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{ backgroundColor: '#111827', color: '#ffffff', border: '1px solid #374151' }}
        >
          {/* Count */}
          <div className="flex items-center gap-2 pr-3" style={{ borderRight: '1px solid #374151' }}>
            <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
              <Icon icon="lucide:check" className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white">{count} selected</span>
          </div>

          {/* Actions */}
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              disabled={action.loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                action.variant === 'danger'
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  : 'hover:bg-white/10'
              }`}
              style={action.variant !== 'danger' ? { color: '#ffffff' } : undefined}
            >
              {action.loading ? (
                <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
              ) : action.icon ? (
                <Icon icon={action.icon} className="w-3.5 h-3.5" />
              ) : null}
              {action.label}
            </button>
          ))}

          {/* Clear */}
          <button
            onClick={onClear}
            className="ml-1 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: '#9ca3af' }}
          >
            <Icon icon="lucide:x" className="w-3.5 h-3.5 text-inherit" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
