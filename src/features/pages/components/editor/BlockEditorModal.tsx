'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import {
  RichtextBlockEditor,
  HeroBlockEditor,
  QuoteBlockEditor,
  ColumnsBlockEditor,
  FaqsBlockEditor,
  VideoBlockEditor,
  GalleryBlockEditor,
  LogoCloudBlockEditor,
  StepsBlockEditor,
  CtaBlockEditor,
  HtmlBlockEditor,
  DividerBlockEditor,
  FormBlockEditor,
  TestimonialsBlockEditor,
  GenericBlockEditor,
  TeamBlockEditor,
} from '../blocks/editor';
import type {
  BlockItem,
  BlockCollectionType,
  LanguageCode,
  BaseBlock,
  BlockTranslation,
} from '@/types/directus-collections';

interface Block {
  id: string;
  collection: BlockCollectionType | string;
  sort: number;
  item?: BlockItem | Record<string, unknown>;
}

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block | null;
  onSave: (blockData: BlockItem | Record<string, unknown>) => void;
  activeLang?: LanguageCode;
  folderId?: string;
  eventId?: string;
}

export default function BlockEditorModal({
  isOpen,
  onClose,
  block,
  onSave,
  activeLang: propActiveLang,
  folderId,
  eventId,
}: BlockEditorModalProps) {
  const [activeLang, setActiveLang] = useState<LanguageCode>(propActiveLang || 'en-US');
  const [formData, setFormData] = useState<BlockItem | Record<string, unknown>>({});

  // Initialize form data when block changes
  useEffect(() => {
    console.log('[BlockEditorModal] Block changed:', {
      blockId: block?.id,
      blockCollection: block?.collection,
      blockItem: block?.item,
      blockItemSteps: (block?.item as Record<string, unknown>)?.steps,
      blockItemForm: block?.item?.form,
      blockItemFormType: typeof block?.item?.form
    });

    if (block?.item) {
      // Ensure form field is a string, not an object
      const itemData: BlockItem | Record<string, unknown> = { ...block.item };

      console.log('[BlockEditorModal] After spread copy:', {
        hasSteps: 'steps' in itemData,
        stepsValue: (itemData as Record<string, unknown>).steps,
        stepsLength: Array.isArray((itemData as Record<string, unknown>).steps) ? (itemData as Record<string, unknown>).steps.length : 'N/A'
      });

      if (itemData.form && typeof itemData.form === 'object' && itemData.form !== null && 'id' in itemData.form) {
        console.log('[BlockEditorModal] Converting form object to string:', itemData.form);
        itemData.form = (itemData.form as { id: string }).id || itemData.form;
      }

      if (block.collection === 'block_video' && (!('type' in itemData) || itemData.type === undefined || itemData.type === null || itemData.type === '')) {
        itemData.type = 'url';
      }

      // Auto-create session-only translations if empty
      if (!itemData.translations || (Array.isArray(itemData.translations) && itemData.translations.length === 0)) {
        console.log('[BlockEditorModal] Translations empty, creating session-only temporary records for en-US and vi-VN');
        itemData.translations = [
          { id: 0, languages_code: 'en-US' as LanguageCode, title: '', headline: '', content: '' },
          { id: 0, languages_code: 'vi-VN' as LanguageCode, title: '', headline: '', content: '' },
        ];
      }

      setFormData(itemData);
      console.log('[BlockEditorModal] FormData initialized:', itemData);
    } else {
      // Initialize with default structure
      setFormData({
        translations: [
          { languages_code: 'en-US', title: '', headline: '', content: '' },
          { languages_code: 'vi-VN', title: '', headline: '', content: '' },
        ],
      });
    }
  }, [block]);


  const handleSave = () => {
    // Do NOT auto-fill event_id / tenant_id here.
    // Creation flow will enrich temp blocks with event/tenant in PagePayloadManager.
    onSave(formData);
  };

  const updateTranslation = useCallback((field: string, value: string | null) => {
    setFormData((prev: BlockItem | Record<string, unknown>) => {
      const baseBlock = prev as BaseBlock;
      const translations = baseBlock.translations || [];
      const hasTranslation = translations.some((t: BlockTranslation) => {
        const langCode = typeof t.languages_code === 'string'
          ? t.languages_code
          : ((t.languages_code as { code: string })?.code || '');
        return langCode === activeLang;
      });

      let updatedTranslations;
      if (!hasTranslation) {
        // Add new translation
        updatedTranslations = [
          ...translations,
          {
            languages_code: activeLang,
            [field]: value,
          } as unknown as BlockTranslation,
        ];
      } else {
        // Update existing
        updatedTranslations = translations.map((t: BlockTranslation) => {
          const langCode = typeof t.languages_code === 'string'
            ? t.languages_code
            : ((t.languages_code as { code: string })?.code || '');
          return langCode === activeLang
            ? { ...t, [field]: value }
            : t;
        });
      }

      return {
        ...prev,
        translations: updatedTranslations,
      };
    });
  }, [activeLang]);

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData((prev: BlockItem | Record<string, unknown>) => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  }, []);

  const getCurrentTranslation = (): BlockTranslation | Record<string, unknown> => {
    const baseBlock = formData as BaseBlock;
    const translations: BlockTranslation[] = baseBlock.translations || [
      { id: 0, languages_code: 'en-US' as LanguageCode },
      { id: 0, languages_code: 'vi-VN' as LanguageCode },
    ];
    const found = translations.find((t: BlockTranslation) => {
      const langCode = typeof t.languages_code === 'string'
        ? t.languages_code
        : ((t.languages_code as { code: string })?.code || '');
      return langCode === activeLang;
    });
    // Always return translation object; if not found, return default session record
    if (!found) {
      return { id: 0, languages_code: activeLang, title: '', headline: '', content: '' };
    }
    return found;
  };

  if (!block) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Icon icon={getBlockIcon(block.collection)} className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Edit {getBlockLabel(block.collection)}
                    </h2>
                    <p className="text-xs text-neutral-500">Configure block content and settings</p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  <Icon icon="lucide:x" className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Language Tabs */}
              <div className="px-6 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center space-x-2">
                <Icon icon="lucide:languages" className="w-4 h-4 text-neutral-500" />
                <span className="text-xs text-neutral-600 font-medium">Language:</span>
                <div className="flex items-center space-x-1">
                  {(['en-US', 'vi-VN'] as const).map(lang => (
                    <button
                      key={lang}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeLang === lang
                        ? 'bg-nexpo-gray text-white'
                        : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                      onClick={() => setActiveLang(lang)}
                    >
                      {lang === 'en-US' ? 'English' : 'Tiếng Việt'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {renderBlockEditor(block.collection, formData, updateTranslation, updateField, getCurrentTranslation(), folderId, eventId)}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-b-2xl">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSave}
                >
                  <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Render different editors based on block type
function renderBlockEditor(
  collection: string,
  formData: BlockItem | Record<string, unknown>,
  updateTranslation: (field: string, value: string | null) => void,
  updateField: (field: string, value: unknown) => void,
  currentTranslation: BlockTranslation | Record<string, unknown>,
  folderId?: string,
  eventId?: string
) {
  switch (collection) {
    case 'block_hero':
      return <HeroBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_richtext':
      return <RichtextBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_columns':
      return <ColumnsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_quote':
      return <QuoteBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;

    case 'block_faqs':
      return <FaqsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} />;

    case 'block_video':
      return <VideoBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_gallery':
      return <GalleryBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_logocloud':
      return <LogoCloudBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_steps':
      return <StepsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_cta':
      return (
        <CtaBlockEditor
          formData={formData}
          updateTranslation={updateTranslation}
          updateField={updateField}
          currentTranslation={currentTranslation}
          eventId={eventId}
        />
      );

    case 'block_html':
      return <HtmlBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} />;

    case 'block_divider':
      return <DividerBlockEditor formData={formData} updateField={updateField} />;

    case 'block_form':
      return <FormBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} eventId={eventId} />;

    case 'block_testimonials':
      return <TestimonialsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    case 'block_team':
      return <TeamBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;

    default:
      return <GenericBlockEditor collection={collection} />;
  }
}

// All block editors have been extracted to separate files in blocks/editor/ folder

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

