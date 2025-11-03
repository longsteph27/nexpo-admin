'use client';

import { useEffect } from 'react';

interface UsePageBuilderUnsavedChangesProps {
  blocks: any[];
  headerItems: any[];
  footerItems: any[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onUnsavedChange: (hasChanges: boolean) => void;
}

export function usePageBuilderUnsavedChanges({
  blocks,
  headerItems,
  footerItems,
  hasUnsavedChanges,
  isSaving,
  onUnsavedChange,
}: UsePageBuilderUnsavedChangesProps) {
  // Track unsaved changes
  useEffect(() => {
    onUnsavedChange(true);
  }, [blocks, headerItems, footerItems, onUnsavedChange]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);
}


