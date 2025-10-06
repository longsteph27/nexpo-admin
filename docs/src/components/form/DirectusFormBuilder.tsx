import { Form, useForm } from 'react-hook-form';
import { FormField } from '@/directus/types';
import { cn } from '@/lib/utils/tw';

interface DirectusFormBuilderProps {
  element: FormField;
  hookForm: any;
}

export default function DirectusFormBuilder({ element, hookForm }: DirectusFormBuilderProps) {
  console.log('DirectusFormBuilder - Received element:', element);
  console.log('DirectusFormBuilder - Hook form:', hookForm);

  if (!element?.name) {
    console.log('DirectusFormBuilder - No element name found');
    return null;
  }

  const { register } = hookForm;
  console.log('DirectusFormBuilder - Register function:', register);

  // Get the first translation for now (we can add language support later)
  const translation = element.translations?.[0];

  // Use only neutral or variable-based colors for styling
  const commonProps = {
    id: element.name,
    name: element.name,
    className: 'form-input w-full rounded-md px-4 py-4 bg-[var(--color-bg,theme(colors.white))] text-gray-900 border border-gray-300 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
    placeholder: translation?.placeholder || '',
    'aria-label': translation?.label || element.label || element.name,
    style: { borderColor: 'var(--color-border, #d1d5db)' },
  };

  console.log('DirectusFormBuilder - Common props:', commonProps);
  console.log('DirectusFormBuilder - Element type:', element.type);

  // Common validation rules
  const getValidationRules = () => {
    const rules: any = {
      required: element.validation?.includes('required') ? 'This field is required' : false
    };

    if (element.validation?.includes('email')) {
      rules.pattern = {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email address'
      };
    }

    return rules;
  };

  switch (element.$formkit || element.type) {
    case 'text':
    case 'input':
      console.log('DirectusFormBuilder - Rendering input field');
      return (
        <input 
          {...commonProps}
          type="text"
          {...register(element.name, getValidationRules())}
        />
      );

    case 'email':
      console.log('DirectusFormBuilder - Rendering email field');
      return (
        <input 
          {...commonProps}
          type="email"
          {...register(element.name, getValidationRules())}
        />
      );

    case 'number':
      console.log('DirectusFormBuilder - Rendering number field');
      return (
        <input 
          {...commonProps}
          type="number"
          {...register(element.name, {
            ...getValidationRules(),
            valueAsNumber: true
          })}
        />
      );

    case 'textarea':
      console.log('DirectusFormBuilder - Rendering textarea field');
      return (
        <textarea 
          {...commonProps}
          rows={5}
          {...register(element.name, getValidationRules())}
        />
      );

    case 'select':
      console.log('DirectusFormBuilder - Rendering select field with options:', element.options);
      return (
        <select 
          {...commonProps}
          {...register(element.name, getValidationRules())}
        >
          <option value="">Select an option</option>
          {element.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'multiselect':
      console.log('DirectusFormBuilder - Rendering multiselect field with options:', element.options);
      return (
        <div className="space-y-2">
          {element.options?.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                value={option.value}
                className="form-checkbox h-4 w-4 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
                {...register(element.name, {
                  ...getValidationRules(),
                  validate: (value: string[] | undefined) => {
                    if (element.validation?.includes('required') && (!value || value.length === 0)) {
                      return 'Please select at least one option';
                    }
                    return true;
                  }
                })}
              />
              <span className="text-gray-800">{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'file':
      console.log('DirectusFormBuilder - Rendering file field');
      return (
        <div className="relative">
          <input 
            {...commonProps}
            type="file"
            className={cn(commonProps.className, 'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary)]/90')}
            {...register(element.name, getValidationRules())}
          />
        </div>
      );

    case 'image':
      console.log('DirectusFormBuilder - Rendering image field');
      return (
        <div className="relative">
          <input 
            {...commonProps}
            type="file"
            accept="image/*"
            className={cn(commonProps.className, 'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary)]/90')}
            {...register(element.name, getValidationRules())}
          />
        </div>
      );

    default:
      console.log('DirectusFormBuilder - No matching field type found');
      return null;
  }
}