'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { BlockFaqs, BlockFaqsTranslation } from '@/types/directus-collections';

interface FaqItem {
  id: number;
  title: string;
  answer: string;
}

interface FaqsBlockEditorProps {
  formData: BlockFaqs | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockFaqsTranslation | Record<string, unknown>;
}

export default function FaqsBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
}: FaqsBlockEditorProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>(
    ((currentTranslation as Record<string, unknown>).faqs as FaqItem[]) || []
  );

  // Sync FAQs when currentTranslation changes
  useEffect(() => {
    const currentFaqs = ((currentTranslation as Record<string, unknown>).faqs as FaqItem[]) || [];
    // Only update if the FAQ items have actually changed
    if (JSON.stringify(currentFaqs) !== JSON.stringify(faqs)) {
      setFaqs(currentFaqs);
    }
  }, [currentTranslation, faqs]);

  const persistFaqs = (items: FaqItem[]) => {
    setFaqs(items);
    updateTranslation('faqs', items as unknown as string | null);
  };

  const addFaq = () => {
    const newFaq = { id: Date.now(), title: '', answer: '' };
    persistFaqs([...faqs, newFaq]);
  };

  const updateFaq = (index: number, field: keyof FaqItem, value: string) => {
    const next = [...faqs];
    next[index][field] = value;
    persistFaqs(next);
  };

  const removeFaq = (index: number) => {
    const next = faqs.filter((_, itemIndex) => itemIndex !== index);
    persistFaqs(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Section Title
        </label>
        <Input
          value={((currentTranslation as Record<string, unknown>).title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Frequently Asked Questions"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline Block
        </label>
        <RichTextEditor
          value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(value) => updateTranslation('headline', value)}
          placeholder="Add a headline above the FAQs..."
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Text Alignment
        </label>
        <div className="flex gap-2 w-full">
          {[
            { value: 'left', label: 'Left', icon: 'lucide:align-left' },
            { value: 'center', label: 'Center', icon: 'lucide:align-center' },
          ].map((option) => {
            const isSelected = (((formData as Record<string, unknown>).alignment as string) || 'center') === option.value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  updateField('alignment', option.value);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    updateField('alignment', option.value);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                    : 'border-gray-300 text-neutral-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon icon={option.icon} className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            );
          })}
        </div>
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
                  type="button"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => removeFaq(index)}
                >
                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Question/Title..."
                  value={faq.title}
                  onChange={(event) => updateFaq(index, 'title', event.target.value)}
                />
                <textarea
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows={3}
                  placeholder="Answer..."
                  value={faq.answer}
                  onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




