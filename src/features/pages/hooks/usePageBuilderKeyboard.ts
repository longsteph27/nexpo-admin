'use client';

import { useEffect } from 'react';

interface UsePageBuilderKeyboardProps {
  onSave: () => void;
  onCloseModals: () => void;
  blocks: any[];
  headerItems: any[];
  footerItems: any[];
}

export function usePageBuilderKeyboard({
  onSave,
  onCloseModals,
  blocks,
  headerItems,
  footerItems,
}: UsePageBuilderKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        onCloseModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onCloseModals, blocks, headerItems, footerItems]);
}


