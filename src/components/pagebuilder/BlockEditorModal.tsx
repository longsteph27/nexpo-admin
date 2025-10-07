'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { assetsApi } from '@/lib/api';
import RichtextBlockEditor from './RichtextBlockEditor';

interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: any;
}

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block | null;
  onSave: (blockData: any) => void;
  activeLang?: 'en-US' | 'vi-VN';
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
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>(propActiveLang || 'en-US');
  const [formData, setFormData] = useState<any>({});

  // Initialize form data when block changes
  useEffect(() => {
    if (block?.item) {
      setFormData(block.item);
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
    onSave(formData);
  };

  const updateTranslation = (field: string, value: any) => {
    setFormData((prev: any) => {
      const translations = prev.translations || [
        { languages_code: 'en-US' },
        { languages_code: 'vi-VN' },
      ];
      
      const updatedTranslations = translations.map((t: any) =>
        t.languages_code === activeLang ? { ...t, [field]: value } : t
      );

      return {
        ...prev,
        translations: updatedTranslations,
      };
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const getCurrentTranslation = () => {
    const translations = formData.translations || [
      { languages_code: 'en-US' },
      { languages_code: 'vi-VN' },
    ];
    return translations.find((t: any) => t.languages_code === activeLang) || { languages_code: activeLang };
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
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
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        activeLang === lang
                          ? 'bg-neutral-900 text-white'
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
              <div className="flex-1 overflow-y-auto p-6">
                {renderBlockEditor(block.collection, formData, updateTranslation, updateField, getCurrentTranslation(), folderId, eventId)}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleSave}>
                    Apply
                  </Button>
                  <Button
                    className="bg-neutral-900 hover:bg-neutral-800 text-white"
                    onClick={() => {
                      handleSave();
                      onClose();
                    }}
                  >
                    <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                    Save & Close
                  </Button>
                </div>
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
  formData: any,
  updateTranslation: (field: string, value: any) => void,
  updateField: (field: string, value: any) => void,
  currentTranslation: any,
  folderId?: string,
  eventId?: string
) {
  switch (collection) {
    case 'block_hero':
      return <HeroBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;
    
    case 'block_richtext':
      return <RichTextBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;
    
    case 'block_columns':
      return <ColumnsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;
    
    case 'block_quote':
      return <QuoteBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;
    
    case 'block_faqs':
      return <FaqsBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;
    
    case 'block_video':
      return <VideoBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} />;
    
    case 'block_gallery':
      return <GalleryBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;
    
    case 'block_steps':
      return <StepsBlockEditor formData={formData} updateTranslation={updateTranslation} updateField={updateField} currentTranslation={currentTranslation} folderId={folderId} eventId={eventId} />;
    
    case 'block_cta':
      return <CtaBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;
    
    case 'block_html':
      return <HtmlBlockEditor formData={formData} updateTranslation={updateTranslation} currentTranslation={currentTranslation} />;
    
    case 'block_divider':
      return <DividerBlockEditor formData={formData} updateField={updateField} />;
    
    default:
      return <GenericBlockEditor collection={collection} />;
  }
}

// Hero Block Editor
function HeroBlockEditor({ formData, updateTranslation, updateField, currentTranslation, folderId, eventId }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={currentTranslation.headline || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Enter your hero headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={currentTranslation.content || ''}
          onChange={(e) => updateTranslation('content', e.target.value)}
          placeholder="Describe your product or service..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image Position
        </label>
        <div className="flex items-center space-x-3">
          {['left', 'right'].map(pos => (
            <button
              key={pos}
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${
                formData.image_position === pos
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateField('image_position', pos)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={`lucide:align-${pos === 'left' ? 'left' : 'right'}`} className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{pos}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Image
        </label>
        <ImageUpload
          value={formData.image || ''}
          onChange={(assetId) => updateField('image', assetId)}
          folderId={folderId}
          eventId={eventId}
        />
      </div>
    </div>
  );
}

// Rich Text Block Editor
function RichTextBlockEditor({ formData, updateTranslation, currentTranslation }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Section title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline
        </label>
        <Input
          value={currentTranslation.headline || ''}
          onChange={(e) => updateTranslation('headline', e.target.value)}
          placeholder="Eye-catching headline..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={currentTranslation.content || ''}
          onChange={(value) => updateTranslation('content', value)}
          placeholder="Write your content here..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Alignment
        </label>
        <div className="flex items-center space-x-2">
          {[
            { value: 'left', icon: 'lucide:align-left', label: 'Left' },
            { value: 'center', icon: 'lucide:align-center', label: 'Center' },
          ].map(option => (
            <button
              key={option.value}
              className={`flex-1 py-2 px-3 border-2 rounded-lg transition-all ${
                formData.alignment === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateTranslation('alignment', option.value)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={option.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Columns Block Editor
function ColumnsBlockEditor({ formData, updateTranslation, updateField, currentTranslation, folderId, eventId }: any) {
  const [rows, setRows] = useState<any[]>(formData.rows || []);

  const addRow = () => {
    const newRow = {
      id: `temp-row-${Date.now()}`,
      sort: rows.length,
      translations: [
        { languages_code: 'en-US', title: '', headline: '', content: '' },
        { languages_code: 'vi-VN', title: '', headline: '', content: '' },
      ],
      image_position: 'left',
      image: null,
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    updateField('rows', newRows);
  };

  const removeRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    updateField('rows', newRows);
  };

  const updateRow = (index: number, field: string, value: any, isTranslation = false) => {
    const newRows = [...rows];
    
    if (isTranslation) {
      if (!newRows[index].translations) {
        newRows[index].translations = [
          { languages_code: 'en-US' },
          { languages_code: 'vi-VN' },
        ];
      }
      const transIndex = newRows[index].translations.findIndex(
        (t: any) => t.languages_code === currentTranslation.languages_code
      );
      if (transIndex >= 0) {
        newRows[index].translations[transIndex] = {
          ...newRows[index].translations[transIndex],
          [field]: value,
        };
      } else {
        newRows[index].translations.push({
          languages_code: currentTranslation.languages_code,
          [field]: value,
        });
      }
    } else {
      newRows[index][field] = value;
    }
    
    setRows(newRows);
    updateField('rows', newRows);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Block Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Optional block title..."
        />
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">Columns / Rows</h3>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
            Add Row
          </Button>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => {
            const rowTrans = row.translations?.find((t: any) => t.languages_code === currentTranslation.languages_code) || {};
            
            return (
              <div key={row.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700">Row {index + 1}</span>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeRow(index)}
                  >
                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Row title..."
                    value={rowTrans.title || ''}
                    onChange={(e) => updateRow(index, 'title', e.target.value, true)}
                  />
                  <Input
                    placeholder="Row headline..."
                    value={rowTrans.headline || ''}
                    onChange={(e) => updateRow(index, 'headline', e.target.value, true)}
                  />
                  <textarea
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    rows={3}
                    placeholder="Row content..."
                    value={rowTrans.content || ''}
                    onChange={(e) => updateRow(index, 'content', e.target.value, true)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-2">
                      Image Position
                    </label>
                    <div className="flex items-center space-x-2">
                      {['left', 'right'].map(pos => (
                        <button
                          key={pos}
                          type="button"
                          className={`flex-1 py-1.5 px-3 border-2 rounded-lg transition-all text-xs ${
                            row.image_position === pos
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                          onClick={() => updateRow(index, 'image_position', pos, false)}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-2">
                      Image
                    </label>
                    <ImageUpload
                      value={row.image || ''}
                      onChange={(assetId) => updateRow(index, 'image', assetId, false)}
                      folderId={folderId}
                      eventId={eventId}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Quote Block Editor
function QuoteBlockEditor({ formData, updateTranslation, currentTranslation }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Quote Text <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={currentTranslation.quote || ''}
          onChange={(e) => updateTranslation('quote', e.target.value)}
          placeholder="Enter the quote..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author
        </label>
        <Input
          value={currentTranslation.author || ''}
          onChange={(e) => updateTranslation('author', e.target.value)}
          placeholder="Quote author name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Author Title
        </label>
        <Input
          value={currentTranslation.author_title || ''}
          onChange={(e) => updateTranslation('author_title', e.target.value)}
          placeholder="e.g., CEO, Product Manager..."
        />
      </div>
    </div>
  );
}

// FAQs Block Editor
function FaqsBlockEditor({ formData, updateTranslation, currentTranslation }: any) {
  const [faqs, setFaqs] = useState<any[]>(currentTranslation.faqs || []);

  const addFaq = () => {
    const newFaq = { id: Date.now(), question: '', answer: '' };
    const newFaqs = [...faqs, newFaq];
    setFaqs(newFaqs);
    updateTranslation('faqs', newFaqs);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Section Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Frequently Asked Questions"
        />
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">FAQ Items</h3>
          <Button size="sm" variant="outline" onClick={addFaq}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
            Add FAQ
          </Button>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-700">FAQ {index + 1}</span>
                <button
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    const newFaqs = faqs.filter((_, i) => i !== index);
                    setFaqs(newFaqs);
                    updateTranslation('faqs', newFaqs);
                  }}
                >
                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Question..."
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].question = e.target.value;
                    setFaqs(newFaqs);
                    updateTranslation('faqs', newFaqs);
                  }}
                />
                <textarea
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows={3}
                  placeholder="Answer..."
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].answer = e.target.value;
                    setFaqs(newFaqs);
                    updateTranslation('faqs', newFaqs);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Video Block Editor
function VideoBlockEditor({ formData, updateTranslation, updateField, currentTranslation }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Video title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Video Type
        </label>
        <div className="flex items-center space-x-3">
          {[
            { value: 'url', label: 'URL', icon: 'lucide:link' },
            { value: 'file', label: 'File Upload', icon: 'lucide:upload' },
          ].map(option => (
            <button
              key={option.value}
              className={`flex-1 py-2 px-4 border-2 rounded-lg transition-all ${
                formData.type === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateField('type', option.value)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon icon={option.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {formData.type === 'url' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Video URL <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.video_url || ''}
            onChange={(e) => updateField('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-neutral-500 mt-1">
            Supports YouTube, Vimeo, and direct video links
          </p>
        </div>
      )}
    </div>
  );
}

// Gallery Block Editor
function GalleryBlockEditor({ formData, updateTranslation, updateField, currentTranslation, folderId, eventId }: any) {
  const [galleryImages, setGalleryImages] = useState<string[]>(formData.gallery_items || []);

  const handleAddImage = (assetId: string) => {
    const newImages = [...galleryImages, assetId];
    setGalleryImages(newImages);
    updateField('gallery_items', newImages.map((id, idx) => ({
      id: `temp-${idx}`,
      directus_files_id: id,
      sort: idx,
    })));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Gallery Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Gallery title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Images ({galleryImages.length})
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={assetsApi.getAssetUrl(img)}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-neutral-200"
              />
              <button
                type="button"
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  const newImages = galleryImages.filter((_, i) => i !== idx);
                  setGalleryImages(newImages);
                  updateField('gallery_items', newImages.map((id, i) => ({
                    id: `temp-${i}`,
                    directus_files_id: id,
                    sort: i,
                  })));
                }}
              >
                <Icon icon="lucide:x" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <ImageUpload
          value=""
          onChange={handleAddImage}
          folderId={folderId}
          eventId={eventId}
        />
      </div>
    </div>
  );
}

// Steps Block Editor
function StepsBlockEditor({ formData, updateTranslation, updateField, currentTranslation, folderId, eventId }: any) {
  const [steps, setSteps] = useState<any[]>(formData.steps || []);

  const addStep = () => {
    const newStep = {
      id: `temp-step-${Date.now()}`,
      sort: steps.length,
      translations: [
        { languages_code: 'en-US', title: '', content: '' },
        { languages_code: 'vi-VN', title: '', content: '' },
      ],
      title: '',
      content: '',
      image: null,
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    updateField('steps', newSteps);
  };

  const updateStep = (index: number, field: string, value: any, isTranslation = false) => {
    const newSteps = [...steps];
    
    if (isTranslation) {
      if (!newSteps[index].translations) {
        newSteps[index].translations = [
          { languages_code: 'en-US' },
          { languages_code: 'vi-VN' },
        ];
      }
      const transIndex = newSteps[index].translations.findIndex(
        (t: any) => t.languages_code === currentTranslation.languages_code
      );
      if (transIndex >= 0) {
        newSteps[index].translations[transIndex] = {
          ...newSteps[index].translations[transIndex],
          [field]: value,
        };
      }
    } else {
      newSteps[index][field] = value;
    }
    
    setSteps(newSteps);
    updateField('steps', newSteps);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Section Title
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="How it works..."
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.show_step_numbers || false}
            onChange={(e) => updateField('show_step_numbers', e.target.checked)}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Show step numbers</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.alternate_image_position || false}
            onChange={(e) => updateField('alternate_image_position', e.target.checked)}
            className="rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-700">Alternate image position</span>
        </label>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">Steps</h3>
          <Button size="sm" variant="outline" onClick={addStep}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepTrans = step.translations?.find((t: any) => t.languages_code === currentTranslation.languages_code) || {};
            
            return (
              <div key={step.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700">Step {index + 1}</span>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      const newSteps = steps.filter((_, i) => i !== index);
                      setSteps(newSteps);
                      updateField('steps', newSteps);
                    }}
                  >
                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Step title..."
                    value={stepTrans.title || ''}
                    onChange={(e) => updateStep(index, 'title', e.target.value, true)}
                  />
                  <textarea
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    rows={2}
                    placeholder="Step description..."
                    value={stepTrans.content || ''}
                    onChange={(e) => updateStep(index, 'content', e.target.value, true)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-2">
                      Step Image
                    </label>
                    <ImageUpload
                      value={step.image || ''}
                      onChange={(assetId) => updateStep(index, 'image', assetId, false)}
                      folderId={folderId}
                      eventId={eventId}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// CTA Block Editor
function CtaBlockEditor({ formData, updateTranslation, currentTranslation }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={currentTranslation.title || ''}
          onChange={(e) => updateTranslation('title', e.target.value)}
          placeholder="Ready to get started?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          value={currentTranslation.content || ''}
          onChange={(e) => updateTranslation('content', e.target.value)}
          placeholder="Describe the action you want users to take..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Button Label
        </label>
        <Input
          value={currentTranslation.button_label || ''}
          onChange={(e) => updateTranslation('button_label', e.target.value)}
          placeholder="Get Started"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Button URL
        </label>
        <Input
          value={currentTranslation.button_url || ''}
          onChange={(e) => updateTranslation('button_url', e.target.value)}
          placeholder="/contact"
        />
      </div>
    </div>
  );
}

// HTML Block Editor
function HtmlBlockEditor({ formData, updateTranslation, currentTranslation }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Custom HTML <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
          rows={12}
          value={currentTranslation.raw_html || ''}
          onChange={(e) => updateTranslation('raw_html', e.target.value)}
          placeholder="<div>Your HTML here...</div>"
        />
        <p className="text-xs text-neutral-500 mt-2">
          ⚠️ Be careful with custom HTML. Ensure your code is safe and valid.
        </p>
      </div>
    </div>
  );
}

// Divider Block Editor
function DividerBlockEditor({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Title (Optional)
        </label>
        <Input
          value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Section divider..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Leave empty for a simple horizontal line
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ].map(option => (
            <button
              key={option.value}
              className={`py-2 px-3 border-2 rounded-lg transition-all text-sm ${
                formData.style === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
              onClick={() => updateField('style', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic Block Editor (fallback)
function GenericBlockEditor({ collection }: { collection: string }) {
  return (
    <div className="text-center py-12">
      <Icon icon="lucide:construction" className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
      <p className="text-sm text-neutral-500">
        Editor for <span className="font-medium">{collection}</span> is under construction
      </p>
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

