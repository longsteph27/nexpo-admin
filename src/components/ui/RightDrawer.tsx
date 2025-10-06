'use client';

import React from 'react';
import Button from './Button';

interface RightDrawerProps {
  open: boolean;
  title?: string;
  widthClassName?: string;
  level?: number;
  onClose: () => void;
  children: React.ReactNode;
  tipText?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  headerGradient?: string;
}

export function RightDrawer({ open, title, widthClassName = 'w-[420px]', level = 0, onClose, children, tipText = 'This is some tips', primaryLabel = 'Apply', secondaryLabel = 'Cancel', onPrimary, onSecondary, headerGradient = 'from-indigo-500 via-purple-500 to-pink-500' }: RightDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 50 + level * 2 }}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full bg-white shadow-xl border-l border-gray-200 transform transition-transform ${widthClassName} ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ zIndex: 51 + level * 2 }}
        aria-hidden={!open}
      >
        {/* Header with gradient */}
        <div className={`h-20 bg-gradient-to-r ${headerGradient} flex items-center justify-between px-5`}>
          <div className="text-base font-semibold text-white truncate drop-shadow-sm">{title || 'Edit'}</div>
          <button onClick={onClose} className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white" aria-label="Close drawer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-128px)] overflow-auto p-5 pb-28 bg-gradient-to-b from-gray-50 to-white">
          {/* Form container styling similar to the screenshot */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
        {/* Tip bar */}
        <div className="absolute left-0 right-0 bottom-[56px] border-t bg-gray-50/90 backdrop-blur px-5 py-3 text-sm text-gray-600">
          {tipText}
        </div>
        {/* Footer buttons */}
        <div className="absolute left-0 right-0 bottom-0 flex items-center justify-end gap-3 px-5 py-3 border-t bg-white/95 backdrop-blur">
          <Button variant="outline" onClick={onSecondary || onClose}>{secondaryLabel}</Button>
          <Button variant="primary" onClick={onPrimary || onClose}>{primaryLabel}</Button>
        </div>
      </aside>
    </>
  );
}

export default RightDrawer;


