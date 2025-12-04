'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { navigationApi } from '@/lib/api';
import { pagesApi } from '../api';
import { toast } from 'sonner';
import type {
  PageUpdatePayload,
  Page,
  Navigation,
  Site,
  NavigationUpdatePayload,
} from '@/types/directus-collections';

// Internal NavigationItem type (from HeaderNavigationDialog/FooterNavigationDialog)
interface NavigationItem {
  id?: string;
  type: 'page' | 'url';
  url?: string;
  page?: Page | { id: string } | null;
  sort: number;
  open_in_new_tab?: boolean;
  icon?: string;
  label?: string;
  has_children?: boolean;
  children?: NavigationItem[];
  parent?: string | null;
  translations: Array<{
    languages_code: string;
    title: string;
  }>;
}

interface UsePageBuilderSaveProps {
  pageId: string;
  page: Page | undefined;
  headerItems: NavigationItem[];
  footerItems: NavigationItem[];
  navigations?: Navigation[];
  onSuccess?: () => void;
  getPayload?: () => PageUpdatePayload | null; // Get payload from PagePayloadManager
}

export function usePageBuilderSave({
  pageId,
  page,
  headerItems,
  footerItems,
  navigations,
  onSuccess,
  getPayload,
}: UsePageBuilderSaveProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      // Get payload from PagePayloadManager
      const pagePayload = getPayload?.();
      
      if (pagePayload && Object.keys(pagePayload).length > 0) {
        console.log('[usePageBuilderSave] Saving page with payload:', pagePayload);

        // Prepare payload with event_id for blocks
        const payloadWithEventId: PageUpdatePayload & { event_id?: number } = {
          ...pagePayload,
        };

        // Add event_id if blocks exist (needed for block creation)
        if (pagePayload.blocks) {
          const siteData = page?.site as Site | undefined;
          payloadWithEventId.event_id = siteData?.event_id || undefined;
        }

        await pagesApi.updatePage(pageId, payloadWithEventId as Record<string, unknown>);
      }

      // Navigation saving is handled in PageBuilder.tsx via pendingHeaderNavigation/pendingFooterNavigation
      // Legacy navigation saving removed to prevent unintended updates when there are no diffs

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['page-detail', pageId] });
      const siteId = page?.site_id || ((page?.site as Site | undefined)?.id);
      if (siteId) {
        queryClient.invalidateQueries({ queryKey: ['navigations', siteId] });
        queryClient.invalidateQueries({ queryKey: ['site-navigation', siteId] });
      }
      
      toast.success('Page saved successfully!', {
        description: 'All changes have been saved to Directus.',
      });

      onSuccess?.();
    } catch (error: unknown) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      toast.error('Failed to save page', {
        description: errorMessage,
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


