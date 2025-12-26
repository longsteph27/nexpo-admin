'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import '@/styles/pagebuilder.css';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePageBuilderBlocks,
  usePageBuilderNavigation,
  usePageBuilderKeyboard,
  usePageBuilderUnsavedChanges,
  usePageBuilderSave,
  usePageData,
  usePageNavigations,
  usePageSiteNavigation,
  usePageSite,
  usePagePayloadManager
} from '@/features/pages/hooks/usePages';
import { useSiteTheme } from '@/features/pages/hooks/useSiteTheme';
import type { Block, Page, PageTranslation } from '@/features/pages/types';
import type {
  PageBlock,
  Navigation,
  NavigationItem as DirectusNavigationItem,
  NavigationItemTranslation,
  NavigationUpdatePayload,
  Site,
  LanguageCode as DirectusLanguageCode,
} from '@/types/directus-collections';
import type { Tenant } from '@/lib/directus';
import { extractLanguageCode } from '@/types/directus-collections';
import PageBuilderHeader from './PageBuilderHeader';
import BlockSelectorModal from './BlockSelectorModal';
import BlockEditorModal from './BlockEditorModal';
import PagePreview from './PagePreview';
import PageMetadataDialog from './PageMetadataDialog';
import { HeaderNavigationBlockEditor, FooterNavigationBlockEditor } from '../blocks/editor';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BlockSkeleton from '@/components/ui/BlockSkeleton';
import { useAppContextStore } from '@/store/appContext';
import ThemeSelector from '@/components/ui/ThemeSelector';

interface PageBuilderProps {
  eventId: string;
  pageId: string;
}

