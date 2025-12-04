'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useSiteTheme } from '../../hooks/useSiteTheme';
import { themeToCSSVariables } from '../../services/siteThemeService';
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
  RawHtmlBlock,
  FormBlock,
  HeaderNavigationBlock,
  FooterNavigationBlock,
  DividerBlock,
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
  onEditHeader?: () => void;
  onEditFooter?: () => void;
  hoveredSectionIndex?: number | 'header' | 'footer' | null;
  onSectionHover?: (index: number | 'header' | 'footer' | null) => void;
  headerNavigation?: Navigation & { items?: DirectusNavigationItem[] } | null;
  footerNavigation?: Navigation & { items?: DirectusNavigationItem[] } | null;
  onAddFirstBlock?: () => void;
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
  onEditHeader,
  onEditFooter,
  hoveredSectionIndex,
  onSectionHover,
  headerNavigation,
  footerNavigation,
  onAddFirstBlock
}: PagePreviewProps) {
  // Tính toán vị trí button add section dựa trên hoveredSectionIndex
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

  // Fetch and apply site theme
  const { theme } = useSiteTheme({
    siteId,
    enabled: !!siteId,
    applyToDocument: false, // Apply to preview container instead
  });

  // Apply theme CSS variables to preview container
  useEffect(() => {
    if (previewContainerRef && theme) {
      const vars = themeToCSSVariables(theme);
      Object.entries(vars).forEach(([key, value]) => {
        previewContainerRef.style.setProperty(key, value);
      });

      // Add global CSS rule for headlines to use primary color
      if (theme.primary) {
        const styleId = 'site-theme-headlines';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        // Apply headline color to all h1-h6 and elements with headline classes
        // Use the preview container's scope to avoid affecting other parts of the page
        const containerId = previewContainerRef.id || `page-preview-container-${siteId || 'default'}`;
        const containerSelector = `#${containerId}`;
        const headlineColor = `var(--color-headline, var(--color-primary, ${theme.primary}))`;
        
        // Only target TypographyHeadline components (div), exclude h1-h5 and TypographyTitle
        styleElement.textContent = `
          /* Target TypographyHeadline component only (renders as div) - exclude TypographyTitle */
          /* TypographyHeadline: div with font-semibold and large text sizes, NOT TypographyTitle (has uppercase, tracking-wider) */
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
          
          /* Target div elements with text-primary class that are headlines (not buttons, exclude TypographyTitle) */
          ${containerSelector} div.text-primary:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div[class*="text-primary"]:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]) {
            color: ${headlineColor} !important;
          }
          
          /* Override text-vnpt-blue for headlines only (used in RichTextBlock TypographyHeadline) - exclude TypographyTitle */
          ${containerSelector} div.text-vnpt-blue.font-semibold:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]),
          ${containerSelector} div.text-vnpt-blue:not(button):not(.button):not([class*="button"]):not([class*="btn"]):not(a[class*="button"]):not(a[class*="btn"]):not([class*="uppercase"]):not([class*="tracking-wider"]) {
            color: ${headlineColor} !important;
          }
          
          /* Explicitly exclude TypographyTitle elements (h1, h2, p with uppercase and tracking-wider classes) */
          ${containerSelector} h1.uppercase,
          ${containerSelector} h2.uppercase,
          ${containerSelector} p.uppercase,
          ${containerSelector} h1[class*="tracking-wider"],
          ${containerSelector} h2[class*="tracking-wider"],
          ${containerSelector} p[class*="tracking-wider"] {
            color: inherit !important;
          }
        `;
        
        // Debug: log the CSS variables
        console.log('[PagePreview] Theme CSS applied:', {
          containerId,
          containerSelector,
          headlineColor,
          primaryColor: theme.primary,
          cssVars: vars,
        });
      }
    }

    // Cleanup
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

    return (
    <div 
      ref={setPreviewContainerRef}
      id={`page-preview-container-${siteId || 'default'}`}
      data-preview-container={siteId || 'default'}
      className={clsx(
        'min-h-[600px] bg-gray-50 relative',
        // isEditMode && 'divide-y divide-blue-500/0'
      )} 
      style={{ overflow: 'visible' }}
    >
      {/* Theme Selector - Fixed position at top right */}
      {siteId && !isEditMode && (
        <ThemeSelector 
          onThemeSelect={() => {}}
          siteId={siteId}
        />
      )}
      
      <HeaderNavigationBlock
        navigation={headerNavigation}
        lang={lang}
        siteLogo={siteLogo}
        isEditMode={isEditMode}
        hovered={headerHovered}
        onHoverChange={handleHeaderHoverChange}
        onEdit={isEditMode ? onEditHeader : undefined}
      />

      {/* Content Section - Empty state or blocks */}
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
        blocks.map((block, index) => {
          const isHovered = hoveredSectionIndex === index;
          const showTopButton = isEditMode && addButtonPositions.top === index;
          const showBottomButton = isEditMode && addButtonPositions.bottom === index;

  return (
          <motion.div 
            key={block.id} 
            className={clsx(
              'relative group bg-[#f9fafb]',
              isEditMode && 'cursor-pointer',
              // Border luôn chiếm không gian (border-2 = 2px), chỉ thay đổi màu khi hover
              isEditMode && 'border-2',
              !isHovered && isEditMode && 'border-transparent',
              isHovered && isEditMode && 'border-blue-500'
            )}
            onMouseEnter={() => isEditMode && onSectionHover?.(index)}
            onMouseLeave={() => isEditMode && onSectionHover?.(null)}
            onClick={() => isEditMode && onSectionClick?.(index)}
            animate={{
              borderColor: isHovered && isEditMode 
                ? 'rgba(59, 130, 246, 1)' 
                : 'rgba(59, 130, 246, 0)',
            }}
            transition={{ duration: 0, ease: 'easeOut' }}
          >
            {/* Add Section Button - Top - nằm giữa border top */}
            {isEditMode && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 z-30"
                style={{
                  top: '-17px', // Nằm giữa border (border-2 = 2px, center = 1px)
                }}
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

            {/* Add Section Button - Bottom - nằm giữa border bottom */}
            {isEditMode && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 z-30"
                style={{
                  bottom: '-17px', // Nằm giữa border (border-2 = 2px, center = 1px)
                }}
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
                
            {/* Edit Indicator, Move Buttons & Delete Button */}
            {isEditMode && isHovered && (
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
                
                {/* Left Side Buttons: Move Up, Move Down, Delete */}
                <div className="absolute top-3 left-3 flex flex-col items-center space-y-2 z-30 pointer-events-auto">
                  {/* Move Up Button */}
                  {index > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSection?.(index, 'up');
                      }}
                      className="bg-sky-200 hover:bg-neutral-800 rounded-full p-2 shadow-xl transition-colors"
                      title="Move up"
                    >
                      <Icon icon="lucide:chevron-up" className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  {/* Move Down Button */}
                  {index < blocks.length - 1 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSection?.(index, 'down');
                      }}
                      className="bg-neutral-700 hover:bg-neutral-800 text-white rounded-full p-2 shadow-lg transition-colors"
                      title="Move down"
                    >
                      <Icon icon="lucide:chevron-down" className="w-4 h-4 text-black" />
                    </motion.button>
                  )}
                  
                  {/* Delete Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
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
            <motion.div 
              className="relative"
              style={{ zIndex: 10 }}
              animate={{
                opacity: isEditMode && isHovered ? 0.95 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
          {renderBlockPreview(block, lang)}
            </motion.div>
          
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
        );
        })
      )}

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

