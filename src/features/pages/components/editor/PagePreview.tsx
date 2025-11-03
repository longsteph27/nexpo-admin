'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import HeroBlock from '@/components/blocks/HeroBlock';
import RichTextBlock from '@/components/blocks/RichTextBlock';
import ColumnsBlock from '@/components/blocks/ColumnsBlock';
import QuoteBlock from '@/components/blocks/QuoteBlock';
import StepsBlock from '@/components/blocks/StepsBlock';
import FaqsBlock from '@/components/blocks/FaqsBlock';
import CtaBlock from '@/components/blocks/CtaBlock';
import VideoBlock from '@/components/blocks/VideoBlock';
import GalleryBlock from '@/components/blocks/GalleryBlock';
import RawHtmlBlock from '@/components/blocks/RawHtmlBlock';
import FormBlock from '@/components/blocks/FormBlock';
import ThemeSelector from '@/components/ui/ThemeSelector';
import AddSectionButton from './AddSectionButton';
import clsx from 'clsx';

interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: any;
}

interface PagePreviewProps {
  blocks: Block[];
  lang: 'en-US' | 'vi-VN';
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
  headerNavigation?: any;
  footerNavigation?: any;
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
  footerNavigation
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

  const renderHeader = () => (
    <motion.div
      className={clsx(
        'relative group border-b border-neutral-200',
        isEditMode && 'cursor-pointer'
      )}
      onMouseEnter={() => isEditMode && onSectionHover?.('header')}
      onMouseLeave={() => isEditMode && onSectionHover?.(null)}
      onClick={() => isEditMode && onEditHeader?.()}
    >
      {isEditMode && headerHovered && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 z-30"></div>
      )}
      {/* Header Content */}
      <div className="min-h-[80px] flex items-center justify-between px-8 relative z-10">
        {/* Left: Logo */}
        <div className="flex items-center">
          {siteLogo ? (
            <img 
              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${siteLogo}`} 
              alt="Site Logo" 
              className="h-10 w-auto object-contain"
            />
          ) : (
            <img 
              src="/logo_nexpo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
          )}
        </div>
 
        {/* Center: Navigation Links */}
        {headerNavigation?.items && headerNavigation.items.length > 0 ? (
          <nav className="flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {headerNavigation.items.map((item: any, idx: number) => {
              const translation = item.translations?.find((t: any) => t.languages_code === lang) || item.translations?.[0];
              return (
                <a
                  key={idx}
                  href={item.url || '#'}
                  className="text-sm font-bold uppercase text-neutral-900 hover:text-neutral-700 tracking-wide"
                >
                  {translation?.title || item.title || 'Menu Item'}
                </a>
              );
            })}
          </nav>
        ) : (
          <nav className="flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <span className="text-sm text-neutral-400 font-bold uppercase tracking-wide">Navigation</span>
          </nav>
        )}

        {/* Right: CTA Button */}
        <div className="flex items-center">
          <button className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-sm font-medium transition-colors">
            Get In Touch
          </button>
        </div>
      </div>

      {/* Hover Overlay - Background xám trong suốt */}
      {isEditMode && (
        <motion.div
          className="absolute inset-0 bg-neutral-400/20 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: headerHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Edit Button - Nằm giữa */}
          {headerHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onEditHeader?.();
              }}
              className="bg-white/95 hover:bg-white text-neutral-900 px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-lg font-medium text-sm z-30"
            >
              <Icon icon="lucide:pencil" className="w-4 h-4" />
              <span>EDIT SITE HEADER</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  const renderFooter = () => (
    <motion.div
      className={clsx(
        'relative group border-t border-neutral-200',
        isEditMode && 'cursor-pointer'
      )}
      onMouseEnter={() => isEditMode && onSectionHover?.('footer')}
      onMouseLeave={() => isEditMode && onSectionHover?.(null)}
      onClick={() => isEditMode && onEditFooter?.()}
    >
      {/* Footer Content */}
      <div className="min-h-[120px] flex items-center justify-center px-6 relative z-10">
        {footerNavigation?.items && footerNavigation.items.length > 0 ? (
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerNavigation.items.map((item: any, idx: number) => {
              const translation = item.translations?.find((t: any) => t.languages_code === lang) || item.translations?.[0];
              return (
                <a
                  key={idx}
                  href={item.url || '#'}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  {translation?.title || item.title || 'Menu Item'}
                </a>
              );
            })}
          </nav>
        ) : (
          <div className="text-sm text-neutral-400">Footer Navigation</div>
        )}
      </div>

      {/* Hover Overlay - Background xám trong suốt */}
      {isEditMode && (
        <motion.div
          className="absolute inset-0 bg-neutral-400/20 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: footerHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Edit Button - Nằm giữa */}
          {footerHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onEditFooter?.();
              }}
              className="bg-white/95 hover:bg-white text-neutral-900 px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-lg font-medium text-sm z-30"
            >
              <Icon icon="lucide:pencil" className="w-4 h-4" />
              <span>EDIT SITE FOOTER</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );

    return (
    <div 
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
      
      {/* Header Section - Fixed at top */}
      {renderHeader()}

      {/* Content Section - Empty state or blocks */}
      {blocks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <Icon icon="lucide:layout" className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
          Your page is empty
        </h3>
        <p className="text-sm text-neutral-500 max-w-md">
          Start building by adding sections from the left panel. Each section represents a block of content.
        </p>
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
              'relative group',
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

      {/* Footer Section - Fixed at bottom */}
      {renderFooter()}
    </div>
  );
}

function renderBlockPreview(block: Block, lang: string) {
  // Convert lang format: 'en-US' -> 'en', 'vi-VN' -> 'vi'
  const shortLang = lang.split('-')[0];

  // Use real block components from docs/src
  switch (block.collection) {
    case 'block_hero':
      return <HeroBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_richtext':
      return <RichTextBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_columns':
      return <ColumnsBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_quote':
      return <QuoteBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_faqs':
      return <FaqsBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_video':
      return <VideoBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_gallery':
      return <GalleryBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_steps':
      return <StepsBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_cta':
      return <CtaBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_html':
      return <RawHtmlBlock key={block.id} data={block.item} lang={shortLang} />;
    
    case 'block_divider':
      return <DividerPreview data={block.item} />;
    
    case 'block_form':
      return <FormBlock key={block.id} data={block.item} lang={shortLang} />;
    
    default:
      return <PlaceholderPreview collection={block.collection} />;
  }
}

// Fallback Preview Components (for blocks not yet imported)

function HtmlPreview({ data, translation }: any) {
  const rawHtml = translation.raw_html || data.raw_html || '';

  return (
    <section className="py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {rawHtml ? (
          <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
        ) : (
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center">
            <Icon icon="lucide:code" className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Custom HTML will appear here</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DividerPreview({ data }: any) {
  const title = data.title || '';
  const style = data.style || 'solid';

  return (
    <section className="py-8 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {title && (
          <p className="text-center text-sm font-medium text-neutral-500 mb-4">
            {title}
          </p>
        )}
        <hr className={`border-neutral-300 ${style === 'dashed' ? 'border-dashed' : style === 'dotted' ? 'border-dotted' : ''}`} />
      </div>
    </section>
  );
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

