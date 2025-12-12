'use client';

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Icon } from '@iconify/react';
import debounce from 'lodash/debounce';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { generateTempId } from '@/lib/payload/validators';
import type { BlockFaqs, BlockFaqsTranslation } from '@/types/directus-collections';

interface FaqItem {
  id: string;
  title: string;
  answer: string;
}

interface FormValues {
  faqs: FaqItem[];
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
  const trans = currentTranslation as Record<string, unknown>;

  // Initial data parsing
  const initialFaqs = useMemo(() => {
    const faqsData = trans.faqs as FaqItem[] | undefined;
    if (!Array.isArray(faqsData)) return [];

    // Ensure all FAQs have string IDs
    return faqsData.map((faq) => ({
      id: faq.id?.toString() || generateTempId(),
      title: faq.title || '',
      answer: faq.answer || '',
    }));
  }, [trans.faqs]);

  // Initialize React Hook Form
  const { control, getValues, reset, register } = useForm<FormValues>({
    defaultValues: {
      faqs: initialFaqs,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'faqs',
    keyName: 'key',
  });

  // Debounced update to parent
  const debouncedUpdate = useMemo(
    () =>
      debounce((currentFaqs: FaqItem[]) => {
        // updateTranslation expects string | null, but we'll pass the array
        // The parent will handle serialization if needed
        updateTranslation('faqs', currentFaqs as any);
      }, 500),
    [updateTranslation]
  );

  // Sync form with parent state changes
  const hasInitialized = useRef(false);
  const faqsLength = initialFaqs.length;

  useEffect(() => {
    // Only initialize if we have data, or if we are sure there is no data (managed by parent?)
    // This fix ensures that if data loads asynchronously, we wait for it before locking initialization.
    if (!hasInitialized.current && faqsLength > 0) {
      reset({ faqs: initialFaqs });
      hasInitialized.current = true;
    }
  }, [initialFaqs, faqsLength, reset]);

  const handleUpdate = useCallback(() => {
    const currentFaqs = getValues('faqs');
    debouncedUpdate(currentFaqs);
  }, [debouncedUpdate, getValues]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Track expanded items state
  // Using tempId as key for tracking.
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const addFaq = () => {
    const id = generateTempId();
    append({
      id,
      title: '',
      answer: '',
    });
    // Auto-expand new item
    setExpandedItems(prev => ({ ...prev, [id]: true }));
    handleUpdate();
  };

  const removeFaq = (index: number) => {
    remove(index);
    handleUpdate();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Section Title
        </label>
        <Input
          value={(trans.title as string) || ''}
          onChange={(event) => updateTranslation('title', event.target.value)}
          placeholder="Frequently Asked Questions"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Headline Block
        </label>
        <RichTextEditor
          value={(trans.headline as string) || ''}
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
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-all cursor-pointer select-none ${isSelected
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
          {fields.map((field, index) => {
            const { onChange: onTitleChange, ...titleRest } = register(`faqs.${index}.title`);
            const { onChange: onAnswerChange, ...answerRest } = register(`faqs.${index}.answer`);
            const isExpanded = expandedItems[field.id] !== false; // Default to open? Or closed?
            // Usually editors start collapsed to save space if many.
            // Let's default to collapse unless explicitly opened.
            // But user said "items ... should have collapse/expand".
            // Let's assume default closed except new ones.
            // Actually, for better UX on load, maybe collapsed is better if list is long.
            // But if I default to false, user clicks on item to edit.

            // Re-eval: Default expandedItems[id] ?? false (Closed by default)
            // But we auto-expand new items.
            // Wait, existing items might need to be edited.
            // Let's make toggle easy.

            return (
              <div key={field.key} className="bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={() => toggleExpand(field.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon
                      icon={expandedItems[field.id] ? "lucide:chevron-down" : "lucide:chevron-right"}
                      className="w-4 h-4 text-neutral-500 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-neutral-700 truncate select-none">
                      {field.title || `FAQ ${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFaq(index);
                      }}
                    >
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedItems[field.id] && (
                  <div className="p-4 pt-0 space-y-3 border-t border-neutral-200 mt-2">
                    <Input
                      placeholder="Question/Title..."
                      {...titleRest}
                      defaultValue={field.title}
                      onChange={(e) => {
                        onTitleChange(e);
                        handleUpdate();
                      }}
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      rows={3}
                      placeholder="Answer..."
                      {...answerRest}
                      defaultValue={field.answer}
                      onChange={(e) => {
                        onAnswerChange(e);
                        handleUpdate();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
