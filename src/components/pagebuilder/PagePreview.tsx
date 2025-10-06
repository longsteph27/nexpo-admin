'use client';

import React from 'react';
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

interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: any;
}

interface PagePreviewProps {
  blocks: Block[];
  lang: 'en-US' | 'vi-VN';
}

export default function PagePreview({ blocks, lang }: PagePreviewProps) {
  if (blocks.length === 0) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center text-center p-12">
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
    );
  }

  return (
    <div className="min-h-[600px] bg-gray-50">
      {blocks.map((block, index) => (
        <div key={block.id} className="relative group">
          {renderBlockPreview(block, lang)}
          
          {/* Section Label Overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="bg-neutral-900/90 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
              <Icon icon={getBlockIcon(block.collection)} className="w-3 h-3" />
              <span>Section {index + 1}</span>
            </div>
          </div>
        </div>
      ))}
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

