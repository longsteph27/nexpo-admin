'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/pagebuilder.css';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { toast } from 'sonner';
import { 
  usePageBuilderBlocks, 
  usePageBuilderNavigation, 
  usePageBuilderKeyboard, 
  usePageBuilderUnsavedChanges, 
  usePageBuilderSave,
  usePageData,
  usePageNavigations,
  usePageSiteNavigation,
  usePageSite
} from '@/features/pages/hooks/usePages';
import { useQueryClient } from '@tanstack/react-query';
import type { Block, Page, PageTranslation, LanguageCode } from '@/features/pages/types';
import { extractLanguageCode } from '@/types/directus-collections';
import BlockSelectorModal from './BlockSelectorModal';
import BlockEditorModal from './BlockEditorModal';
import PagePreview from './PagePreview';
import NavigationEditor from './NavigationEditor';
import HeaderNavigationDialog from './HeaderNavigationDialog';
import FooterNavigationDialog from './FooterNavigationDialog';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BlockSkeleton from '@/components/ui/BlockSkeleton';

interface PageBuilderProps {
  eventId: string;
  pageId: string;
}

export default function PageBuilder({ eventId, pageId }: PageBuilderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedTenant } = useAuth();
  
  // Get folder and event ID for uploads
  const folderId = (selectedTenant as any)?.folder_files_id || undefined;
  const uploadEventId = eventId || undefined;

  // UI State
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [previewLang, setPreviewLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [showNavEditor, setShowNavEditor] = useState(false);
  const [showHeaderDialog, setShowHeaderDialog] = useState(false);
  const [showFooterDialog, setShowFooterDialog] = useState(false);
  const [pendingHeaderNavigation, setPendingHeaderNavigation] = useState<{ navigationId: string | null; siteId: number; headerNavigation: any; payload: any } | null>(null);
  const [pendingFooterNavigation, setPendingFooterNavigation] = useState<{ navigationId: string | null; siteId: number; footerNavigation: any; payload: any } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState<number | 'header' | 'footer' | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isEditingPermalink, setIsEditingPermalink] = useState(false);
  const [editedPermalinks, setEditedPermalinks] = useState<Record<string, string>>({});

  // Fetch page data
  const { data: page, isLoading } = usePageData(pageId);

  // Get siteId from page data
  const siteId = (page as any)?.site_id || (page as any)?.site?.id;

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

  // Custom hooks
  const {
    blocks,
    isLoadingBlocks,
    updateBlock,
    replaceBlock,
    deleteBlock,
    moveBlock,
    insertBlockAt,
  } = usePageBuilderBlocks({ pageBlocks: (page as any)?.blocks });

  const {
    headerItems,
    footerItems,
    setHeaderItems,
    setFooterItems,
  } = usePageBuilderNavigation({ navigations });

  const { save: baseSave, isSaving } = usePageBuilderSave({
    pageId,
    page: page as any,
    blocks,
    headerItems,
    footerItems,
    navigations: navigations as any,
    eventId,
    selectedTenant,
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setPendingHeaderNavigation(null);
      setPendingFooterNavigation(null);
    },
  });

  // Validate and format permalink
  const formatPermalink = useCallback((permalink: string): string => {
    // Remove leading/trailing slashes, convert to lowercase, replace spaces with hyphens
    return permalink
      .trim()
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9\-_/]/g, '') // Remove invalid characters, keep hyphens, underscores, slashes
      .replace(/\/+/g, '/') // Replace multiple slashes with single
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }, []);

  const validatePermalink = useCallback((permalink: string): boolean => {
    if (!permalink || permalink.trim() === '') {
      return false;
    }
    // Check if starts with slash
    if (!permalink.startsWith('/')) {
      return false;
    }
    // Check for invalid characters after formatting
    const formatted = formatPermalink(permalink);
    return formatted.length > 0 && /^[a-z0-9\-_/]+$/.test(formatted);
  }, [formatPermalink]);

  // Override save to include pending header and footer navigation and permalink
  const save = useCallback(async () => {
    const { navigationApi, siteApi } = await import('@/lib/api');
    
    // Save permalink if there are pending changes
    if (Object.keys(editedPermalinks).length > 0) {
      console.log('[PageBuilder] Starting permalink save, editedPermalinks:', editedPermalinks);
      
      const pageTranslations = (page as any)?.translations || [];
      console.log('[PageBuilder] Page translations:', pageTranslations);
      
      const translationsPayload: any = {
        create: [] as any[],
        update: [] as any[],
      };

      let hasInvalidPermalink = false;
      
      pageTranslations.forEach((trans: any) => {
        const langCode = trans.languages_code?.code || trans.languages_code;
        console.log('[PageBuilder] Processing translation:', { trans, langCode, editedPermalinks: editedPermalinks[langCode] });
        
        if (editedPermalinks[langCode]) {
          const formattedPermalink = formatPermalink(editedPermalinks[langCode]);
          
          if (!validatePermalink(`/${formattedPermalink}`)) {
            toast.error(`Invalid permalink format for ${langCode}`);
            hasInvalidPermalink = true;
            return;
          }

          if (trans.id) {
            // Update existing translation
            const updateItem = {
              id: trans.id,
              permalink: `/${formattedPermalink}`,
            };
            console.log('[PageBuilder] Adding to update:', updateItem);
            translationsPayload.update.push(updateItem);
          } else {
            // Create new translation (shouldn't happen normally)
            const createItem = {
              languages_code: { code: langCode },
              permalink: `/${formattedPermalink}`,
            };
            console.log('[PageBuilder] Adding to create:', createItem);
            translationsPayload.create.push(createItem);
          }
        }
      });

      // Add new translations if any
      Object.keys(editedPermalinks).forEach((langCode) => {
        const existingTrans = pageTranslations.find(
          (t: any) => (t.languages_code?.code || t.languages_code) === langCode
        );
        if (!existingTrans) {
          const formattedPermalink = formatPermalink(editedPermalinks[langCode]);
          if (validatePermalink(`/${formattedPermalink}`)) {
            translationsPayload.create.push({
              languages_code: { code: langCode },
              permalink: `/${formattedPermalink}`,
            });
          } else {
            toast.error(`Invalid permalink format for ${langCode}`);
            hasInvalidPermalink = true;
          }
        }
      });
      
      if (hasInvalidPermalink) {
        return;
      }

      if (translationsPayload.update.length > 0 || translationsPayload.create.length > 0) {
        console.log('[PageBuilder] Saving permalink with payload:', {
          pageId,
          translationsPayload,
          editedPermalinks,
        });
        
        const result = await siteApi.updatePage(pageId, {
          translations: translationsPayload,
        });
        
        console.log('[PageBuilder] Save permalink result:', result);
        
        if (!result.success) {
          console.error('[PageBuilder] Failed to save permalink:', result.error);
          toast.error(`Failed to save permalink: ${result.error || 'Unknown error'}`);
          return;
        }
        
        toast.success('Permalink saved successfully!');
        // Invalidate page query to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['page-detail', pageId] });
      }
    }
    
    // Save header navigation if there are pending changes
    if (pendingHeaderNavigation) {
      // Step 1: Create navigation if it doesn't exist
      let navigationId: string;
      if (pendingHeaderNavigation.navigationId) {
        navigationId = pendingHeaderNavigation.navigationId;
      } else {
        // Create new navigation
        const navigationData: any = {
          type: 'header',
          site: pendingHeaderNavigation.siteId,
          status: 'published'
        };

        const createResult = await navigationApi.createNavigation(navigationData);
        if (!createResult.success) {
          toast.error('Failed to create header navigation');
          return;
        }
        const createdData = createResult.data as any;
        navigationId = typeof createdData === 'string' ? createdData : (createdData?.id || createdData);
      }
      
      // Step 2: Update navigation with items
      if (pendingHeaderNavigation.payload.items && Object.keys(pendingHeaderNavigation.payload.items).length > 0) {
        const result = await navigationApi.updateNavigation(navigationId, pendingHeaderNavigation.payload);
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
        const navigationData: any = {
          type: 'footer',
          site: pendingFooterNavigation.siteId,
          status: 'published'
        };

        const createResult = await navigationApi.createNavigation(navigationData);
        if (!createResult.success) {
          toast.error('Failed to create footer navigation');
          return;
        }
        const createdData = createResult.data as any;
        navigationId = typeof createdData === 'string' ? createdData : (createdData?.id || createdData);
      }
      
      // Step 2: Update navigation with items
      if (pendingFooterNavigation.payload.items && Object.keys(pendingFooterNavigation.payload.items).length > 0) {
        const result = await navigationApi.updateNavigation(navigationId, pendingFooterNavigation.payload);
        if (!result.success) {
          toast.error('Failed to save footer navigation');
          return;
        }
      }
    }

    // Then save page blocks and other data
    await baseSave();
    
    // Clear edited permalinks after successful save
    setEditedPermalinks({});
    setIsEditingPermalink(false);
  }, [pendingHeaderNavigation, pendingFooterNavigation, editedPermalinks, page, pageId, formatPermalink, validatePermalink, baseSave, queryClient]);

  // Keyboard shortcuts
  const handleCloseModals = useCallback(() => {
        setShowBlockSelector(false);
        setShowBlockEditor(false);
        setShowNavEditor(false);
  }, []);

  usePageBuilderKeyboard({
    onSave: save,
    onCloseModals: handleCloseModals,
    blocks,
    headerItems,
    footerItems,
  });

  // Unsaved changes tracking
  usePageBuilderUnsavedChanges({
    blocks,
    headerItems,
    footerItems,
    hasUnsavedChanges,
    isSaving,
    onUnsavedChange: setHasUnsavedChanges,
  });

  // Add new section
  const handleAddSection = () => {
    setSelectedBlockIndex(blocks.length);
    setShowBlockSelector(true);
  };

  // Insert section at specific position
  const handleInsertSection = (index: number) => {
    setSelectedBlockIndex(index);
    setShowBlockSelector(true);
  };

  // Select block type
  const handleBlockTypeSelected = (blockType: string) => {
    const pageData = page as any;
    console.log('[handleBlockTypeSelected] Creating new block:', {
      blockType,
      event_id: pageData?.site?.event_id,
      tenant_id: pageData?.site?.tenant_id,
      selectedTenant: selectedTenant?.id,
      site: pageData?.site
    });

    const newBlock: Block = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collection: blockType,
      sort: selectedBlockIndex ?? blocks.length,
      item: {
        // Tự động thêm event_id và tenant_id
        event_id: (page as any)?.site?.event_id || Number(eventId),
        tenant_id: (page as any)?.site?.tenant_id || selectedTenant?.id,
        translations: [
          { languages_code: 'en-US' },
          { languages_code: 'vi-VN' },
        ],
      },
    };
    
    console.log('[handleBlockTypeSelected] New block created:', newBlock);
    
    setEditingBlock(newBlock);
    setShowBlockSelector(false);
    setShowBlockEditor(true);
  };

  // Save block data
  const handleBlockSaved = useCallback((blockData: any) => {
    if (!editingBlock) {
      console.error('[handleBlockSaved] No editingBlock!');
      return;
    }
    
    const blockId = String(editingBlock.id);
    const isTemp = blockId.startsWith('temp-');
    
    const updatedBlock: Block = {
      ...editingBlock,
      id: blockId,
      item: blockData,
    };

    if (isTemp) {
      // New block - insert at position
      const insertIndex = selectedBlockIndex ?? blocks.length;
      insertBlockAt(updatedBlock, insertIndex);
    } else {
      // Update existing block
      replaceBlock(blockId, updatedBlock);
    }
    
    // Clean up state
    setShowBlockEditor(false);
    setEditingBlock(null);
    setSelectedBlockIndex(null);
  }, [editingBlock, selectedBlockIndex, blocks, insertBlockAt, replaceBlock]);

  // Edit block
  const handleEditBlock = (index: number) => {
    console.log('[handleEditBlock] Opening editor for block at index:', index);
    console.log('[handleEditBlock] Block ID:', blocks[index].id);
    console.log('[handleEditBlock] Clearing selectedBlockIndex');
    setSelectedBlockIndex(null); // Clear insert position
    setEditingBlock(blocks[index]);
    setShowBlockEditor(true);
  };

  // Delete block
  const handleDeleteBlock = useCallback((index: number) => {
    deleteBlock(index);
  }, [deleteBlock]);

  // Move block
  const handleMoveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    moveBlock(index, direction);
  }, [moveBlock]);


  // Save page
  const handleSave = useCallback(async () => {
    await save();
  }, [save]);

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
    <div className="h-full flex flex-col relative">
      {/* Top Bar - SquareSpace style */}
      <div className="bg-white px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
        {/* Left Section - Edit/Cancel/Save buttons */}
        <div className="flex items-center space-x-3">
          {!inlineEditMode ? (
            <>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (siteId) {
                router.push(`/events/${eventId}/sites/${siteId}`);
              } else {
                router.push(`/events/${eventId}/pages`);
              }
            }}
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </Button> */}
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setInlineEditMode(true)}
                className="text-white"
              >
                <Icon icon="lucide:edit-3" className="w-4 h-4 mr-2" />
                Edit
          </Button>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInlineEditMode(false);
                  setHoveredSectionIndex(null);
                  // Reset permalink editing state when canceling edit mode
                  setIsEditingPermalink(false);
                  if (Object.keys(editedPermalinks).length > 0) {
                    // If there are unsaved permalink changes, clear them
                    setEditedPermalinks({});
                  }
                }}
              >
                <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-white"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Center Section - Permalink */}
        <div className="flex-1 flex justify-center">
          <div className="bg-neutral-100 rounded-lg px-4 py-2 flex items-center space-x-2 max-w-md group">
            <Icon icon="lucide:link" className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            {isEditingPermalink ? (
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={editedPermalinks[previewLang] || (page as any)?.translations?.find((t: any) => (t.languages_code?.code || t.languages_code) === previewLang)?.permalink?.replace(/^\//, '') || 'untitled-page'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditedPermalinks(prev => ({
                      ...prev,
                      [previewLang]: value,
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  onBlur={() => {
                    // Only exit edit mode if there's a value, otherwise keep it open
                    const currentValue = editedPermalinks[previewLang] || (page as any)?.translations?.find((t: any) => (t.languages_code?.code || t.languages_code) === previewLang)?.permalink?.replace(/^\//, '') || 'untitled-page';
                    if (currentValue.trim() !== '') {
                      setIsEditingPermalink(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setEditedPermalinks(prev => {
                        const newPermalinks = { ...prev };
                        delete newPermalinks[previewLang];
                        return newPermalinks;
                      });
                      setIsEditingPermalink(false);
                    }
                  }}
                  className="text-sm text-neutral-700 font-medium bg-white border border-neutral-300 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditedPermalinks(prev => {
                      const newPermalinks = { ...prev };
                      delete newPermalinks[previewLang];
                      return newPermalinks;
                    });
                    setIsEditingPermalink(false);
                  }}
                  className="p-1 hover:bg-neutral-200 rounded flex-shrink-0"
                  title="Cancel"
                >
                  <Icon icon="lucide:x" className="w-3 h-3 text-neutral-500" />
                </Button>
              </div>
            ) : (
              <>
                <span 
                  className={`text-sm text-neutral-700 font-medium flex-1 min-w-0 truncate ${
                    inlineEditMode ? 'cursor-text hover:text-neutral-900' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (inlineEditMode) {
                      setIsEditingPermalink(true);
                    }
                  }}
                  title={inlineEditMode ? "Click to edit permalink" : "Enter edit mode to edit permalink"}
                >
                  {(editedPermalinks[previewLang] !== undefined 
                    ? `/${editedPermalinks[previewLang]}` 
                    : (page as any)?.translations?.find((t: any) => (t.languages_code?.code || t.languages_code) === previewLang)?.permalink) || '/untitled-page'}
                </span>
                {inlineEditMode && (
                  <button
                    onClick={() => {
                      setIsEditingPermalink(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 rounded flex-shrink-0"
                    title="Edit permalink"
                  >
                    <Icon icon="lucide:edit-2" className="w-3 h-3 text-neutral-500" />
                  </button>
                )}
                <button
                  onClick={() => {
                    const permalink = (editedPermalinks[previewLang] !== undefined 
                      ? `/${editedPermalinks[previewLang]}` 
                      : (page as any)?.translations?.find((t: any) => (t.languages_code?.code || t.languages_code) === previewLang)?.permalink) || '/untitled-page';
                    navigator.clipboard.writeText(permalink);
                    toast.success('Permalink copied to clipboard');
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 rounded flex-shrink-0"
                  title="Copy permalink"
                >
                  <Icon icon="lucide:copy" className="w-3 h-3 text-neutral-500" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
              {/* Preview Device Buttons */}
              <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Desktop"
                >
                  <Icon icon="lucide:monitor" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-2 rounded transition-colors ${
                    previewDevice === 'tablet'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Tablet"
                >
                  <Icon icon="lucide:tablet" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Mobile"
                >
                  <Icon icon="lucide:smartphone" className="w-4 h-4" />
                </button>
              </div>

          <div className="h-6 w-px bg-neutral-200" />

          {/* Language Switcher */}
          <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                previewLang === 'en-US'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setPreviewLang('en-US')}
            >
              EN
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                previewLang === 'vi-VN'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setPreviewLang('vi-VN')}
            >
              VI
            </button>
          </div>
            </div>

      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex w-full overflow-hidden bg-[#fbfbfb]">
        {/* Left Panel - Sections List or Navigation Editor */}
        

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-neutral-100 overflow-hidden flex flex-col">
          

          {/* Preview content với device constraints */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              maxWidth: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
              margin: previewDevice !== 'desktop' ? '0 auto' : '0',
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
                  siteLogo={(site as any)?.logo}
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
                  headerNavigation={siteNavigation?.header}
                  footerNavigation={siteNavigation?.footer}
                />
              )}
            </div>
          </div>
        </div>
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
      <HeaderNavigationDialog
        isOpen={showHeaderDialog}
        onClose={() => setShowHeaderDialog(false)}
        siteId={siteId as number}
        headerNavigation={siteNavigation?.header}
        activeLang={previewLang}
        onSaveChanges={(items, preparedData) => {
          // Store changes locally - will be saved when user clicks Save in PageBuilder
          setHeaderItems(items);
          if (preparedData) {
            setPendingHeaderNavigation(preparedData);
          }
          setHasUnsavedChanges(true);
        }}
      />

      {/* Footer Navigation Dialog */}
      <FooterNavigationDialog
        isOpen={showFooterDialog}
        onClose={() => setShowFooterDialog(false)}
        siteId={siteId as number}
        footerNavigation={siteNavigation?.footer}
        activeLang={previewLang}
        onSaveChanges={(items, preparedData) => {
          // Store changes locally - will be saved when user clicks Save in PageBuilder
          setFooterItems(items);
          if (preparedData) {
            setPendingFooterNavigation(preparedData);
          }
          setHasUnsavedChanges(true);
        }}
      />
    </div>
  );
}

// Helper functions
function getBlockIcon(collection: string): string {
  const iconMap: Record<string, string> = {
    block_hero: 'lucide:layout-dashboard',
    block_richtext: 'lucide:text',
    block_columns: 'lucide:columns',
    block_gallery: 'lucide:images',
    block_video: 'lucide:video',
    block_quote: 'lucide:quote',
    block_faqs: 'lucide:help-circle',
    block_steps: 'lucide:list-ordered',
    block_cta: 'lucide:arrow-right-circle',
    block_logocloud: 'lucide:cloud',
    block_team: 'lucide:users',
    block_testimonials: 'lucide:message-circle',
    block_form: 'lucide:form-input',
    block_html: 'lucide:code',
    block_divider: 'lucide:minus',
  };
  return iconMap[collection] || 'lucide:box';
}

function getBlockLabel(collection: string): string {
  const labelMap: Record<string, string> = {
    block_hero: 'Hero',
    block_richtext: 'Rich Text',
    block_columns: 'Columns',
    block_gallery: 'Gallery',
    block_video: 'Video',
    block_quote: 'Quote',
    block_faqs: 'FAQs',
    block_steps: 'Steps',
    block_cta: 'Call to Action',
    block_logocloud: 'Logo Cloud',
    block_team: 'Team',
    block_testimonials: 'Testimonials',
    block_form: 'Form',
    block_html: 'HTML',
    block_divider: 'Divider',
  };
  return labelMap[collection] || collection;
}

