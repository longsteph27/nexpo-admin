'use client';
import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import { useForm as useDirectusForm } from '@/hooks/useForms';
import { useForm, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFormConditions, Field } from '@/hooks/use-form-conditions';
import { buildDynamicZodSchema } from '@/lib/dynamic-schema';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

interface FormBlockData {
  id: string;
  form?: string | { id?: string };
  tenant_id?: number;
  event_id?: number;
  translations?: Array<{
    title?: string;
    headline?: string;
    languages_code: string;
  }>;
}

interface FormBlockProps {
  data: FormBlockData;
  lang: string;
}

export default function FormBlock({ data, lang }: FormBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';

  // Get block translations (title, headline for the form section)
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0];
  const title = translation?.title || '';
  const headline = translation?.headline || '';

  // Ensure formId is a string
  const formId = typeof data.form === 'string' ? data.form : (data.form?.id || '');
  
  // Load form data via React Query
  const { data: formResponse, isLoading, error } = useDirectusForm(formId);

  // Extract form data from response
  const formConfig = formResponse as any | undefined;
  const fields = (formConfig?.fields || []) as Field[];

  // Get form translations (form title, submit label, success message)
  const formTranslation = formConfig?.translations?.find((t: any) => t.languages_code === directusLang) || formConfig?.translations?.[0];
  const submitLabel = formTranslation?.submit_label || 'Submit';

  // Tạo zodResolver động. Mỗi khi dynamicSchema thay đổi resolver cũng thay đổi theo.
  const defaultValues = useMemo(
    () => fields.reduce((acc, f) => ({ ...acc, [f.id]: f.type === 'multiselect' ? [] : '' }), {}),
    [fields]
  );

  // 1. Khởi tạo RHF form
  const rhfForm = useForm<FieldValues>({
    defaultValues,
  });

  // 2. Gắn Hook quản lý conditions tự động
  const { visibleFields, requiredFields, dynamicOptions } = useFormConditions(fields, rhfForm);

  // 3. Build lại Schema Zod động mỗi khi required state hay visible state thay đổi
  const dynamicSchema = useMemo(
    () => buildDynamicZodSchema(fields, requiredFields, visibleFields),
    [fields, requiredFields, visibleFields]
  );

  // Cập nhật resolver + reset values khi fields load xong lần đầu
  useEffect(() => {
    if (fields.length > 0) {
      rhfForm.reset(defaultValues, { keepErrors: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // Cập nhật resolver nóng khi schema thay đổi (trigger re-validate)
  useEffect(() => {
    rhfForm.clearErrors();
  }, [dynamicSchema, rhfForm]);

  // Show placeholder if no form selected
  if (!data.form) {
    return (
      <BlockContainer className="py-16 px-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 md:p-12 shadow-lg border-l-8 border-blue-500 border-2 border-dashed">
            <div className="text-center text-content-tertiary">
              <Icon icon="lucide:form-input" className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="text-sm">Form content will appear here</p>
              <p className="text-xs mt-2">Select a form in the editor to see the form</p>
            </div>
          </div>
        </div>
      </BlockContainer>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <BlockContainer className="py-16 px-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-200">
            <div className="flex items-center justify-center py-8">
              <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-blue-500 mr-3" />
              <span className="text-neutral-600">Loading form...</span>
            </div>
          </div>
        </div>
      </BlockContainer>
    );
  }

  // Show error state
  if (error || !formConfig) {
    return (
      <BlockContainer className="py-16 px-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="text-center text-red-600">
              <Icon icon="lucide:alert-circle" className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm font-medium">Failed to load form</p>
              <p className="text-xs mt-2">Please check the form configuration</p>
            </div>
          </div>
        </div>
      </BlockContainer>
    );
  }

  // Prevent form submission in preview mode
  const handlePreventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FormBlock] Submit prevented - this is a preview only');
    toast.info('Form submission is disabled in preview mode');
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case '33':
        return 'md:col-span-2';
      case '50':
        return 'md:col-span-3';
      case '67':
        return 'md:col-span-4';
      case '100':
      default:
        return 'md:col-span-6';
    }
  };

  return (
    <BlockContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card mx-auto mt-4 max-w-4xl"
      >
        <div className='mb-6'>
          {title && (
            <TypographyTitle className="text-[var(--color-gray)]">
              {title}
            </TypographyTitle>
          )}
          {headline && (
            <TypographyHeadline
              className="text-[var(--color-primary)] font-semibold [font-family:var(--font-display)]"
              content={headline}
            />
          )}
        </div>
        <div className="card-body bg-white border-2 border-[var(--color-primary)] rounded-[12px] shadow-md p-8">
          
          <Form {...rhfForm}>
            <form
              className="form-control relative mt-4 space-y-6"
              onSubmit={(e) => {
                // Preview mode: block submit & notify user
                e.preventDefault();
                toast.info('Form submission is disabled in preview mode');
              }}
            >
              <div className="grid gap-6 md:grid-cols-6">
                {fields.map((field: any) => {
                  if (!visibleFields[field.id]) return null;

                  const fieldTranslation = field.translations?.find((t: any) => t.languages_code === directusLang) || field.translations?.[0];
                  const label = fieldTranslation?.label || field.name;
                  const placeholder = fieldTranslation?.placeholder || '';
                  const help = fieldTranslation?.help || '';
                  
                  const renderOptions = dynamicOptions[field.id] || fieldTranslation?.options || [];
                  const isRequired = requiredFields[field.id];
                  // Set base readonly state to true since this is a preview preview, but respect dynamically readonly too
                  // In a real usage (non-preview), it would just be `readonlyFields[field.id]`
                  const isReadonly = true;

                  const commonProps = {
                    id: field.id,
                    name: field.name,
                    placeholder,
                    disabled: isReadonly,
                    className: 'form-input w-full rounded-md px-4 py-4 bg-gray-50 text-gray-700 border border-gray-300 cursor-not-allowed opacity-75',
                    style: { borderColor: 'var(--color-border, #d1d5db)' },
                  };

                  return (
                    <div key={field.id} className={cn(getWidthClass(field.width), 'w-full')}>
                      <FormField
                        control={rhfForm.control}
                        name={field.id as string}
                        render={({ field: rhfField }: { field: ControllerRenderProps<FieldValues, string> }) => (
                          <FormItem>
                            <label className='block text-sm font-medium text-gray-900 mb-2' htmlFor={field.id}>
                              {label}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            <FormControl>
                              {(() => {
                                switch (field.type) {
                                  case 'textarea':
                                    return <textarea {...commonProps} {...rhfField} rows={5} />;
                                  
                                  case 'select':
                                    return (
                                      <select {...commonProps} {...rhfField}>
                                        <option value="">Select an option</option>
                                        {renderOptions.map((option: any, index: number) => (
                                          <option key={index} value={option.value}>
                                            {option.label || option.text || option.value}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  
                                  case 'multiselect':
                                    return (
                                      <div className="space-y-2">
                                        {renderOptions.map((option: any, index: number) => {
                                          const currentVals = (rhfField.value || []) as string[];
                                          return (
                                            <label key={index} className="flex items-center space-x-2 cursor-not-allowed opacity-75">
                                              <input
                                                type="checkbox"
                                                value={option.value}
                                                disabled={isReadonly}
                                                checked={currentVals.includes(String(option.value))}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    rhfField.onChange([...currentVals, String(option.value)]);
                                                  } else {
                                                    rhfField.onChange(currentVals.filter((v: string) => v !== String(option.value)));
                                                  }
                                                }}
                                                className="form-checkbox h-4 w-4 text-gray-400 border-gray-300 rounded cursor-not-allowed"
                                              />
                                              <span className="text-gray-700">{option.label || option.text || option.value}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    );

                                  case 'file':
                                  case 'image':
                                    return (
                                      <div className="relative">
                                        <input
                                          {...commonProps}
                                          type="file"
                                          accept={field.type === 'image' ? "image/*" : undefined}
                                          className={cn(commonProps.className, 'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-400 file:text-white file:cursor-not-allowed')}
                                          onChange={(e) => {
                                            if (e.target.files) rhfField.onChange(e.target.files);
                                          }}
                                        />
                                      </div>
                                    );

                                  case 'email':
                                    return <input {...commonProps} {...rhfField} type="email" />;
                                  
                                  case 'number':
                                    return <input {...commonProps} {...rhfField} type="number" />;
                                  
                                  default: // input
                                    return <input {...commonProps} {...rhfField} type="text" />;
                                }
                              })()}
                            </FormControl>
                            
                            {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
                            <FormMessage className="text-red-500 mt-1" />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Submit Button - Disabled for Preview */}
              <div className="col-span-6 mx-auto mt-6">
                <button
                  type="button"
                  disabled
                  className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-md opacity-50 cursor-not-allowed w-full md:w-auto"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </Form>

        </div>
      </motion.div>
    </BlockContainer>
  );
}