export default function PageBuilder({ eventId, pageId }: PageBuilderProps) {
  const { selectedTenant } = useAuth();
  const { tenantId: ctxTenantId, eventId: ctxEventId } = useAppContextStore();

  // Get folder and event ID for uploads
  const folderId = (selectedTenant as Tenant | null)?.folder_files_id || undefined;
  const uploadEventId = ctxEventId ? String(ctxEventId) : (eventId || undefined);

  // UI State
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [previewLang, setPreviewLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [showHeaderDialog, setShowHeaderDialog] = useState(false);
  const [showFooterDialog, setShowFooterDialog] = useState(false);
  const [pendingHeaderNavigation, setPendingHeaderNavigation] = useState<{
    navigationId: string | null;
    siteId: number;
    headerNavigation: Navigation | null;
    payload: NavigationUpdatePayload;
  } | null>(null);
  const [pendingFooterNavigation, setPendingFooterNavigation] = useState<{
    navigationId: string | null;
    siteId: number;
    footerNavigation: Navigation | null;
    payload: NavigationUpdatePayload;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState<number | 'header' | 'footer' | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewScale, setPreviewScale] = useState(1);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [metadataDialogLang, setMetadataDialogLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [stagedTranslations, setStagedTranslations] = useState<Array<{ languages_code: 'en-US' | 'vi-VN'; title?: string; permalink?: string; isNew: boolean }>>([]);
  // Track temporary metadata changes (title/permalink) before saving
  const [tempMetadata, setTempMetadata] = useState<Record<'en-US' | 'vi-VN', { title?: string | null; permalink?: string | null }>>({
    'en-US': {},
    'vi-VN': {},
  });

  // Theme State
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<any>(null); // Use 'any' or import Theme type if available

  // Fetch page data
  const { data: page, isLoading, refetch: refetchPage } = usePageData(pageId);

  // Get siteId from page data
  const siteId = (page as Page | undefined)?.site_id || ((page as Page | undefined)?.site as Site | undefined)?.id;

  // Fetch site navigation
  const { data: navigations } = usePageNavigations(siteId, !!page);

  // Fetch site navigation for header/footer sections
  const { data: siteNavigation } = usePageSiteNavigation({
    siteId: siteId as number | undefined,
    enabled: !!page && !!siteId
  });

  // Fetch site data for logo
  const { data: site } = usePageSite({
    siteId: siteId as number | undefined,
    enabled: !!page && !!siteId
  });

  // Fetch saved theme for initial sidebar state
  const { theme: savedTheme } = useSiteTheme({
    siteId: siteId as number | undefined,
    enabled: !!siteId,
  });

  // Custom hooks
  const {
    blocks,
    isLoadingBlocks,
    replaceBlock,
    deleteBlock,
    moveBlock,
    insertBlockAt,
    reorderBlocks,
  } = usePageBuilderBlocks({ pageBlocks: (page as Page | undefined)?.blocks as PageBlock[] | undefined });

  const {
    headerItems,
    footerItems,
    setHeaderItems,
    setFooterItems,
  } = usePageBuilderNavigation({ navigations });

  // Initialize PagePayloadManager
  const {
    removeBlock,
    rebuildBlocks,
    getPayload,
    reset: resetPayload,
    updateTranslationPermalink,
    stagePageTranslation,
  } = usePagePayloadManager({
    page: page as Page | undefined,
    eventId: Number(uploadEventId || eventId),
    tenantId: ctxTenantId ?? (selectedTenant as Tenant | null)?.id,
  });

  const headerNavigationPreview = useMemo<(Navigation & { items?: DirectusNavigationItem[] }) | null>(() => {
    if (headerItems && headerItems.length > 0) {
      const normalizedItems = normalizeNavigationItems(headerItems);
      const baseNavigation = siteNavigation?.header ?? ({} as Navigation);
      return {
        ...baseNavigation,
        items: normalizedItems,
      } as Navigation & { items?: DirectusNavigationItem[] };
    }
    if (siteNavigation?.header) {
      return siteNavigation.header as Navigation & { items?: DirectusNavigationItem[] };
    }
    return null;
  }, [headerItems, siteNavigation?.header]);

  const footerNavigationPreview = useMemo<(Navigation & { items?: DirectusNavigationItem[] }) | null>(() => {
    if (footerItems && footerItems.length > 0) {
      const normalizedItems = normalizeNavigationItems(footerItems);
      const baseNavigation = siteNavigation?.footer ?? ({} as Navigation);
      return {
        ...baseNavigation,
        items: normalizedItems,
      } as Navigation & { items?: DirectusNavigationItem[] };
    }
    if (siteNavigation?.footer) {
      return siteNavigation.footer as Navigation & { items?: DirectusNavigationItem[] };
    }
    return null;
  }, [footerItems, siteNavigation?.footer]);

  const currentPageTranslation = useMemo(() => {
    const pageData = page as Page | undefined;
    return pageData?.translations?.find(
      (translation: PageTranslation) =>
        extractLanguageCode(translation.languages_code) === previewLang
    );
  }, [page, previewLang]);

  // Use temporary metadata if available, otherwise use original translation
  const currentPageTitle = tempMetadata[previewLang]?.title !== undefined
    ? (tempMetadata[previewLang].title || 'Untitled Page')
    : (currentPageTranslation?.title || 'Untitled Page');

  const currentPagePermalink = tempMetadata[previewLang]?.permalink !== undefined
    ? (tempMetadata[previewLang].permalink || '/untitled-page')
    : (currentPageTranslation?.permalink && currentPageTranslation.permalink.trim() !== ''
      ? currentPageTranslation.permalink
      : '/untitled-page');

  // Track editingBlock changes
  useEffect(() => {
    if (editingBlock) {
      console.log('[PageBuilder] editingBlock changed:', {
        id: editingBlock.id,
        isTemp: String(editingBlock.id).startsWith('temp-'),
        collection: editingBlock.collection,
      });
    }
  }, [editingBlock]);

  // Track selectedBlockIndex changes
  useEffect(() => {
    console.log('[PageBuilder] selectedBlockIndex changed:', selectedBlockIndex);
  }, [selectedBlockIndex]);

  // Track if this is the initial load to prevent unnecessary payload rebuild
  const isInitialLoadRef = React.useRef(true);
  const previousBlocksRef = React.useRef<Block[]>([]);

  // Rebuild blocks payload when blocks change (but not on initial load)
  useEffect(() => {
    if (page && blocks) {
      // Skip rebuild on initial load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        previousBlocksRef.current = blocks;
        return;
      }

      // Only rebuild if blocks actually changed
      const blocksChanged =
        blocks.length !== previousBlocksRef.current.length ||
        blocks.some((block, index) => {
          const prevBlock = previousBlocksRef.current[index];
          return !prevBlock || block.id !== prevBlock.id || block !== prevBlock;
        });

      if (blocksChanged) {
        rebuildBlocks(blocks);
        previousBlocksRef.current = blocks;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, (page as Page | undefined)?.id]); // Rebuild when blocks or page ID changes

  const { save: baseSave, isSaving } = usePageBuilderSave({
    pageId,
    page: page as Page | undefined,
    headerItems,
    footerItems,
    navigations: navigations as Navigation[] | undefined,
    getPayload,
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setPendingHeaderNavigation(null);
      setPendingFooterNavigation(null);
      setStagedTranslations([]); // Clear staged translations after save
      setTempMetadata({ 'en-US': {}, 'vi-VN': {} }); // Clear temporary metadata
      resetPayload();
      // Refetch page data to get the latest state (including new IDs)
      // This will triger usePagePayloadManager to re-init with clean data
      refetchPage();
      // Return to preview mode after successful save
      setInlineEditMode(false);
      setHoveredSectionIndex(null);
    },
  });

  // Override save to include pending header and footer navigation updates
  const save = useCallback(async () => {
    const { navigationApi } = await import('@/lib/api');

    // Save header navigation if there are pending changes
    if (pendingHeaderNavigation) {
      // Step 1: Create navigation if it doesn't exist
      let navigationId: string;
      if (pendingHeaderNavigation.navigationId) {
        navigationId = pendingHeaderNavigation.navigationId;
      } else {
        // Create new navigation
        const navigationData: Omit<Navigation, 'id' | 'date_created' | 'date_updated' | 'user_created' | 'user_updated' | 'items'> = {
          type: 'header',
          site: pendingHeaderNavigation.siteId,
          status: 'published'
        };

        const createResult = await navigationApi.createNavigation(navigationData);
        if (!createResult.success) {
          toast.error('Failed to create header navigation');
          return;
        }
        const createdData = createResult.data;
        if (typeof createdData === 'string') {
          navigationId = createdData;
        } else if (createdData && typeof createdData === 'object' && 'id' in createdData) {
          navigationId = createdData.id as string;
        } else {
          throw new Error('Failed to get navigation ID from creation response');
        }
      }

      // Step 2: Update navigation with items
      if (pendingHeaderNavigation.payload.items && Object.keys(pendingHeaderNavigation.payload.items).length > 0) {
        const result = await navigationApi.updateNavigation(navigationId, pendingHeaderNavigation.payload as Record<string, unknown>);
        if (!result.success) {
          toast.error('Failed to save header navigation');
          return;
        }
      }
    }

    // Save footer navigation if there are pending changes
    if (pendingFooterNavigation) {
      // Step 1: Create navigation if it doesn't exist
      let navigationId: string;
      if (pendingFooterNavigation.navigationId) {
        navigationId = pendingFooterNavigation.navigationId;
      } else {
        // Create new navigation
        const navigationData: Omit<Navigation, 'id' | 'date_created' | 'date_updated' | 'user_created' | 'user_updated' | 'items'> = {
          type: 'footer',
          site: pendingFooterNavigation.siteId,
          status: 'published'
        };

        const createResult = await navigationApi.createNavigation(navigationData);
        if (!createResult.success) {
          toast.error('Failed to create footer navigation');
          return;
        }
        const createdData = createResult.data;
        if (typeof createdData === 'string') {
          navigationId = createdData;
        } else if (createdData && typeof createdData === 'object' && 'id' in createdData) {
          navigationId = createdData.id as string;
        } else {
          throw new Error('Failed to get navigation ID from creation response');
        }
      }

      // Step 2: Update navigation with items
      if (pendingFooterNavigation.payload.items && Object.keys(pendingFooterNavigation.payload.items).length > 0) {
        const result = await navigationApi.updateNavigation(navigationId, pendingFooterNavigation.payload as Record<string, unknown>);
        if (!result.success) {
          toast.error('Failed to save footer navigation');
          return;
        }
      }
    }

    // Then save page blocks and other data
    await baseSave();
  }, [pendingHeaderNavigation, pendingFooterNavigation, baseSave]);

  // Keyboard shortcuts
  const handleCloseModals = useCallback(() => {
    setShowBlockSelector(false);
    setShowBlockEditor(false);
  }, []);

  usePageBuilderKeyboard({
    onSave: save,
    onCloseModals: handleCloseModals,
    blocks,
    headerItems,
    footerItems,
  });

  // Unsaved changes tracking (disable Save when no payload)
  usePageBuilderUnsavedChanges({
    getPayload,
    pendingHeaderNavigation,
    pendingFooterNavigation,
    watchedDeps: [blocks, stagedTranslations],
    isSaving,
    onUnsavedChange: setHasUnsavedChanges,
  });


  // Select block type
  const handleBlockTypeSelected = (blockType: string) => {
    const pageData = page as Page | undefined;
    const siteData = pageData?.site as Site | undefined;
    console.log('[handleBlockTypeSelected] Creating new block:', {
      blockType,
      event_id: siteData?.event_id,
      tenant_id: siteData?.tenant_id,
      ctxEventId: ctxEventId,
      ctxTenantId: ctxTenantId,
      selectedTenant: selectedTenant?.id,
      site: siteData
    });

    const newBlock: Block = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collection: blockType,
      sort: selectedBlockIndex ?? blocks.length,
      item: {
        // Tự động thêm event_id và tenant_id
        event_id: siteData?.event_id || ctxEventId || Number(eventId),
        tenant_id: siteData?.tenant_id || ctxTenantId || (selectedTenant as Tenant | null)?.id,
        translations: [
          { languages_code: 'en-US' as DirectusLanguageCode },
          { languages_code: 'vi-VN' as DirectusLanguageCode },
        ],
      },
    };

    console.log('[handleBlockTypeSelected] New block created:', newBlock);

    setEditingBlock(newBlock);
    setShowBlockSelector(false);
    setShowBlockEditor(true);
  };

  // Save block data
  const handleBlockSaved = useCallback((blockData: Block['item'] | Record<string, unknown>) => {
    if (!editingBlock) {
      console.error('[handleBlockSaved] No editingBlock!');
      return;
    }

    const blockId = String(editingBlock.id);
    const isTemp = blockId.startsWith('temp-');

    console.log('[handleBlockSaved] ===== SAVE BLOCK DEBUG =====');
    console.log('[handleBlockSaved] Block ID:', blockId);
    console.log('[handleBlockSaved] Is temp?', isTemp);
    console.log('[handleBlockSaved] Editing block:', editingBlock);
    console.log('[handleBlockSaved] Block data to save:', blockData);
    console.log('[handleBlockSaved] ==============================');

    const updatedBlock: Block = {
      ...editingBlock,
      id: blockId,
      item: blockData,
    };

    // Determine if this block already exists in the current list
    const existingIndex = blocks.findIndex(b => String(b.id) === blockId);

    if (existingIndex >= 0) {
      // Always replace when we are editing an existing block in the list
      console.log('[handleBlockSaved] Replacing EXISTING block at index:', existingIndex);
      replaceBlock(blockId, updatedBlock);
    } else {
      // Only insert as NEW when it doesn't exist in the list (true Add Section flow)
      const insertIndex = selectedBlockIndex ?? blocks.length;
      console.log('[handleBlockSaved] Inserting NEW block at index:', insertIndex);
      insertBlockAt(updatedBlock, insertIndex);
    }

    // Clean up state
    setShowBlockEditor(false);
    setEditingBlock(null);
    setSelectedBlockIndex(null);
  }, [editingBlock, selectedBlockIndex, blocks, insertBlockAt, replaceBlock]);

  // Edit block
  const handleEditBlock = (index: number) => {
    console.log('[handleEditBlock] ===== EDIT BLOCK =====');
    console.log('[handleEditBlock] Opening editor for block at index:', index);
    console.log('[handleEditBlock] Block:', blocks[index]);
    console.log('[handleEditBlock] Block ID:', blocks[index].id);
    console.log('[handleEditBlock] Is temp?', String(blocks[index].id).startsWith('temp-'));
    console.log('[handleEditBlock] Current selectedBlockIndex before clear:', selectedBlockIndex);
    console.log('[handleEditBlock] ========================');

    setSelectedBlockIndex(null); // Clear insert position
    setEditingBlock(blocks[index]);
    setShowBlockEditor(true);
  };

  // Delete block
  const handleDeleteBlock = useCallback((index: number) => {
    const blockToDelete = blocks[index];
    if (blockToDelete) {
      // Track block removal in PagePayloadManager
      removeBlock(String(blockToDelete.id));
    }
    deleteBlock(index);
  }, [deleteBlock, blocks, removeBlock]);

  // Move block
  const handleMoveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    moveBlock(index, direction);
  }, [moveBlock]);


  // Save page
  const handleSave = useCallback(async () => {
    await save();
  }, [save]);

  // Header Callbacks
  const handleToggleEditMode = useCallback(() => {
    setInlineEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }

    setInlineEditMode(false);
    setHoveredSectionIndex(null);
    // Clear payload and pending changes when canceling
    resetPayload();
    setPendingHeaderNavigation(null);
    setPendingFooterNavigation(null);
    setStagedTranslations([]);
    setTempMetadata({ 'en-US': {}, 'vi-VN': {} }); // Clear temporary metadata
    setHasUnsavedChanges(false);
    setShowThemeSidebar(false);
    setPreviewTheme(null);
    // Refetch page to restore original state
    refetchPage();
  }, [resetPayload, refetchPage, hasUnsavedChanges]);

  // Warn on browser refresh/close if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleEditMetadata = useCallback(() => {
    setMetadataDialogLang(previewLang);
    setShowMetadataDialog(true);
  }, [previewLang]);

  // Theme Handlers
  const handleThemePreview = (theme: any) => {
    setPreviewTheme(theme);
  };

  const handleThemeSave = async (theme: any) => {
    const { globalApi } = await import('@/lib/api');
    if (!siteId) return;

    // Save theme to global settings
    const globalRes = await globalApi.getGlobal(Number(siteId));

    if (globalRes.success && globalRes.data && typeof globalRes.data === 'object' && 'id' in globalRes.data) {
      await globalApi.updateGlobal(String(globalRes.data.id), { theme });
    } else {
      await globalApi.createGlobal({ site_id: Number(siteId), theme });
    }

    // setPreviewTheme(null); // Keep the preview active so UI doesn't revert to old theme during refetch
    refetchPage(); // Refresh to get persisted theme
  };

  const handleViewPublic = useCallback(() => {
    const siteData = site as Site | undefined;
    const pageData = page as Page | undefined;

    if (!siteData) {
      toast.error('Site data not found');
      return;
    }

    // Determine base URL
    let baseUrl = '';
    if (siteData.slug) {
      baseUrl = `https://nxp-public-ruby.vercel.app/${siteData.slug}`;
    } else if (siteData.domain) {
      baseUrl = `https://${siteData.domain}`;
    } else {
      toast.error('Site has no domain or slug configured');
      return;
    }

    // Determine language code (en/vi)
    const langCode = previewLang === 'en-US' ? 'en' : 'vi';

    // Get permalink
    // Use temporary metadata if available
    let permalink = tempMetadata[previewLang]?.permalink;

    // If not in temp metadata, try to get from translations
    if (permalink === undefined || permalink === null) {
      const translation = pageData?.translations?.find(
        (t) => extractLanguageCode(t.languages_code) === previewLang
      );
      permalink = translation?.permalink;
    }

    // Fallback to empty string if undefined
    permalink = permalink || '';

    // Ensure permalink starts with / if not empty
    const safePermalink = permalink.startsWith('/') ? permalink : `/${permalink}`;

    // Construct final URL
    const url = `${baseUrl}/${langCode}${safePermalink}`;
    window.open(url, '_blank');
  }, [site, page, previewLang, tempMetadata]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-content-secondary">Loading page builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-lg relative overflow-hidden bg-[#fbfbfb]">
      {/* Top Bar - Separate Component */}
      <PageBuilderHeader
        isInlineEditMode={inlineEditMode}
        onToggleEditMode={handleToggleEditMode}
        onCancelEdit={handleCancelEdit}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        pageTitle={currentPageTitle}
        pagePermalink={currentPagePermalink}
        onEditMetadata={handleEditMetadata}
        previewDevice={previewDevice}
        onPreviewDeviceChange={setPreviewDevice}
        previewLang={previewLang}
        onPreviewLangChange={setPreviewLang}
        previewScale={previewScale}
        onPreviewScaleChange={setPreviewScale}
        siteId={siteId as number | undefined}
        onViewPublic={handleViewPublic}
        onToggleThemeSidebar={() => setShowThemeSidebar(prev => !prev)}
      />

      {/* Main Content - Split View */}
      <div className="flex-1 flex w-full overflow-hidden bg-[#fbfbfb]">


        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-[#f8f9fa] overflow-hidden flex flex-col">

          {/* Preview content với device constraints */}
          <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
            <div
              style={{
                width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                margin: '0 auto',
                // Use zoom for layout-correct scaling
                // @ts-ignore - zoom is non-standard but widely supported
                zoom: previewScale,
                transition: 'width 0.2s ease-out',
              }}
            >
              <div className="w-full bg-white rounded-lg shadow-lg" style={{ overflow: 'visible' }}>
                {isLoadingBlocks ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <LoadingSpinner size="lg" className="mb-4" />
                        <p className="text-content-tertiary text-sm">Loading blocks...</p>
                      </div>
                    </div>
                    <BlockSkeleton type="hero" />
                    <BlockSkeleton type="columns" />
                  </div>
                ) : (
                  <PagePreview
                    blocks={blocks}
                    lang={previewLang}
                    siteId={siteId || undefined}
                    siteLogo={(site as Site | undefined)?.logo || undefined}
                    isEditMode={inlineEditMode}
                    onSectionClick={(index) => handleEditBlock(index)}
                    onInsertAbove={(index) => {
                      setSelectedBlockIndex(index);
                      setShowBlockSelector(true);
                    }}
                    onInsertBelow={(index) => {
                      setSelectedBlockIndex(index + 1);
                      setShowBlockSelector(true);
                    }}
                    onDeleteSection={(index) => handleDeleteBlock(index)}
                    onMoveSection={(index, direction) => handleMoveBlock(index, direction)}
                    onReorderSection={(oldIndex, newIndex) => reorderBlocks(oldIndex, newIndex)}
                    onEditHeader={() => {
                      setShowHeaderDialog(true);
                    }}
                    onEditFooter={() => {
                      setShowFooterDialog(true);
                    }}
                    hoveredSectionIndex={hoveredSectionIndex}
                    onSectionHover={(index) => {
                      if (typeof index === 'number' || index === 'header' || index === 'footer') {
                        setHoveredSectionIndex(index);
                      }
                    }}
                    headerNavigation={headerNavigationPreview}
                    footerNavigation={footerNavigationPreview}
                    onAddFirstBlock={() => {
                      setSelectedBlockIndex(0);
                      setShowBlockSelector(true);
                    }}
                    previewTheme={previewTheme}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Theme Sidebar */}
        <AnimatePresence>
          {showThemeSidebar && (
            <ThemeSelector
              onPreview={handleThemePreview}
              onSave={handleThemeSave}
              onClose={() => setShowThemeSidebar(false)}
              currentTheme={previewTheme || savedTheme}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Block Selector Modal */}
      <BlockSelectorModal
        isOpen={showBlockSelector}
        onClose={() => {
          setShowBlockSelector(false);
          setSelectedBlockIndex(null);
        }}
        onSelectBlock={handleBlockTypeSelected}
      />

      {/* Block Editor Modal */}
      <BlockEditorModal
        isOpen={showBlockEditor}
        onClose={() => {
          setShowBlockEditor(false);
          setEditingBlock(null);
          setSelectedBlockIndex(null);
        }}
        block={editingBlock}
        onSave={handleBlockSaved}
        activeLang={previewLang}
        folderId={folderId}
        eventId={uploadEventId}
      />

      {/* Header Navigation Dialog */}
      <HeaderNavigationBlockEditor
        isOpen={showHeaderDialog}
        onClose={() => setShowHeaderDialog(false)}
        siteId={siteId as number}
        headerNavigation={headerNavigationPreview}
        activeLang={previewLang}
        onSaveChanges={(items, preparedData) => {
          // Store changes locally only if there are actual diffs
          const hasNavChanges = !!preparedData?.payload?.items && Object.keys(preparedData.payload.items).length > 0;
          setHeaderItems(items);
          if (hasNavChanges) {
            setPendingHeaderNavigation(preparedData!);
            setHasUnsavedChanges(true);
          }
        }}
      />

      {/* Footer Navigation Dialog */}
      <FooterNavigationBlockEditor
        isOpen={showFooterDialog}
        onClose={() => setShowFooterDialog(false)}
        siteId={siteId as number}
        footerNavigation={footerNavigationPreview}
        activeLang={previewLang}
        onSaveChanges={(items, preparedData) => {
          // Store changes locally only if there are actual diffs
          const hasNavChanges = !!preparedData?.payload?.items && Object.keys(preparedData.payload.items).length > 0;
          setFooterItems(items);
          if (hasNavChanges) {
            setPendingFooterNavigation(preparedData!);
            setHasUnsavedChanges(true);
          }
        }}
      />

      <PageMetadataDialog
        isOpen={showMetadataDialog}
        onClose={() => setShowMetadataDialog(false)}
        pageId={pageId}
        page={page as Page | null}
        defaultLanguage={metadataDialogLang}
        tempMetadata={tempMetadata}
        onApply={(entry) => {
          // Stage page translation changes into the payload manager
          console.log('[PageBuilder] Staging translation:', entry);
          stagePageTranslation(entry.languages_code, {
            title: entry.title,
            permalink: entry.permalink,
            id: entry.id,
            isSessionOnly: entry.isSessionOnly,
          });

          // Update temporary metadata for immediate preview
          setTempMetadata((prev) => ({
            ...prev,
            [entry.languages_code]: {
              title: entry.title,
              permalink: entry.permalink,
            },
          }));

          setHasUnsavedChanges(true);
        }}
      />
    </div>
  );
}

type NavigationItemInput = Partial<DirectusNavigationItem> & {
  page?: string | { id: string } | Page | null;
  children?: NavigationItemInput[];
  translations?: Array<
    Partial<NavigationItemTranslation> & {
      languages_code?: string | { code: string };
      title?: string | null;
    }
  >;
};

function normalizeNavigationItems(items: NavigationItemInput[]): DirectusNavigationItem[] {
  return items.map((item, index) => {
    const fallbackId = `temp-nav-${index}-${Math.random().toString(36).slice(2, 8)}`;
    const itemId = typeof item.id === 'string' && item.id.length > 0 ? item.id : fallbackId;

    const children = item.children ? normalizeNavigationItems(item.children) : undefined;

    const translations = (item.translations ?? []).map((translation, translationIndex) => {
      const langCode =
        typeof translation.languages_code === 'string'
          ? translation.languages_code
          : translation.languages_code && typeof translation.languages_code === 'object' && 'code' in translation.languages_code
            ? (translation.languages_code as { code: string }).code
            : 'en-US';

      const translationId =
        typeof translation.id === 'number' ? translation.id : -1 * (translationIndex + 1);

      return {
        id: translationId,
        navigation_items_id: translation.navigation_items_id ?? itemId,
        languages_code: langCode,
        title: translation.title ?? '',
      };
    }) as NavigationItemTranslation[];

    let pageValue: string | null = null;
    if ((item.type as 'page' | 'url' | undefined) === 'page') {
      if (typeof item.page === 'string') {
        pageValue = item.page;
      } else if (item.page && typeof item.page === 'object' && 'id' in item.page) {
        pageValue = (item.page as { id: string }).id;
      } else if (item.page === null) {
        pageValue = null;
      }
    }

    return {
      id: itemId,
      navigation: item.navigation ?? null,
      sort: typeof item.sort === 'number' ? item.sort : index,
      type: (item.type as 'page' | 'url') ?? 'page',
      url: (item.type as 'page' | 'url') === 'url' ? (item.url ?? null) : null,
      page: pageValue,
      open_in_new_tab: (item.type as 'page' | 'url') === 'url' ? (item.open_in_new_tab ?? false) : false,
      has_children: item.has_children ?? (!!children && children.length > 0),
      parent: item.parent ?? null,
      icon: item.icon ?? null,
      label: item.label ?? null,
      translations,
      children,
      parent_item: null,
      page_item:
        item.page && typeof item.page === 'object' && 'id' in item.page ? (item.page as Page) : null,
      date_created: item.date_created ?? null,
      date_updated: item.date_updated ?? null,
      user_created: item.user_created ?? null,
      user_updated: item.user_updated ?? null,
    };
  });
}

// Helper functions
