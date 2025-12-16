'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useSiteTheme } from '../../hooks/useSiteTheme';
import { themeToCSSVariables, type SiteTheme } from '../../services/siteThemeService';
import { Button } from '@/components/ui/button-base';
import {
  HeroBlock,
  RichTextBlock,
  ColumnsBlock,
  QuoteBlock,
  StepsBlock,
  FaqsBlock,
  CtaBlock,
  VideoBlock,
  GalleryBlock,
  LogoCloudBlock,
  RawHtmlBlock,
  FormBlock,
  HeaderNavigationBlock,
  FooterNavigationBlock,
  DividerBlock,
  TestimonialsBlock,
  TeamBlock,
} from '../blocks/preview';
import ThemeSelector from '@/components/ui/ThemeSelector';
import AddSectionButton from './AddSectionButton';
import clsx from 'clsx';
import type {
  Navigation,
  NavigationItem as DirectusNavigationItem,
  BlockItem,
  LanguageCode,
} from '@/types/directus-collections';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: BlockItem | Record<string, unknown>;
}

interface PagePreviewProps {
  blocks: Block[];
  lang: LanguageCode;
  siteId?: number;
  siteLogo?: string;
  isEditMode?: boolean;
  onSectionClick?: (blockIndex: number) => void;
  onInsertAbove?: (index: number) => void;
  onInsertBelow?: (index: number) => void;
  onDeleteSection?: (index: number) => void;
  onMoveSection?: (index: number, direction: 'up' | 'down') => void;
  onReorderSection?: (oldIndex: number, newIndex: number) => void;
  onEditHeader?: () => void;
  onEditFooter?: () => void;
  hoveredSectionIndex?: number | 'header' | 'footer' | null;
  onSectionHover?: (index: number | 'header' | 'footer' | null) => void;
  headerNavigation?: Navigation & { items?: DirectusNavigationItem[] } | null;
  footerNavigation?: Navigation & { items?: DirectusNavigationItem[] } | null;
  onAddFirstBlock?: () => void;
  previewTheme?: SiteTheme; // Use imported SiteTheme type if possible, or any
}

interface SortableSectionProps {
  block: Block;
  index: number;
  isEditMode: boolean;
  isHovered: boolean;
  showTopButton: boolean;
  showBottomButton: boolean;
  onSectionHover: ((index: number | null) => void) | undefined;
  onSectionClick: ((index: number) => void) | undefined;
  onInsertAbove: ((index: number) => void) | undefined;
  onInsertBelow: ((index: number) => void) | undefined;
  onMoveSection: ((index: number, direction: 'up' | 'down') => void) | undefined;
  onDeleteSection: ((index: number) => void) | undefined;
  renderBlockPreview: (block: Block, lang: string) => React.ReactNode;
  lang: string;
  blocksLength: number;
}

