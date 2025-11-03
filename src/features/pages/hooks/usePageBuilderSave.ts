'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { navigationApi } from '@/lib/api';
import { pagesApi } from '../api';
import { toast } from 'sonner';
import type { Block } from '../types';

interface UsePageBuilderSaveProps {
  pageId: string;
  page: any;
  blocks: Block[];
  headerItems: any[];
  footerItems: any[];
  navigations?: any[];
  eventId: string;
  selectedTenant?: any;
  onSuccess?: () => void;
}

export function usePageBuilderSave({
  pageId,
  page,
  blocks,
  headerItems,
  footerItems,
  navigations,
  eventId,
  selectedTenant,
  onSuccess,
}: UsePageBuilderSaveProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      // Prepare blocks payload with create/update/delete structure
      const originalBlocks = page?.blocks || [];
      const originalBlockIds = new Set(originalBlocks.map((b: any) => b.id));
      const currentBlockIds = new Set(blocks.map(b => b.id).filter(id => !String(id).startsWith('temp-')));
      
      // Categorize blocks
      const blocksPayload = {
        create: [] as any[],
        update: [] as any[],
        delete: [] as string[],
      };

      // Find blocks to delete (in original but not in current)
      originalBlocks.forEach((originalBlock: any) => {
        if (!currentBlockIds.has(originalBlock.id)) {
          blocksPayload.delete.push(originalBlock.id);
        }
      });

      // Process current blocks
      blocks.forEach((block, index) => {
        const isTemp = String(block.id).startsWith('temp-');
        
        // Process translations with create/update structure
        const processTranslations = (translations: any[], originalTranslations: any[] = []) => {
          if (!translations || translations.length === 0) {
            return undefined;
          }

          const translationsPayload: any = {
            create: [] as any[],
            update: [] as any[],
            delete: [] as number[]
          };

          // Map of existing translations by language code
          const originalTransMap = new Map(
            originalTranslations.map(t => [t.languages_code, t])
          );

          // Process each translation
          translations.forEach((trans) => {
            const original = originalTransMap.get(trans.languages_code);
            
            if (original && original.id) {
              // Existing translation - update
              translationsPayload.update.push({
                id: original.id,
                ...trans,
                languages_code: undefined, // Don't include in update
              });
              originalTransMap.delete(trans.languages_code);
            } else {
              // New translation - create
              translationsPayload.create.push({
                ...trans,
                languages_code: { code: trans.languages_code }
              });
            }
          });

          // Remaining translations should be deleted
          originalTransMap.forEach((trans) => {
            if (trans.id) {
              translationsPayload.delete.push(trans.id);
            }
          });

          // Only return if there are changes
          if (translationsPayload.create.length === 0 && 
              translationsPayload.update.length === 0 && 
              translationsPayload.delete.length === 0) {
            return undefined;
          }

          return translationsPayload;
        };

        // Get original block for comparison
        const originalBlock = originalBlocks.find((b: any) => b.id === block.id);
        const originalTranslations = originalBlock?.item?.translations || [];

        // Process item data
        const itemData = {
          ...block.item,
          tenant_id: page?.site?.tenant_id || selectedTenant?.id,
          event_id: page?.site?.event_id || Number(eventId),
        };

        console.log(`[usePageBuilderSave] Processing block ${block.collection} (${isTemp ? 'NEW' : 'UPDATE'}):`, {
          blockId: block.id,
          tenant_id: itemData.tenant_id,
          event_id: itemData.event_id,
          hasTranslations: !!itemData.translations
        });

        // Handle translations
        if (itemData.translations) {
          const translationsPayload = processTranslations(itemData.translations, originalTranslations);
          if (translationsPayload) {
            itemData.translations = translationsPayload;
            console.log(`[usePageBuilderSave] Translations payload for ${block.collection}:`, translationsPayload);
          } else {
            // No changes - remove translations from payload for updates
            if (!isTemp) {
              delete itemData.translations;
            }
          }
        }
        
        if (isTemp) {
          // New block - add to create (NO ID for create)
          const blockData = {
            collection: block.collection,
            sort: index,
            item: itemData,
          };
          blocksPayload.create.push(blockData);
          console.log(`[usePageBuilderSave] Added to CREATE:`, blockData);
        } else {
          // Existing block - add to update (WITH ID for update)
          const blockData = {
            collection: block.collection,
            id: block.id,
            sort: index,
            item: itemData,
          };
          blocksPayload.update.push(blockData);
          console.log(`[usePageBuilderSave] Added to UPDATE:`, blockData);
        }
      });

      // Save page with blocks using create/update/delete structure
      console.log('[usePageBuilderSave] Saving page with payload:', {
        blocks: blocksPayload,
        event_id: page?.site?.event_id,
        tenant_id: page?.site?.tenant_id,
        site_data: page?.site,
      });

      await pagesApi.updatePageBlocks(pageId, {
        blocks: blocksPayload,
        event_id: page?.site?.event_id,
      });

      // Save navigation if edited
      if (navigations && Array.isArray(navigations)) {
        const headerNav = navigations.find((n: any) => n.type === 'header');
        const footerNav = navigations.find((n: any) => n.type === 'footer');

        if (headerNav && headerItems.length > 0) {
          await navigationApi.updateNavigation(headerNav.id, {
            items: headerItems,
          });
        }

        if (footerNav && footerItems.length > 0) {
          await navigationApi.updateNavigation(footerNav.id, {
            items: footerItems,
          });
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['page-detail', pageId] });
      const siteId = page?.site_id || page?.site?.id;
      if (siteId) {
        queryClient.invalidateQueries({ queryKey: ['navigations', siteId] });
      }
      
      toast.success('Page saved successfully!', {
        description: 'All changes have been saved to Directus.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save page', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    save,
    isSaving,
  };
}


