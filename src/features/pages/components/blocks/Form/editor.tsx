'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button-base';
import { useFormsByEvent } from '@/hooks/useForms';
import type { BlockForm, BlockFormTranslation } from '@/types/directus-collections';

interface FormBlockEditorProps {
  formData: BlockForm | Record<string, unknown>;
  updateTranslation: (field: string, value: string | null) => void;
  updateField: (field: string, value: unknown) => void;
  currentTranslation: BlockFormTranslation | Record<string, unknown>;
  eventId?: string;
}

export default function FormBlockEditor({
  formData,
  updateTranslation,
  updateField,
  currentTranslation,
  eventId,
}: FormBlockEditorProps) {
  const [selectedForm, setSelectedForm] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  const { data: availableForms = [], isLoading, error } = useFormsByEvent(eventId || '');

  useEffect(() => {
    if ((formData as Record<string, unknown>).form && availableForms.length > 0) {
      const form = availableForms.find(
        (item: Record<string, unknown>) => item.id === (formData as Record<string, unknown>).form
      );
      if (form) {
        setSelectedForm(form);
      }
    }
  }, [(formData as Record<string, unknown>).form, availableForms]);

  const handleFormSelect = (formId: string) => {
    updateField('form', formId);
    const form = availableForms.find((item: Record<string, unknown>) => item.id === formId);
    setSelectedForm(form || null);
  };

  const handleCreateNewForm = () => {
    router.push(`/events/${eventId}/forms/new`);
  };

  const handleEditForm = () => {
    if (selectedForm?.id) {
      router.push(`/events/${eventId}/forms/${selectedForm.id}`);
    }
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
          placeholder="Contact Us / Registration Form..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Section Headline
        </label>
        <Input
          value={((currentTranslation as Record<string, unknown>).headline as string) || ''}
          onChange={(event) => updateTranslation('headline', event.target.value)}
          placeholder="Get in touch with us..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select Form <span className="text-red-500">*</span>
        </label>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-neutral-400 mr-2" />
            <span className="text-sm text-neutral-500">Loading forms...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <Icon icon="lucide:alert-circle" className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-sm text-red-500">Failed to load forms</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={((formData as Record<string, unknown>).form as string) || ''}
                onChange={(event) => handleFormSelect(event.target.value)}
              >
                <option value="">Select a form...</option>
                {availableForms.map((form: Record<string, unknown>) => (
                  <option key={form.id as string} value={form.id as string}>
                    {(form.translations as Array<Record<string, unknown>>)?.[0]?.title as string || (form.id as string)}
                  </option>
                ))}
              </select>
            </div>

            {selectedForm && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    {(selectedForm.translations as Array<Record<string, unknown>>)?.[0]?.title as string ||
                      'Untitled Form'}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleEditForm}>
                    <Icon icon="lucide:edit" className="w-3 h-3 mr-1" />
                    Edit Form
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Status: <span className="font-medium">{(selectedForm.status as string) || 'draft'}</span>
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={handleCreateNewForm}>
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Create New Form
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}




