export type FieldOption = {
  value: string;
  label: string;
};

type SupportedLanguage = 'en-US' | 'vi-VN';

type RawFieldTranslation = {
  id?: string | number;
  languages_code: string;
  label?: string;
  placeholder?: string;
  help?: string;
  options?: string | null;
};

type RawField = {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown> | null;
  translations?: RawFieldTranslation[];
};

export type FieldTranslation = {
  id?: string | number;
  label?: string;
  placeholder?: string;
  help?: string;
  options?: FieldOption[];
};

export type FormFieldTranslations = {
  [languageCode: string]: FieldTranslation | undefined;
};

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
] as const;

// Field type definitions
export type FormField = {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: Record<string, unknown> | null;
  translations?: FormFieldTranslations;
};

export type FormLanguage = Record<SupportedLanguage, {
  id?: string;
  title?: string;
  submit_label?: string;
  success_message?: string;
}>;

export type FormSettings = {
  status?: string;
  on_success?: string;
  redirect_url?: string;
};

// Utility functions
export function getFieldIcon(type: string): string {
  const fieldType = CATALOG.find((item) => item.id === type);
  return fieldType?.icon || 'lucide:type';
}

export function getFieldLabel(type: string): string {
  const fieldType = CATALOG.find((item) => item.id === type);
  return fieldType?.label || 'Unknown';
}

export function parseFieldTranslations(field: RawField): FormField {
  const fieldTranslations = field.translations ?? [];
  const parseOptions = (optionsStr: string | null | undefined): FieldOption[] | undefined => {
    if (!optionsStr) return undefined;
    try {
      return JSON.parse(optionsStr) as FieldOption[];
    } catch {
      return undefined;
    }
  };

  const translations: FormFieldTranslations = {};
  fieldTranslations.forEach((translation) => {
    const options = parseOptions(translation.options);
    translations[translation.languages_code] = {
      id: translation.id,
      label: translation.label ?? '',
      placeholder: translation.placeholder ?? '',
      help: translation.help ?? '',
      options: options ?? [],
    };
  });

  return {
    id: field.id,
    name: field.name,
    type: field.type,
    width: field.width,
    sort: field.sort,
    is_required: field.is_required,
    validation: field.validation,
    conditions: field.conditions ?? null,
    translations,
  };
}

export type FieldTranslationPayload = {
  languages_code: { code: string };
  label: string;
  placeholder: string;
  help: string;
  options: string | null;
};

export type FieldTranslationUpdatePayload = FieldTranslationPayload & { id: string | number };

export type FieldTranslationsDiff = {
  create: FieldTranslationPayload[];
  update: FieldTranslationUpdatePayload[];
  delete: Array<string | number>;
};

export function processFieldTranslations(
  currentTranslations: FormFieldTranslations | undefined,
  originalTranslations: FormFieldTranslations = {},
): FieldTranslationsDiff {
  if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
    return { create: [], update: [], delete: [] };
  }

  const translationsPayload: FieldTranslationsDiff = {
    create: [],
    update: [],
    delete: [],
  };

  const languages: SupportedLanguage[] = ['en-US', 'vi-VN'];

  languages.forEach((lang) => {
    const current = currentTranslations[lang];
    const original = originalTranslations[lang];

    if (!current) {
      if (original?.id !== undefined) {
        translationsPayload.delete.push(original.id);
      }
      return;
    }

    const serializedOptions =
      current.options && current.options.length > 0 ? JSON.stringify(current.options) : null;

    const translationData: FieldTranslationPayload = {
      languages_code: { code: lang },
      label: current.label ?? '',
      placeholder: current.placeholder ?? '',
      help: current.help ?? '',
      options: serializedOptions,
    };

    if (original?.id !== undefined) {
      translationsPayload.update.push({ id: original.id, ...translationData });
    } else {
      translationsPayload.create.push(translationData);
    }
  });

  return translationsPayload;
}

export function areFieldsEqual(field1: FormField | undefined, field2: FormField | undefined): boolean {
  if (!field1 || !field2) return false;

  const basicFieldsEqual =
    field1.name === field2.name &&
    field1.type === field2.type &&
    field1.width === field2.width &&
    field1.sort === field2.sort &&
    field1.is_required === field2.is_required &&
    field1.validation === field2.validation &&
    JSON.stringify(field1.conditions ?? null) === JSON.stringify(field2.conditions ?? null);

  const translationsEqual = JSON.stringify(field1.translations ?? {}) === JSON.stringify(field2.translations ?? {});

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

export interface FieldPayload {
  name: string;
  type: string;
  width: string;
  sort: number;
  is_required: boolean;
  validation: string;
  conditions: Record<string, unknown> | null;
  is_group_field?: boolean;
  event_id: number;
  tenant_id: number;
  translations: {
    create: FieldTranslationPayload[];
    update: FieldTranslationUpdatePayload[];
    delete: Array<string | number>;
  };
}

// Create field payload for API
export function createFieldPayload(
  fieldName: string,
  type: string,
  sort: number,
  eventId: string,
  tenantId: number,
  label: string
): FieldPayload {
  return {
    name: fieldName,
    type,
    width: 'full',
    sort,
    is_required: false,
    validation: '',
    conditions: null,
    event_id: Number(eventId),
    tenant_id: Number(tenantId),
    translations: {
      create: [
        {
          languages_code: { code: 'en-US' },
          label,
          placeholder: '',
          help: '',
          options: '[]',
        },
        {
          languages_code: { code: 'vi-VN' },
          label,
          placeholder: '',
          help: '',
          options: '[]',
        },
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
    conditions: null,
    width: 'full',
    translations: {
      'en-US': {
        id: `${id}_en`,
        label,
        placeholder: '',
        help: '',
        options: [],
      },
      'vi-VN': {
        id: `${id}_vi`,
        label,
        placeholder: '',
        help: '',
        options: [],
      },
    },
  };
}
