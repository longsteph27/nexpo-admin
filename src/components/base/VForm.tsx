'use client'

import { Forms, FormField } from '@/directus/types'
import { useState } from 'react'
import VAlert from '@/components/base/VAlert'
import directusApi from '@/directus/client'
import { createItem } from '@directus/sdk'
import { useForm } from 'react-hook-form'
import { ErrorMessage } from '@hookform/error-message'
import DirectusFormBuilder from '@/components/form/DirectusFormBuilder'
import { cn } from '@/lib/utils/tw'
import formTheme from '@/form.theme'
import { useRouter } from '@/lib/navigation'

interface FormProps {
  form: Forms
  className?: string
}

function transformSchema(schema: FormField[] = []) {
  return schema.map((item) => {
    const newItem = { ...item };
    // Map type to FormKit-compatible type
    if (newItem.type === 'input') {
      newItem.$formkit = 'text';
    } else {
      newItem.$formkit = newItem.type;
    }
    // Set outerclass based on width
    switch (newItem.width) {
      case '33':
        newItem.outerclass = 'md:col-span-2';
        break;
      case '50':
        newItem.outerclass = 'md:col-span-3';
        break;
      case '67':
        newItem.outerclass = 'md:col-span-4';
        break;
      case '100':
        newItem.outerclass = 'md:col-span-6';
        break;
      default:
        newItem.outerclass = 'md:col-span-6';
    }
    // Add validation rules
    if (newItem.validation) {
      newItem.validation = newItem.validation;
    }
    // For select fields, ensure options are formatted
    if (newItem.type === 'select' && newItem.options) {
      newItem.options = newItem.options.map((opt: { label: string; value: string }) => ({
        label: opt.label,
        value: opt.value,
      }));
    }
    return newItem;
  });
}

function VForm(props: FormProps) {
  const { form } = props
  console.log('VForm - Received form props:', props);

  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const schema = transformSchema(form.schema || [])
  console.log('VForm - Transformed schema:', schema);

  const hookForm = useForm<any>()
  console.log('VForm - Hook form instance:', hookForm);

  async function submitForm(data: any) {
    setLoading(true)
    try {
      // Transform data to answers array
      const answers = Object.entries(data).map(([field, value]) => ({
        field,
        value
      }));

      await directusApi.request(
        createItem('form_submissions', {
          
            answers,
          
          form: props.form.id,
        })
      )
      setSuccess(true)
      if (form.on_success === 'redirect' && form.redirect_url) {
        return router.push(form.redirect_url)
      }
    } catch (err) {
      setError(err as any)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      props.className,
      'max-w-4xl mx-auto bg-white border-2 border-[var(--color-primary)] rounded-[12px] shadow-md p-8'
    )}>
      <div className='mb-4'>
        {error && <VAlert type='error'>{(error as any)?.message || String(error)}</VAlert>}
        {form.on_success === 'message' && success && (
          <VAlert
            type='success'
            html={
              form.success_message ?? 'Success! Your form has been submitted.'
            }
          ></VAlert>
        )}
      </div>

      {!success && (
        <form className={formTheme.formClass} onSubmit={hookForm.handleSubmit(submitForm)}>
          <div className='grid gap-6 md:grid-cols-6'>
            {schema.map((element) => {
              console.log('VForm - Rendering schema element:', element);
              return (
                <div
                  key={`fields-${element.name}`}
                  className={cn(element.outerclass, 'w-full')}
                >
                  <label className='label' htmlFor={element.name}>
                    <span className='label-text text-gray-900'>{element.label}</span>
                  </label>
                  <DirectusFormBuilder element={element} hookForm={hookForm} />
                  <ErrorMessage
                    errors={hookForm.formState.errors}
                    name={element.name}
                    render={({ message }) => (
                      <VAlert type='error'>{message}</VAlert>
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className='col-span-6 mx-auto'>
            <div className='form-control mt-6'>
              <button className='bg-[var(--color-primary)] text-white px-4 py-2 rounded-md'>
                {loading && <span className='loading loading-spinner'></span>}
                {!loading && props.form.submit_label}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default VForm
