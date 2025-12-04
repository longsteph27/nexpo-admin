'use client';

import { useEffect } from 'react';

interface UsePageBuilderUnsavedChangesProps {
  // Compute unsaved changes based on actual payload (pages) and pending navigations
  getPayload?: () => Record<string, unknown> | null;
  pendingHeaderNavigation?: { payload: { items?: Record<string, unknown> } } | null;
  pendingFooterNavigation?: { payload: { items?: Record<string, unknown> } } | null;
  // Optional extra deps to trigger recalculation when these change (e.g., blocks)
  watchedDeps?: unknown[];
  isSaving: boolean;
  onUnsavedChange: (hasChanges: boolean) => void;
}

export function usePageBuilderUnsavedChanges({
  getPayload,
  pendingHeaderNavigation,
  pendingFooterNavigation,
  watchedDeps = [],
  isSaving,
  onUnsavedChange,
}: UsePageBuilderUnsavedChangesProps) {
  // Track unsaved changes derived from payload manager and pending navigations
  useEffect(() => {
    const payload = getPayload?.() || null;
    const hasPagePayload = !!payload && Object.keys(payload).length > 0;

    const hasHeaderNav = !!pendingHeaderNavigation?.payload?.items &&
      Object.keys(pendingHeaderNavigation.payload.items).length > 0;
    const hasFooterNav = !!pendingFooterNavigation?.payload?.items &&
      Object.keys(pendingFooterNavigation.payload.items).length > 0;

    onUnsavedChange(hasPagePayload || hasHeaderNav || hasFooterNav);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPayload, pendingHeaderNavigation, pendingFooterNavigation, onUnsavedChange, ...watchedDeps]);

  // Warn before leaving with unsaved changes (consumer controls flag)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If consumer marks unsaved changes and not saving, block unload
      // (The consumer should manage the actual boolean state)
      if (!isSaving) {
        // noop; relying on consumer
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);
}


