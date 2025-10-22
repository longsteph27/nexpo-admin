import { Icon } from '@iconify/react';

// Catalog of available field types
export const CATALOG = [
  { id: 'input', label: 'Input', icon: 'lucide:type' },
  { id: 'textarea', label: 'Textarea', icon: 'lucide:align-left' },
  { id: 'email', label: 'Email', icon: 'lucide:mail' },
  { id: 'number', label: 'Number', icon: 'lucide:hash' },
  { id: 'select', label: 'Select', icon: 'lucide:chevron-down' },
  { id: 'multiselect', label: 'Multi Select', icon: 'lucide:list' },
  { id: 'file', label: 'File', icon: 'lucide:paperclip' },
  { id: 'image', label: 'Image', icon: 'lucide:image' },
];

// Field type definitions
export type FormField = {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown>;
  translations?: {
    'en-US'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
    'vi-VN'?: { label?: string; placeholder?: string; help?: string; options?: { value: string; label: string }[] };
  };
};

export type FormLanguage = {
  'en-US': { id?: string; title?: string; submit_label?: string; success_message?: string };
  'vi-VN': { id?: string; title?: string; submit_label?: string; success_message?: string };
};

export type FormSettings = {
  status?: string;
  on_success?: string;
  redirect_url?: string;
};

// Utility functions
export function getFieldIcon(type: string): string {
  const fieldType = CATALOG.find(item => item.id === type);
  return fieldType?.icon || 'lucide:type';
}

export function getFieldLabel(type: string): string {
  const fieldType = CATALOG.find(item => item.id === type);
  return fieldType?.label || 'Unknown';
}

export function parseFieldTranslations(field: unknown) {
  const f = field as { 
    id: string; 
    name?: string; 
    type?: string; 
    width?: string; 
    sort?: number; 
    is_required?: boolean; 
    validation?: string; 
    conditions?: any; 
    translations?: Array<{ 
      id?: string; 
      languages_code: string; 
      label?: string; 
      placeholder?: string; 
      help?: string; 
      options?: string | null 
    }> 
  };
  
  const fieldTranslations = f.translations || [];
  const enFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'en-US');
  const viFieldTranslation = fieldTranslations.find((t: { languages_code: string }) => t.languages_code === 'vi-VN');

  // Parse options if they exist
  const parseOptions = (optionsStr: string | null) => {
    if (!optionsStr) return undefined;
    try {
      return JSON.parse(optionsStr);
    } catch {
      return undefined;
    }
  };

  return {
    id: f.id,
    name: f.name,
    type: f.type,
    width: f.width,
    sort: f.sort,
    is_required: f.is_required,
    validation: f.validation,
    conditions: f.conditions,
    translations: {
      'en-US': {
        id: enFieldTranslation?.id,
        label: enFieldTranslation?.label || '',
        placeholder: enFieldTranslation?.placeholder || '',
        help: enFieldTranslation?.help || '',
        options: parseOptions(enFieldTranslation?.options || null)
      },
      'vi-VN': {
        id: viFieldTranslation?.id,
        label: viFieldTranslation?.label || '',
        placeholder: viFieldTranslation?.placeholder || '',
        help: viFieldTranslation?.help || '',
        options: parseOptions(viFieldTranslation?.options || null)
      },
    }
  };
}

export function processFieldTranslations(currentTranslations: any, originalTranslations: any = {}) {
  if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
    return {
      create: [],
      update: [],
      delete: [],
    };
  }

  const translationsPayload: any = {
    create: [] as any[],
    update: [] as any[],
    delete: [] as string[]
  };

  const languages = ['en-US', 'vi-VN'];

  for (const lang of languages) {
    const current = currentTranslations[lang];
    const original = originalTranslations[lang];

    if (current) {
      // Convert object format to array format for API
      const translationData = {
        languages_code: { code: lang },
        label: current.label || '',
        placeholder: current.placeholder || '',
        help: current.help || '',
        options: current.options || []
      };

      if (original && original.id) {
        // Update existing translation
        translationsPayload.update.push({
          id: original.id,
          ...translationData
        });
      } else {
        // Create new translation
        translationsPayload.create.push(translationData);
      }
    }
  }

  return translationsPayload;
}

export function areFieldsEqual(field1: any, field2: any) {
  if (!field1 || !field2) return false;

  // Compare basic fields
  const basicFieldsEqual = (
    field1.name === field2.name &&
    field1.type === field2.type &&
    field1.width === field2.width &&
    field1.sort === field2.sort &&
    field1.is_required === field2.is_required &&
    field1.validation === field2.validation &&
    JSON.stringify(field1.conditions || null) === JSON.stringify(field2.conditions || null)
  );

  // Compare translations deeply
  const translationsEqual = JSON.stringify(field1.translations || {}) === JSON.stringify(field2.translations || {});

  return basicFieldsEqual && translationsEqual;
}

// Generate unique field name
export function generateFieldName(type: string): string {
  return `${type}_${Date.now()}`;
}

// Generate unique field ID
export function generateFieldId(): string {
  return crypto.randomUUID();
}

// Create field payload for API
export function createFieldPayload(
  fieldName: string,
  type: string,
  sort: number,
  eventId: string,
  tenantId: number,
  label: string
) {
  return {
    name: fieldName,
    type: type,
    width: 'full',
    sort: sort,
    is_required: false,
    validation: '',
    conditions: null as any,
    event_id: Number(eventId),
    tenant_id: Number(tenantId),
    translations: {
      create: [
        {
          languages_code: { code: 'en-US' },
          label: label,
          placeholder: '',
          help: '',
          options: []
        },
        {
          languages_code: { code: 'vi-VN' },
          label: label,
          placeholder: '',
          help: '',
          options: []
        }
      ],
      update: [],
      delete: [],
    },
  };
}

// Create field object for UI
export function createFieldObject(
  id: string,
  fieldName: string,
  type: string,
  sort: number,
  label: string
): FormField {
  return {
    id,
    name: fieldName,
    type,
    sort,
    is_required: false,
    validation: '',
    conditions: null as any,
    width: 'full',
    translations: {
      'en-US': {
        id: `${id}_en`,
        label: label,
        placeholder: '',
        help: '',
        options: []
      },
      'vi-VN': {
        id: `${id}_vi`,
        label: label,
        placeholder: '',
        help: '',
        options: []
      }
    },
  };
}