function SortableSection({
  block,
  index,
  isEditMode,
  isHovered,
  showTopButton,
  showBottomButton,
  onSectionHover,
  onSectionClick,
  onInsertAbove,
  onInsertBelow,
  onMoveSection,
  onDeleteSection,
  renderBlockPreview,
  lang,
  blocksLength,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: block.id,
    disabled: !isEditMode,
  });

  const style = {
    // Keep the original item in place (no transform) so it just dims but doesn't move or disappear.
    transform: undefined,
    transition,
    zIndex: isDragging ? 50 : (isHovered ? 40 : 1),
    position: 'relative' as const,
    opacity: isDragging ? 0.4 : 1, // Dim original item while dragging
  };

  return (
    <div ref={setNodeRef} style={style} className="relative" id={`section-${block.id}`}>
      <motion.div
        className={clsx(
          'relative group bg-[#f9fafb]',
          isEditMode && 'cursor-pointer',
          // Border logic
          isEditMode && 'border-2',
          // Default: transparent
          !isHovered && !isOver && isEditMode && 'border-transparent',
          // Hover: Blue
          isHovered && !isDragging && !isOver && isEditMode && 'border-blue-500',
          // Drop Target: Thick Blue or Distinctive
          isOver && !isDragging && 'border-blue-600 ring-2 ring-blue-600 ring-inset'
        )}
        onMouseEnter={() => isEditMode && !isDragging && onSectionHover?.(index)}
        onMouseLeave={() => isEditMode && !isDragging && onSectionHover?.(null)}
        onClick={() => isEditMode && !isDragging && onSectionClick?.(index)}
        animate={{
          borderColor: isOver && !isDragging
            ? 'rgba(37, 99, 235, 1)' // Blue-600
            : (isHovered && isEditMode ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0)'),
        }}
        transition={{ duration: 0, ease: 'easeOut' }}
      >
        {/* Add Section Button - Top */}
        {isEditMode && !isDragging && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-30"
            style={{ top: '-17px' }}
          >
            <AddSectionButton
              isVisible={showTopButton}
              position="top"
              onClick={(e) => {
                e.stopPropagation();
                onInsertAbove?.(index);
              }}
            />
          </div>
        )}

        {/* Add Section Button - Bottom */}
        {isEditMode && !isDragging && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-30"
            style={{ bottom: '-17px' }}
          >
            <AddSectionButton
              isVisible={showBottomButton}
              position="bottom"
              onClick={(e) => {
                e.stopPropagation();
                onInsertBelow?.(index);
              }}
            />
          </div>
        )}

        {/* Section Controls (Edit, Move, Delete, DRAG HANDLE) */}
        {isEditMode && isHovered && !isDragging && (
          <>
            {/* Edit Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md flex items-center space-x-1.5 z-30 pointer-events-auto shadow-lg font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onSectionClick?.(index);
              }}
            >
              <Icon icon="lucide:edit-2" className="w-3.5 h-3.5" />
              <span>Click to edit</span>
            </motion.div>

            {/* Left Side Buttons */}
            <div className="absolute top-3 left-3 flex flex-col items-center space-y-2 z-30 pointer-events-auto">

              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="bg-slate-300 text-white rounded-md p-2 shadow-lg cursor-grab active:cursor-grabbing hover:bg-slate-200 transition-colors"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon="lucide:grip-vertical" className="w-4 h-4" />
              </div>

              {/* Move Up Button */}
              {index > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection?.(index, 'up');
                  }}
                  className="bg-sky-200 hover:bg-sky-300 text-sky-900 rounded-full p-2 shadow-xl transition-colors"
                  title="Move up"
                >
                  <Icon icon="lucide:chevron-up" className="w-4 h-4" />
                </motion.button>
              )}

              {/* Move Down Button */}
              {index < blocksLength - 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSection?.(index, 'down');
                  }}
                  className="bg-slate-500 hover:bg-slate-600 text-white rounded-full p-2 shadow-lg transition-colors"
                  title="Move down"
                >
                  <Icon icon="lucide:chevron-down" className="w-4 h-4" />
                </motion.button>
              )}

              {/* Delete Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection?.(index);
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
                title="Delete section"
              >
                <Icon icon="lucide:trash-2" className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        )}

        {/* Block Content */}
        <div className="relative" style={{ zIndex: 10 }}>
          {renderBlockPreview(block, lang)}
        </div>

        {/* Section Label Overlay - Only show when not in edit mode */}
        {!isEditMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="bg-neutral-900/90 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
              <Icon icon={getBlockIcon(block.collection)} className="w-3 h-3" />
              <span>Section {index + 1}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function PagePreview({
  blocks,
  lang,
  siteId,
  siteLogo,
  isEditMode = false,
  onSectionClick,
  onInsertAbove,
  onInsertBelow,
  onDeleteSection,
  onMoveSection,
  onReorderSection,
  onEditHeader,
  onEditFooter,
  hoveredSectionIndex,
  onSectionHover,
  headerNavigation,
  footerNavigation,
  onAddFirstBlock,
  previewTheme,
}: PagePreviewProps) {
  // Calculate add button positions
  const addButtonPositions = useMemo(() => {
    if (!isEditMode || hoveredSectionIndex === null || typeof hoveredSectionIndex !== 'number') {
      return { top: null, bottom: null };
    }

    return {
      top: hoveredSectionIndex,
      bottom: hoveredSectionIndex,
    };
  }, [isEditMode, hoveredSectionIndex]);

  const headerHovered = hoveredSectionIndex === 'header';
  const footerHovered = hoveredSectionIndex === 'footer';
  const [previewContainerRef, setPreviewContainerRef] = useState<HTMLDivElement | null>(null);

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    onSectionHover?.(null); // Clear hover state when dragging starts
  }, [onSectionHover]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSection?.(oldIndex, newIndex);

        // Scroll to the dropped section
        setTimeout(() => {
          const element = document.getElementById(`section-${active.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash effect or highlight could be added here if needed
          }
        }, 100);
      }
    }
  }, [blocks, onReorderSection]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  // Fetch and apply site theme
  const { theme: fetchedTheme } = useSiteTheme({
    siteId,
    enabled: !!siteId,
    applyToDocument: false,
  });

  // Prefer previewTheme if provided, otherwise use fetchedTheme
  const theme = previewTheme || fetchedTheme;

  // Apply theme CSS variables to preview container
  useEffect(() => {
    if (previewContainerRef && theme) {
      const vars = themeToCSSVariables(theme);
      Object.entries(vars).forEach(([key, value]) => {
        previewContainerRef.style.setProperty(key, value);
      });

      // Add global CSS rule for headlines
      if (theme.primary) {
        const styleId = 'site-theme-headlines';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        const containerId = previewContainerRef.id || `page-preview-container-${siteId || 'default'}`;
        const containerSelector = `#${containerId}`;
        const headlineColor = `var(--color-headline, var(--color-primary, ${theme.primary}))`;

        styleElement.textContent = `
          /* Target TypographyHeadline component only (renders as div) - exclude TypographyTitle */
          ${containerSelector} div.font-semibold.text-5xl:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.font-semibold.text-4xl:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.font-semibold.text-3xl:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.font-semibold.text-2xl:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.font-semibold.text-xl:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-5xl"].font-semibold:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-4xl"].font-semibold:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-3xl"].font-semibold:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-2xl"].font-semibold:not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-xl"].font-semibold:not([class*="uppercase"]):not([class*="tracking-wider"]) {
            color: ${headlineColor} !important;
          }
          
          /* Target div elements with text-primary class */
          ${containerSelector} div.text-primary:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-primary"]:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]) {
            color: ${headlineColor} !important;
          }
           /* Override text-vnpt-blue for headlines only */
          ${containerSelector} div.text-vnpt-blue.font-semibold:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.text-vnpt-blue:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]) {
            color: ${headlineColor} !important;
          }
          
          /* Explicitly exclude TypographyTitle elements */
          ${containerSelector} h1.uppercase,
          ${containerSelector} h2.uppercase,
          ${containerSelector} p.uppercase,
          ${containerSelector} h1[class*="tracking-wider"],
          ${containerSelector} h2[class*="tracking-wider"],
          ${containerSelector} p[class*="tracking-wider"] {
            color: inherit !important;
          }
        `;
      }
    }

    return () => {
      const styleElement = document.getElementById('site-theme-headlines');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [previewContainerRef, theme, siteId]);

  const handleHeaderHoverChange = useCallback(
    (hovering: boolean) => {
      if (!isEditMode) return;
      onSectionHover?.(hovering ? 'header' : null);
    },
    [isEditMode, onSectionHover]
  );

  const handleFooterHoverChange = useCallback(
    (hovering: boolean) => {
      if (!isEditMode) return;
      onSectionHover?.(hovering ? 'footer' : null);
    },
    [isEditMode, onSectionHover]
  );

  // Active dragged block for Overlay
  const activeBlock = useMemo(
    () => blocks.find((block) => block.id === activeDragId),
    [blocks, activeDragId]
  );

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div
      ref={setPreviewContainerRef}
      id={`page-preview-container-${siteId || 'default'}`}
      data-preview-container={siteId || 'default'}
      className={clsx(
        'min-h-[600px] bg-gray-50 relative',
      )}
      style={{ overflow: 'visible' }}
    >

      <HeaderNavigationBlock
        navigation={headerNavigation}
        lang={lang}
        siteLogo={siteLogo}
        isEditMode={isEditMode}
        hovered={headerHovered}
        onHoverChange={handleHeaderHoverChange}
        onEdit={isEditMode ? onEditHeader : undefined}
      />

      {/* Content Section with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                <Icon icon="lucide:layout" className="w-8 h-8 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                  Your page is empty
                </h3>
                <p className="text-sm text-neutral-500 max-w-md">
                  Start building by adding sections from the left panel. Each section represents a block of content.
                </p>
              </div>
              {isEditMode ? (
                <Button
                  variant="gradient"
                  size="sm"
                  className="text-white"
                  onClick={() => onAddFirstBlock?.()}
                >
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add your first section
                </Button>
              ) : (
                <div className="text-xs text-neutral-400">
                  Click `Edit` to start adding sections
                </div>
              )}
            </div>
          ) : (
            <>
              {blocks.map((block, index) => {
                const isHovered = hoveredSectionIndex === index;
                const showTopButton = isEditMode && addButtonPositions.top === index;
                const showBottomButton = isEditMode && addButtonPositions.bottom === index;

                return (
                  <SortableSection
                    key={block.id}
                    block={block}
                    index={index}
                    isEditMode={isEditMode}
                    isHovered={isHovered}
                    showTopButton={showTopButton}
                    showBottomButton={showBottomButton}
                    onSectionHover={onSectionHover}
                    onSectionClick={onSectionClick}
                    onInsertAbove={onInsertAbove}
                    onInsertBelow={onInsertBelow}
                    onMoveSection={onMoveSection}
                    onDeleteSection={onDeleteSection}
                    renderBlockPreview={renderBlockPreview}
                    lang={lang}
                    blocksLength={blocks.length}
                  />
                );
              })}
            </>
          )}
        </SortableContext>

        {/* Drag Overlay - Improved Visualization */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeBlock ? (
            <div className="opacity-90 shadow-2xl rounded-lg border-2 border-blue-500 overflow-hidden bg-white cursor-grabbing">
              {/* Overlay Header indicating movement - "Vùng sẽ thả" requirement */}
              <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
                <Icon icon="lucide:move" className="w-4 h-4" />
                <span>Moving {getBlockLabel(activeBlock.collection)}...</span>
              </div>
              {/* Render the block preview inside a contained box to represent the item */}
              <div className="opacity-50 pointer-events-none transform scale-95 origin-top p-4 max-h-[300px] overflow-hidden relative">
                {/* We might capture the block's preview here, but running heavy components in overlay can be laggy. 
                       Lets render a simplified preview or the actual block if it's lightweight enough. 
                       For now, render actual block but constrained. */}
                {renderBlockPreview(activeBlock, lang)}
                {/* Add a glasspane over it to indicate it's a ghost */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>


      <FooterNavigationBlock
        navigation={footerNavigation}
        lang={lang}
        isEditMode={isEditMode}
        hovered={footerHovered}
        onHoverChange={handleFooterHoverChange}
        onEdit={isEditMode ? onEditFooter : undefined}
      />
    </div>
  );
}

function renderBlockPreview(block: Block, lang: string) {
  // Convert lang format: 'en-US' -> 'en', 'vi-VN' -> 'vi'
  const shortLang = lang.split('-')[0];

  // Ensure block.item exists, fallback to empty object
  const blockData = block.item || {};

  // Use real block components from docs/src
  // Type assertion: block components expect specific types, but we receive generic BlockItem
  // Using 'as unknown as' for safe type coercion
  switch (block.collection) {
    case 'block_hero':
      return <HeroBlock key={block.id} data={blockData as unknown as Parameters<typeof HeroBlock>[0]['data']} lang={shortLang} />;

    case 'block_richtext':
      return <RichTextBlock key={block.id} data={blockData as unknown as Parameters<typeof RichTextBlock>[0]['data']} lang={shortLang} />;

    case 'block_columns':
      return <ColumnsBlock key={block.id} data={blockData as unknown as Parameters<typeof ColumnsBlock>[0]['data']} lang={shortLang} />;

    case 'block_quote':
      return <QuoteBlock key={block.id} data={blockData as unknown as Parameters<typeof QuoteBlock>[0]['data']} lang={shortLang} />;

    case 'block_faqs':
      return <FaqsBlock key={block.id} data={blockData as unknown as Parameters<typeof FaqsBlock>[0]['data']} lang={shortLang} />;

    case 'block_video':
      return <VideoBlock key={block.id} data={blockData as unknown as Parameters<typeof VideoBlock>[0]['data']} lang={shortLang} />;

    case 'block_gallery':
      return <GalleryBlock key={block.id} data={blockData as unknown as Parameters<typeof GalleryBlock>[0]['data']} lang={shortLang} />;

    case 'block_logocloud':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <LogoCloudBlock key={block.id} data={blockData as any} lang={shortLang} />;

    case 'block_steps':
      return <StepsBlock key={block.id} data={blockData as unknown as Parameters<typeof StepsBlock>[0]['data']} lang={shortLang} />;

    case 'block_cta':
      return <CtaBlock key={block.id} data={blockData as unknown as Parameters<typeof CtaBlock>[0]['data']} lang={shortLang} />;

    case 'block_html':
      return <RawHtmlBlock key={block.id} data={blockData as unknown as Parameters<typeof RawHtmlBlock>[0]['data']} lang={shortLang} />;

    case 'block_divider':
      return <DividerBlock key={block.id} data={blockData} />;

    case 'block_form':
      return <FormBlock key={block.id} data={blockData as unknown as Parameters<typeof FormBlock>[0]['data']} lang={shortLang} />;

    case 'block_testimonials':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <TestimonialsBlock key={block.id} data={blockData as any} lang={shortLang} />;

    case 'block_team':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <TeamBlock key={block.id} data={blockData as any} lang={shortLang} />;

    default:
      return <PlaceholderPreview collection={block.collection} />;
  }
}

function PlaceholderPreview({ collection }: { collection: string }) {
  return (
    <section className="py-16 px-6 md:px-12 bg-neutral-50">
      <div className="max-w-4xl mx-auto border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center">
        <Icon icon={getBlockIcon(collection)} className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-600 mb-2">
          {getBlockLabel(collection)}
        </h3>
        <p className="text-sm text-neutral-500">
          Preview for this block type is coming soon
        </p>
      </div>
    </section>
  );
}

// Helper functions - these stay the same
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

