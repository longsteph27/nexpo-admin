/**
 * Hook to manage page payload using PagePayloadManager
 * Automatically tracks changes and builds payload for submission
 */

import { useRef, useCallback, useEffect } from 'react';
import { PagePayloadManager } from '../services/pagePayloadManager';
import type { Page, Block, LanguageCode } from '../types';

interface UsePagePayloadManagerProps {
  page?: Partial<Page>;
  eventId: number;
  tenantId?: number;
}

export function usePagePayloadManager({
  page,
  eventId,
  tenantId,
}: UsePagePayloadManagerProps) {
  const payloadManagerRef = useRef<PagePayloadManager | null>(null);

  // Initialize payload manager when page data is available
  useEffect(() => {
    if (page) {
      payloadManagerRef.current = new PagePayloadManager(page);
    }
  }, [page]); // Re-init when page data changes (e.g. after refetch)

  // Update translation permalink (kept for compatibility)
  const updateTranslationPermalink = useCallback((
    languageCode: LanguageCode | string,
    permalink: string,
    title?: string | null
  ) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.updateTranslationPermalink(
        languageCode,
        permalink,
        title
      );
    }
  }, []);

  // Stage page translation changes (title/permalink)
  const stagePageTranslation = useCallback((
    languageCode: LanguageCode | string,
    changes: { title?: string | null; permalink?: string | null }
  ) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.stagePageTranslation(languageCode, changes);
    }
  }, []);

  // Update direct field (sort, status, site_id)
  const updateField = useCallback(<
    K extends 'sort' | 'status' | 'site_id'
  >(field: K, value: Parameters<PagePayloadManager['updateField']>[1]) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.updateField(field, value);
    }
  }, []);

  // Upsert a block (add or update)
  const upsertBlock = useCallback((
    block: Block,
    blockIndex: number
  ) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.upsertBlock(
        block,
        blockIndex,
        eventId,
        tenantId
      );
    }
  }, [eventId, tenantId]);

  // Remove a block
  const removeBlock = useCallback((blockId: string) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.removeBlock(blockId);
    }
  }, []);

  // Rebuild blocks payload from current blocks array
  const rebuildBlocks = useCallback((currentBlocks: Block[]) => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.rebuildBlocks(
        currentBlocks,
        eventId,
        tenantId
      );
    }
  }, [eventId, tenantId]);

  // Get final payload
  const getPayload = useCallback(() => {
    return payloadManagerRef.current?.getPayload() || null;
  }, []);

  // Check if there are changes
  const hasChanges = useCallback(() => {
    return payloadManagerRef.current?.hasChanges() || false;
  }, []);

  // Reset all changes
  const reset = useCallback(() => {
    if (payloadManagerRef.current) {
      payloadManagerRef.current.reset();
    }
  }, []);

  // Get current state (for debugging)
  const getState = useCallback(() => {
    return payloadManagerRef.current?.getState();
  }, []);

  return {
    updateTranslationPermalink,
    stagePageTranslation,
    updateField,
    upsertBlock,
    removeBlock,
    rebuildBlocks,
    getPayload,
    hasChanges,
    reset,
    getState,
    payloadManager: payloadManagerRef.current,
  };
}


