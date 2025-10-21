'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import BlockContainer from '@/components/BlockContainer'
import TypographyTitle from '@/components/typography/TypographyTitle'
import TypographyHeadline from '@/components/typography/TypographyHeadline'
import { useForm } from '@/hooks/useForms'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FormBlockData {
  id: string
  form?: string
  tenant_id?: number
  event_id?: number
  translations?: Array<{
    title?: string
    headline?: string
    languages_code: string
  }>
}

interface FormBlockProps {
  data: FormBlockData
  lang: string
}

interface FormField {
  id: string
  name: string
  type: 'input' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'file' | 'image'
  width?: string
  is_required?: boolean
  validation?: string
  translations?: Array<{
    languages_code: string
    label?: string
    placeholder?: string
    help?: string
    options?: Array<{ label: string; value: string }>
  }>
}

interface Form {
  id: string
  status: string
  on_success?: string
  redirect_url?: string
  fields?: FormField[]
  translations?: Array<{
    languages_code: string
    title?: string
    submit_label?: string
    success_message?: string
  }>
}

export default function FormBlock({ data, lang }: FormBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'

  // Get block translations (title, headline for the form section)
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0]
  const title = translation?.title || ''
  const headline = translation?.headline || ''

  // Debug: Log data.form to check if it's a string or object
  console.log('[FormBlock] data.form:', data.form, 'type:', typeof data.form);
  
  // Ensure formId is a string
  const formId = typeof data.form === 'string' ? data.form : (data.form?.id || '');
  console.log('[FormBlock] Using formId:', formId);
  
  // Load form data via React Query
  const { data: formResponse, isLoading, error } = useForm(formId)

  // Extract form data from response
  const form = formResponse as Form | undefined

  // Get form translations (form title, submit label, success message)
  const formTranslation = form?.translations?.find((t: any) => t.languages_code === directusLang) || form?.translations?.[0]
  const submitLabel = formTranslation?.submit_label || 'Submit'

  // Debug logging
  console.log('[FormBlock] Rendering:', {
    blockData: data,
    blockTranslation: translation,
    lang,
    directusLang,
    title,
    headline,
    formData: form,
    formFields: form?.fields,
    isLoading,
    error
  })

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
    )
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
    )
  }

  // Show error state
  if (error || !form) {
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
    )
  }

  // Prevent form submission in preview mode
  const handlePreventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[FormBlock] Submit prevented - this is a preview only')
    toast.info('Form submission is disabled in preview mode')
  }

  const renderField = (field: FormField) => {
    const fieldTranslation = field.translations?.find(t => t.languages_code === directusLang) || field.translations?.[0]
    const label = fieldTranslation?.label || field.name
    const placeholder = fieldTranslation?.placeholder || ''
    const help = fieldTranslation?.help || ''
    const options = fieldTranslation?.options || []

    // Get width class based on field width setting
    const getWidthClass = () => {
      switch (field.width) {
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
    }

    const commonProps = {
      id: field.id,
      name: field.name,
      placeholder,
      disabled: true, // Disabled for preview mode
      className: 'form-input w-full rounded-md px-4 py-4 bg-gray-50 text-gray-700 border border-gray-300 cursor-not-allowed opacity-75',
      style: { borderColor: 'var(--color-border, #d1d5db)' },
    }

    return (
      <div key={field.id} className={cn(getWidthClass(), 'w-full')}>
        <label className='block text-sm font-medium text-gray-900 mb-2' htmlFor={field.id}>
          {label}
          {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {(() => {
          switch (field.type) {
            case 'textarea':
              return (
                <textarea
                  {...commonProps}
                  rows={5}
                />
              )

            case 'select':
              return (
                <select {...commonProps}>
                  <option value="">Select an option</option>
                  {options.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )

            case 'multiselect':
              return (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2 cursor-not-allowed opacity-75">
                      <input
                        type="checkbox"
                        value={option.value}
                        disabled
                        className="form-checkbox h-4 w-4 text-gray-400 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )

            case 'file':
              return (
                <div className="relative">
                  <input
                    {...commonProps}
                    type="file"
                    className={cn(commonProps.className, 'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-400 file:text-white file:cursor-not-allowed')}
                  />
                </div>
              )

            case 'image':
              return (
                <div className="relative">
                  <input
                    {...commonProps}
                    type="file"
                    accept="image/*"
                    className={cn(commonProps.className, 'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-400 file:text-white file:cursor-not-allowed')}
                  />
                </div>
              )

            case 'email':
              return (
                <input
                  {...commonProps}
                  type="email"
                />
              )

            case 'number':
              return (
                <input
                  {...commonProps}
                  type="number"
                />
              )

            default: // input
              return (
                <input
                  {...commonProps}
                  type="text"
                />
              )
          }
        })()}

        {help && (
          <p className="text-xs text-gray-500 mt-1">{help}</p>
        )}
      </div>
    )
  }


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
          {/* Form Header */}

          {/* Form */}
          <form
            className="form-control relative mt-4"
            onSubmit={handlePreventSubmit}
          >
            <div className="grid gap-6 md:grid-cols-6">
              {form.fields?.map((field) => renderField(field))}
            </div>

            {/* Submit Button - Disabled for Preview */}
            <div className="col-span-6 mx-auto">
              <div className="form-control mt-6">
                <button
                  type="button"
                  disabled
                  className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-md opacity-50 cursor-not-allowed"
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </BlockContainer>
  )
}
