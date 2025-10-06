'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import '@/styles/pagebuilder.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { siteApi, navigationApi } from '@/lib/api';
import BlockSelectorModal from '@/components/pagebuilder/BlockSelectorModal';
import BlockEditorModal from '@/components/pagebuilder/BlockEditorModal';
import PagePreview from '@/components/pagebuilder/PagePreview';
import NavigationEditor from '@/components/pagebuilder/NavigationEditor';

interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: any;
}

export default function PageBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = String(params?.id || '');
  const siteId = String(params?.siteId || '');
  const pageId = String(params?.pageId || '');

  // State
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [previewLang, setPreviewLang] = useState<'en-US' | 'vi-VN'>('en-US');
  const [isSaving, setIsSaving] = useState(false);
  const [showNavEditor, setShowNavEditor] = useState(false);
  const [headerItems, setHeaderItems] = useState<any[]>([]);
  const [footerItems, setFooterItems] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch page data
  const { data: page, isLoading } = useQuery({
    queryKey: ['page-detail', pageId],
    queryFn: async () => {
      const result = await siteApi.getPage(pageId);
      return result.data;
    },
    enabled: !!pageId,
  });

  // Fetch site navigation
  const { data: navigations } = useQuery({
    queryKey: ['navigations', siteId],
    queryFn: async () => {
      const result = await navigationApi.getNavigations(Number(siteId));
      return result.data;
    },
    enabled: !!siteId,
  });

  // Load blocks when page data is fetched
  useEffect(() => {
    if (page?.blocks) {
      setBlocks(page.blocks);
    }
  }, [page]);

  // Load navigation items
  useEffect(() => {
    if (navigations && Array.isArray(navigations)) {
      const headerNav = navigations.find((n: any) => n.type === 'header');
      const footerNav = navigations.find((n: any) => n.type === 'footer');
      
      if (headerNav?.items) setHeaderItems(headerNav.items);
      if (footerNav?.items) setFooterItems(footerNav.items);
    }
  }, [navigations]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [blocks, headerItems, footerItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowBlockSelector(false);
        setShowBlockEditor(false);
        setShowNavEditor(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, headerItems, footerItems]);

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
    const newBlock: Block = {
      id: `temp-${Date.now()}`,
      collection: blockType,
      sort: selectedBlockIndex ?? blocks.length,
      item: {},
    };
    setEditingBlock(newBlock);
    setShowBlockSelector(false);
    setShowBlockEditor(true);
  };

  // Save block data
  const handleBlockSaved = (blockData: any) => {
    if (editingBlock) {
      const updatedBlock = {
        ...editingBlock,
        item: blockData,
      };

      if (editingBlock.id.startsWith('temp-')) {
        // New block
        const newBlocks = [...blocks];
        newBlocks.splice(selectedBlockIndex ?? blocks.length, 0, updatedBlock);
        setBlocks(newBlocks.map((b, i) => ({ ...b, sort: i })));
      } else {
        // Update existing block
        setBlocks(blocks.map(b => b.id === editingBlock.id ? updatedBlock : b));
      }
    }
    setShowBlockEditor(false);
    setEditingBlock(null);
  };

  // Edit block
  const handleEditBlock = (index: number) => {
    setEditingBlock(blocks[index]);
    setShowBlockEditor(true);
  };

  // Delete block
  const handleDeleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, sort: i })));
  };

  // Move block
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, sort: i })));
  };

  // Save page
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each block
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        // Create or update block item in its collection
        const blockPayload = {
          ...block.item,
          tenant_id: page?.site?.tenant_id,
          event_id: page?.site?.event_id,
        };

        // Call upsertPageBlock to create both block item and junction entry
        await siteApi.upsertPageBlock({
          pages_id: pageId,
          collection: block.collection,
          item: blockPayload,
          sort: i,
          hide_block: false,
        });
      }

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
      queryClient.invalidateQueries({ queryKey: ['navigations', siteId] });
      
      setHasUnsavedChanges(false);
      alert('Page saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading page builder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Top Bar - SquareSpace style */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/events/${eventId}/sites/${siteId}`)}
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:file-text" className="w-5 h-5 text-neutral-600" />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
                <span>{page?.translations?.[0]?.title || 'Untitled Page'}</span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
                )}
              </h1>
              <p className="text-xs text-neutral-500">
                Page Builder {hasUnsavedChanges && '• Unsaved changes'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Navigation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNavEditor(!showNavEditor)}
          >
            <Icon icon="lucide:navigation" className="w-4 h-4 mr-2" />
            Header & Footer
          </Button>

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

          <div className="h-6 w-px bg-neutral-200" />

          <Button variant="outline" size="sm">
            <Icon icon="lucide:eye" className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
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
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sections List or Navigation Editor */}
        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col overflow-hidden">
          {showNavEditor ? (
            <>
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-neutral-900">Navigation</h2>
                  <button
                    className="p-1 hover:bg-neutral-100 rounded"
                    onClick={() => setShowNavEditor(false)}
                  >
                    <Icon icon="lucide:x" className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-neutral-500">Edit header and footer menus</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <NavigationEditor
                  type="header"
                  items={headerItems}
                  onChange={setHeaderItems}
                  activeLang={previewLang}
                />
                <div className="border-t border-neutral-200 pt-6">
                  <NavigationEditor
                    type="footer"
                    items={footerItems}
                    onChange={setFooterItems}
                    activeLang={previewLang}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sections List */}
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-2">Page Sections</h2>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddSection}
            >
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group bg-neutral-50 border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon
                        icon={getBlockIcon(block.collection)}
                        className="w-4 h-4 text-neutral-600"
                      />
                      <div>
                        <div className="text-xs font-medium text-neutral-900">
                          {getBlockLabel(block.collection)}
                        </div>
                        <div className="text-xs text-neutral-500">Section {index + 1}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 hover:bg-neutral-200 rounded"
                        onClick={() => handleMoveBlock(index, 'up')}
                        disabled={index === 0}
                      >
                        <Icon icon="lucide:chevron-up" className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 hover:bg-neutral-200 rounded"
                        onClick={() => handleMoveBlock(index, 'down')}
                        disabled={index === blocks.length - 1}
                      >
                        <Icon icon="lucide:chevron-down" className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex-1 text-xs px-2 py-1.5 bg-white border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                      onClick={() => handleEditBlock(index)}
                    >
                      <Icon icon="lucide:edit-2" className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      className="text-xs px-2 py-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors"
                      onClick={() => handleDeleteBlock(index)}
                    >
                      <Icon icon="lucide:trash-2" className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Insert section button */}
                  <button
                    className="w-full mt-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                    onClick={() => handleInsertSection(index + 1)}
                  >
                    <Icon icon="lucide:plus" className="w-3 h-3 inline mr-1" />
                    Insert below
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {blocks.length === 0 && (
              <div className="text-center py-12">
                <Icon icon="lucide:layout" className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 mb-4">No sections yet</p>
                <Button size="sm" variant="outline" onClick={handleAddSection}>
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add your first section
                </Button>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-neutral-100 overflow-hidden flex flex-col">
          <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:monitor" className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-900">Live Preview</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-neutral-100 rounded transition-colors">
                <Icon icon="lucide:smartphone" className="w-4 h-4 text-neutral-600" />
              </button>
              <button className="p-2 hover:bg-neutral-100 rounded transition-colors">
                <Icon icon="lucide:tablet" className="w-4 h-4 text-neutral-600" />
              </button>
              <button className="p-2 bg-neutral-100 rounded transition-colors">
                <Icon icon="lucide:monitor" className="w-4 h-4 text-neutral-900" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <PagePreview blocks={blocks} lang={previewLang} />
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
        }}
        block={editingBlock}
        onSave={handleBlockSaved}
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

