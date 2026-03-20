import type { LanguageCode } from '@/types/directus-collections';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldTranslation {
  id?: string;
  languages_code: LanguageCode | string;
  label?: string;
  placeholder?: string;
  help?: string;
  options?: FormFieldOption[] | string | null;
}

export type FieldConditionOperator =
  | '_eq' | '_neq' | '_contains'
  | '_gt' | '_gte' | '_lt' | '_lte'
  | '_in' | '_nin';

export type FieldConditionAction =
  | 'show' | 'hide'
  | 'required' | 'optional'
  | 'readonly'
  | 'set_options' | 'set_value';

export interface FieldCondition {
  source_field_id: string;
  operator: FieldConditionOperator;
  value: string;
  action: FieldConditionAction;
  extra_value?: string;
  extra_options?: { label: string; value: string }[] | null;
}

export type MatchingAttribute =
  | 'skills'
  | 'experience_level'
  | 'desired_role'
  | 'availability'
  | 'location'
  | 'education'
  | 'other';

export interface FormField {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string | null;
  conditions?: FieldCondition[] | null;
  is_group_field?: boolean;
  use_for_matching?: boolean;
  matching_attribute?: MatchingAttribute | null;
  translations?: FormFieldTranslation[];
}

export interface FormTranslation {
  id?: string | number;
  languages_code: LanguageCode | string;
  title?: string | null;
  submit_label?: string | null;
  success_message?: string | null;
}

export interface FormSubmissionSummary {
  id: string;
}

export interface Form {
  id: string;
  status: 'draft' | 'published' | 'archived';
  event_id?: number;
  tenant_id?: number;
  on_success?: 'redirect' | 'message';
  redirect_url?: string | null;
  is_registration?: boolean;
  is_allow_group?: boolean;
  template_email?: string | null;
  template_email_group?: string | null;
  qr_code_field?: string | null;
  email_sender_name?: string | null;
  email_subject?: string | null;
  form_purpose?: string[];
  date_created?: string | null;
  date_updated?: string | null;
  translations?: FormTranslation[];
  fields?: FormField[];
  submissions?: FormSubmissionSummary[];
  updated_at_using_changes?: boolean;
}

export interface FormSummary extends Pick<Form, 'id' | 'status' | 'is_registration' | 'form_purpose' | 'date_created' | 'date_updated'> {
  translations?: FormTranslation[];
  fields?: Array<{ id: string }>;
  submissions?: Array<{ id: string }>;
}

export interface FormPayload {
  id?: string;
  status?: 'draft' | 'published' | 'archived';
  on_success?: 'redirect' | 'message';
  redirect_url?: string | null;
  is_allow_group?: boolean;
  template_email_group?: string | null;
  event_id: number;
  tenant_id: number;
  translations?: {
    create?: Array<{
      languages_code: { code: LanguageCode | string };
      title?: string;
      submit_label?: string;
      success_message?: string;
    }>;
    update?: Array<{
      id: string | number;
      title?: string;
      submit_label?: string;
      success_message?: string;
    }>;
    delete?: Array<string | number>;
  };
  fields?: {
    create?: Array<Record<string, unknown>>;
    update?: Array<Record<string, unknown>>;
    delete?: string[];
  };
}

export type BuilderFormLanguage = Record<
  'en-US' | 'vi-VN',
  {
    id?: string;
    title?: string;
    submit_label?: string;
    success_message?: string;
  }
>;

import type { FieldPayload } from '../utils/formBuilderUtils';

export interface BuilderFormField {
  id: string;
  name?: string;
  type?: string;
  width?: string;
  sort?: number;
  is_required?: boolean;
  validation?: string;
  conditions?: FieldCondition[] | null;
  is_group_field?: boolean;
  use_for_matching?: boolean;
  matching_attribute?: MatchingAttribute | null;
  translations?: {
    'en-US'?: { id?: string | number; label?: string; placeholder?: string; help?: string; options?: FormFieldOption[] };
    'vi-VN'?: { id?: string | number; label?: string; placeholder?: string; help?: string; options?: FormFieldOption[] };
  };
  _payload?: FieldPayload;
}

export interface BuilderFormSettings {
  status?: string;
  on_success?: string;
  redirect_url?: string;
  is_allow_group?: boolean;
  template_email_group?: string;
  form_purpose?: string[];
  is_registration?: boolean;
  linked_module?: string;
  is_insight_gate?: boolean;
  insight_gate_message?: string;
}
