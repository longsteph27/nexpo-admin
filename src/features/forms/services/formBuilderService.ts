import type {
  Form,
  FormTranslation,
  FormFieldTranslation,
  BuilderFormField,
  BuilderFormLanguage,
  BuilderFormSettings,
  FormPayload,
} from '../types';
import type {
  FieldPayload,
  FieldTranslationsDiff,
  FormFieldTranslations,
} from '../utils/formBuilderUtils';
import {
  createFieldPayload,
  processFieldTranslations,
  areFieldsEqual,
} from '../utils/formBuilderUtils';

type SupportedLanguage = 'en-US' | 'vi-VN';
type BuilderTranslationMap = NonNullable<BuilderFormField['translations']>;

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en-US', 'vi-VN'];

export interface FormBuilderOriginalState {
  fields: BuilderFormField[];
  formTranslations: FormTranslation[];
}

export interface ParsedFormBuilderData {
  fields: BuilderFormField[];
  formLang: BuilderFormLanguage;
  formSettings: BuilderFormSettings;
  originalFields: BuilderFormField[];
  originalFormTranslations: FormTranslation[];
}

const normalizeString = (value?: string | null) => value ?? '';

const cloneTranslations = (translations?: BuilderFormField['translations']): BuilderFormField['translations'] => {
  if (!translations) return undefined;
  return SUPPORTED_LANGUAGES.reduce<BuilderTranslationMap>((acc, lang) => {
    const source = translations[lang];
    if (!source) return acc;
    acc[lang] = {
      id: source.id,
      label: source.label ?? '',
      placeholder: source.placeholder ?? '',
      help: source.help ?? '',
      options: source.options ? source.options.map((opt) => ({ ...opt })) : [],
    };
    return acc;
  }, {} as BuilderTranslationMap);
};

const cloneField = (field: BuilderFormField): BuilderFormField => ({
  ...field,
  translations: cloneTranslations(field.translations),
});

const parseFieldOptions = (options?: unknown): { value: string; label: string }[] | undefined => {
  if (!options) {
    return undefined;
  }

  if (Array.isArray(options)) {
    return options as { value: string; label: string }[];
  }

  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const buildFieldTranslations = (
  translations?: Array<{
    id?: string | number;
    languages_code: string;
    label?: string;
    placeholder?: string;
    help?: string;
    options?: unknown;
  }>
): BuilderFormField['translations'] => {
  if (!translations) return undefined;

  return translations.reduce<BuilderTranslationMap>((acc, translation) => {
    if (translation.languages_code !== 'en-US' && translation.languages_code !== 'vi-VN') {
      return acc;
    }

    acc[translation.languages_code] = {
      id: translation.id,
      label: translation.label ?? '',
      placeholder: translation.placeholder ?? '',
      help: translation.help ?? '',
      options: parseFieldOptions(translation.options) ?? [],
    };

    return acc;
  }, {} as BuilderTranslationMap);
};

const mapFieldFromApi = (field: NonNullable<Form['fields']>[number]): BuilderFormField => ({
  id: String(field.id),
  name: field.name,
  type: field.type,
  width: field.width,
  sort: field.sort,
  is_required: field.is_required,
  validation: field.validation ?? '',
  conditions: field.conditions ?? null,
  is_group_field: field.is_group_field ?? false,
  use_for_matching: (field as any).use_for_matching ?? false,
  matching_attribute: (field as any).matching_attribute ?? null,
  translations: buildFieldTranslations(field.translations),
});

const buildInitialFormLanguage = (translations: FormTranslation[] = []): BuilderFormLanguage => {
  const formLang: BuilderFormLanguage = { 'en-US': {}, 'vi-VN': {} };

  translations.forEach((translation) => {
    if (translation.languages_code === 'en-US' || translation.languages_code === 'vi-VN') {
      formLang[translation.languages_code] = {
        id: translation.id?.toString(),
        title: translation.title ?? '',
        submit_label: translation.submit_label ?? '',
        success_message: translation.success_message ?? '',
      };
    }
  });

  return formLang;
};

const normalizeBuilderSettings = (form?: Form | null): BuilderFormSettings => ({
  status: form?.status,
  on_success: form?.on_success,
  redirect_url: form?.redirect_url ?? undefined,
  is_allow_group: form?.is_allow_group ?? false,
  template_email_group: form?.template_email_group ?? undefined,
  form_purpose: (form as any)?.form_purpose ?? [],
  is_registration: (form as any)?.is_registration ?? false,
  linked_module: (form as any)?.linked_module ?? undefined,
  is_insight_gate: (form as any)?.is_insight_gate ?? false,
  insight_gate_message: (form as any)?.insight_gate_message ?? undefined,
});

export function parseFormBuilderData(form?: Form | null): ParsedFormBuilderData {
  if (!form) {
    return {
      fields: [],
      formLang: { 'en-US': {}, 'vi-VN': {} },
      formSettings: {},
      originalFields: [],
      originalFormTranslations: [],
    };
  }

  const parsedFields = (form.fields ?? []).map(mapFieldFromApi);

  return {
    fields: parsedFields,
    formLang: buildInitialFormLanguage(form.translations ?? []),
    formSettings: normalizeBuilderSettings(form),
    originalFields: parsedFields.map(cloneField),
    originalFormTranslations: form.translations ?? [],
  };
}

interface BuildFormTranslationDiffArgs {
  current: BuilderFormLanguage;
  original: FormTranslation[];
}

const buildFormTranslationDiff = ({
  current,
  original,
}: BuildFormTranslationDiffArgs): NonNullable<FormPayload['translations']> => {
  const createList: NonNullable<FormPayload['translations']>['create'] = [];
  const updateList: NonNullable<FormPayload['translations']>['update'] = [];
  const deleteList: NonNullable<FormPayload['translations']>['delete'] = [];

  SUPPORTED_LANGUAGES.forEach((lang) => {
    const currentTranslation = current[lang];
    const originalTranslation = original.find((t) => t.languages_code === lang);

    const normalized = {
      title: normalizeString(currentTranslation?.title),
      submit_label: normalizeString(currentTranslation?.submit_label),
      success_message: normalizeString(currentTranslation?.success_message),
    };

    if (originalTranslation) {
      const hasChanges =
        normalized.title !== normalizeString(originalTranslation.title) ||
        normalized.submit_label !== normalizeString(originalTranslation.submit_label) ||
        normalized.success_message !== normalizeString(originalTranslation.success_message);

      if (hasChanges && updateList) {
        updateList.push({
          id: originalTranslation.id as string | number,
          title: normalized.title,
          submit_label: normalized.submit_label,
          success_message: normalized.success_message,
        });
      }

      const currentHasContent =
        normalized.title.length > 0 ||
        normalized.submit_label.length > 0 ||
        normalized.success_message.length > 0;

      if (!currentHasContent && deleteList) {
        deleteList.push(originalTranslation.id as string | number);
      }
      return;
    }

    const hasContent =
      normalized.title.length > 0 ||
      normalized.submit_label.length > 0 ||
      normalized.success_message.length > 0;

    if (hasContent && createList) {
      createList.push({
        languages_code: { code: lang },
        title: normalized.title,
        submit_label: normalized.submit_label,
        success_message: normalized.success_message,
      });
    }
  });

  return {
    create: createList,
    update: updateList,
    delete: deleteList,
  };
};

const buildTranslationPayloadsFromBuilder = (
  translations?: BuilderFormField['translations']
): FieldTranslationsDiff['create'] => {
  return SUPPORTED_LANGUAGES.map((lang) => {
    const data = translations?.[lang];
    const serializedOptions =
      data?.options && data.options.length > 0 ? JSON.stringify(data.options) : null;
    return {
      languages_code: { code: lang },
      label: data?.label ?? '',
      placeholder: data?.placeholder ?? '',
      help: data?.help ?? '',
      options: serializedOptions,
    };
  });
};

const buildFieldBasePayload = (
  field: BuilderFormField,
  eventId: string,
  tenantId: number
) => ({
  name: field.name ?? `${field.type ?? 'input'}_${Date.now()}`,
  type: field.type ?? 'input',
  width: field.width ?? 'full',
  sort: field.sort ?? 0,
  is_required: field.is_required ?? false,
  validation: field.validation ?? '',
  conditions: field.conditions ?? null,
  is_group_field: field.is_group_field ?? false,
  use_for_matching: field.use_for_matching ?? false,
  matching_attribute: field.matching_attribute ?? null,
  event_id: Number(eventId),
  tenant_id: tenantId,
});

interface BuildFieldDiffArgs {
  fields: BuilderFormField[];
  originalFields: BuilderFormField[];
  eventId: string;
  tenantId: number;
}

interface FieldDiffResult {
  create: FieldPayload[];
  update: Array<FieldPayload & { id: string }>;
  delete: string[];
}

const toRecordArray = <T extends object>(items: T[]): Record<string, unknown>[] =>
  items.map((item) => ({ ...item } as Record<string, unknown>));

const buildFieldDiff = ({
  fields,
  originalFields,
  eventId,
  tenantId,
}: BuildFieldDiffArgs): FieldDiffResult => {
  const result: FieldDiffResult = {
    create: [],
    update: [],
    delete: [],
  };

  const originalMap = new Map<string, BuilderFormField>();
  originalFields.forEach((field) => originalMap.set(field.id, field));

  fields.forEach((field) => {
    const base = buildFieldBasePayload(field, eventId, tenantId);
    const original = originalMap.get(field.id);

    if (!original) {
      const payload = createFieldPayload(
        base.name,
        base.type,
        base.sort,
        eventId,
        tenantId,
        field.translations?.['en-US']?.label ?? 'Field'
      );

      payload.width = base.width;
      payload.is_required = base.is_required;
      payload.validation = base.validation;
      payload.conditions = base.conditions;
      payload.is_group_field = base.is_group_field;
      payload.translations.create = buildTranslationPayloadsFromBuilder(field.translations);

      result.create.push(payload);
      return;
    }

    if (areFieldsEqual(field, original)) {
      return;
    }

    const translationsDiff = processFieldTranslations(
      (field.translations || {}) as FormFieldTranslations,
      (original.translations || {}) as FormFieldTranslations
    );

    result.update.push({
      id: field.id,
      ...base,
      translations: translationsDiff,
    });
  });

  const currentIds = new Set(fields.map((field) => field.id));
  originalFields.forEach((field) => {
    if (!currentIds.has(field.id)) {
      result.delete.push(field.id);
    }
  });

  return result;
};

interface BuildFormSavePayloadArgs {
  eventId: string;
  tenantId: number;
  formLang: BuilderFormLanguage;
  formSettings: BuilderFormSettings;
  fields: BuilderFormField[];
  originalFields: BuilderFormField[];
  originalFormTranslations: FormTranslation[];
}

export function buildFormSavePayload({
  eventId,
  tenantId,
  formLang,
  formSettings,
  fields,
  originalFields,
  originalFormTranslations,
}: BuildFormSavePayloadArgs): FormPayload {
  const translationsDiff = buildFormTranslationDiff({
    current: formLang,
    original: originalFormTranslations,
  });

  const fieldDiff = buildFieldDiff({
    fields,
    originalFields,
    eventId,
    tenantId,
  });

  const shouldUseRedirect = formSettings.on_success === 'redirect';

  return {
    status: (formSettings.status as FormPayload['status']) ?? 'draft',
    on_success: (formSettings.on_success as FormPayload['on_success']) ?? 'message',
    redirect_url: shouldUseRedirect ? formSettings.redirect_url || undefined : undefined,
    template_email_group: formSettings.template_email_group || undefined,
    is_allow_group: formSettings.is_allow_group ?? false,
    form_purpose: formSettings.form_purpose ?? [],
    is_registration: formSettings.is_registration ?? false,
    linked_module: formSettings.linked_module ?? null,
    is_insight_gate: formSettings.is_insight_gate ?? false,
    insight_gate_message: formSettings.insight_gate_message ?? null,
    event_id: Number(eventId),
    tenant_id: Number(tenantId),
    translations: translationsDiff,
    fields: {
      create: toRecordArray(fieldDiff.create),
      update: toRecordArray(fieldDiff.update),
      delete: fieldDiff.delete,
    },
  };
}

type EmbedFieldTranslation = {
  language: string;
  label: string;
  placeholder: string;
  help: string;
  options: Array<{ label: string; value: string }>;
};

type EmbedFieldDefinition = {
  id: string;
  name?: string;
  type: string;
  is_required: boolean;
  width: string;
  sort: number;
  translations: EmbedFieldTranslation[];
};

type EmbedFormDefinition = {
  id: string;
  translations: Array<{
    language: string;
    title: string;
    submit_label: string;
    success_message: string;
  }>;
  fields: EmbedFieldDefinition[];
  settings: {
    on_success?: 'redirect' | 'message';
    redirect_url?: string | null;
  };
};

const resolveLanguageCode = (value: FormTranslation['languages_code'] | FormFieldTranslation['languages_code']): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'code' in value) {
    return String((value as { code?: string }).code ?? 'en-US');
  }
  return 'en-US';
};

const parseTranslationOptionsForEmbed = (
  options?: FormFieldTranslation['options']
): Array<{ label: string; value: string }> => {
  if (!options) return [];
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(options)) {
    return options.map((opt) => ({
      label: opt.label ?? opt.value ?? '',
      value: opt.value ?? opt.label ?? '',
    }));
  }
  return [];
};

const buildEmbedFieldDefinition = (field: NonNullable<Form['fields']>[number]): EmbedFieldDefinition => ({
  id: field.id,
  name: field.name,
  type: field.type ?? 'input',
  is_required: !!field.is_required,
  width: field.width ?? 'full',
  sort: field.sort ?? 0,
  translations: (field.translations ?? []).map((translation) => ({
    language: resolveLanguageCode(translation.languages_code),
    label: translation.label ?? '',
    placeholder: translation.placeholder ?? '',
    help: translation.help ?? '',
    options: parseTranslationOptionsForEmbed(translation.options),
  })),
});

const buildEmbedFormDefinition = (form: Form): EmbedFormDefinition => ({
  id: form.id,
  translations: (form.translations ?? []).map((translation) => ({
    language: resolveLanguageCode(translation.languages_code),
    title: translation.title ?? '',
    submit_label: translation.submit_label ?? 'Submit',
    success_message: translation.success_message ?? 'Thank you for your submission!',
  })),
  fields: (form.fields ?? []).map(buildEmbedFieldDefinition),
  settings: {
    on_success: form.on_success ?? 'message',
    redirect_url: form.redirect_url ?? null,
  },
});

const escapeScriptTags = (value: string) => value.replace(/<\/script/gi, '<\\/script');

export function buildFormEmbedScriptSnippet(
  form: Form | null,
  options?: { directusUrl?: string }
) {
  if (!form) return null;

  const directusUrl = options?.directusUrl ?? 'https://app.nexpo.vn';

  const formDefinition = buildEmbedFormDefinition(form);
  const serializedForm = JSON.stringify(formDefinition).replace(/</g, '\\u003c');

  const scriptBody = String.raw`(function(){
    var DIRECTUS_URL='${directusUrl}';
    var FORM_DATA=${serializedForm};
    var CURRENT_LANG=(navigator.language||'en-US').toLowerCase().indexOf('vi')>-1?'vi-VN':'en-US';
    var scriptEl=document.currentScript;
    var mount=document.createElement('div');
    mount.className='nexpo-form-wrapper';
    if(scriptEl&&scriptEl.parentNode){scriptEl.parentNode.insertBefore(mount,scriptEl);}else{document.body.appendChild(mount);}
    if(!document.getElementById('nexpo-form-styles')){
      var style=document.createElement('style');
      style.id='nexpo-form-styles';
      style.textContent='.nexpo-form-wrapper{font-family:Inter,system-ui,sans-serif;margin:1rem 0;padding:1.5rem;border:1px solid #e5e7eb;border-radius:0.75rem;background:#fff;box-shadow:0 10px 25px rgba(15,23,42,0.06);} .nexpo-form h3{margin-bottom:1rem;font-size:1.25rem;color:#0f172a;} .nexpo-field{display:flex;flex-direction:column;gap:0.25rem;margin-bottom:1rem;} .nexpo-field-label{font-weight:600;color:#0f172a;font-size:0.9rem;} .nexpo-field-input{width:100%;border:1px solid #cbd5f5;border-radius:0.5rem;padding:0.65rem 0.75rem;font-size:0.95rem;} .nexpo-field-input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.15);} .nexpo-field-help{font-size:0.8rem;color:#64748b;margin:0;} .nexpo-form-submit{background:#2563eb;color:#fff;font-weight:600;border:0;border-radius:999px;padding:0.65rem 1.5rem;cursor:pointer;transition:opacity 0.2s;} .nexpo-form-submit:disabled{opacity:0.6;cursor:not-allowed;} .nexpo-form-message{font-size:0.9rem;margin-bottom:0.5rem;color:#16a34a;}';
      document.head.appendChild(style);
    }

    function getTranslation(items,lang,defaults){
      if(!items||!items.length){return defaults||null;}
      return items.find(function(item){return item.language===lang;})||items.find(function(item){return item.language==='en-US';})||items[0]||defaults||null;
    }

    function sanitizeMessage(html){
      var temp=document.createElement('div');
      temp.innerHTML=html || '';
      return (temp.textContent || '').trim();
    }

    function renderField(field,lang){
      var t=getTranslation(field.translations,lang,{label:field.name||'Field',placeholder:'',help:'',options:[]});
      var wrapper=document.createElement('div');
      wrapper.className='nexpo-field';
      var label=document.createElement('label');
      label.className='nexpo-field-label';
      label.textContent=t.label||field.name||'Field';
      if(field.is_required){
        var mark=document.createElement('span');
        mark.textContent=' *';
        mark.style.color='#dc2626';
        label.appendChild(mark);
      }
      wrapper.appendChild(label);

      var input;
      switch(field.type){
        case 'textarea':
          input=document.createElement('textarea');
          input.rows=4;
          break;
        case 'select':
        case 'multiselect':
          input=document.createElement('select');
          if(field.type==='multiselect'){ input.multiple=true; }
          (t.options||[]).forEach(function(opt){
            var option=document.createElement('option');
            option.value=opt.value||opt.label||'';
            option.textContent=opt.label||opt.value||'';
            input.appendChild(option);
          });
          break;
        default:
          input=document.createElement('input');
          if(field.type==='email'){ input.type='email'; }
          else if(field.type==='number'){ input.type='number'; }
          else { input.type='text'; }
          break;
      }

      input.dataset.field=field.id;
      input.placeholder=t.placeholder||'';
      input.required=!!field.is_required;
      input.className='nexpo-field-input';
      wrapper.appendChild(input);

      if(t.help){
        var help=document.createElement('p');
        help.className='nexpo-field-help';
        help.textContent=t.help;
        wrapper.appendChild(help);
      }

      return wrapper;
    }

    function serializeAnswers(formEl){
      var answers=[];
      FORM_DATA.fields.forEach(function(field){
        var input=formEl.querySelector('[data-field="'+field.id+'"]');
        if(!input)return;
        var value;
        if(field.type==='multiselect'){
          value=Array.from(input.selectedOptions).map(function(opt){return opt.value;});
        }else{
          value=input.value;
        }
        if(Array.isArray(value)){
          value=JSON.stringify(value);
        }
        answers.push({field:field.id,value:value||''});
      });
      return answers;
    }

    function submitAnswers(answers){
      var payload={form:FORM_DATA.id,answers:answers};
      return fetch(DIRECTUS_URL+'/items/form_submissions?return=representation',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      }).then(function(res){
        if(!res.ok){
          return res.json().then(function(body){
            var message=(body&&body.errors&&body.errors.length&&body.errors[0].message)||'Failed to submit form';
            throw new Error(message);
          });
        }
        return res.json();
      });
    }

    function render(){
      var translation=getTranslation(FORM_DATA.translations,CURRENT_LANG,{title:'',submit_label:'Submit',success_message:'Thank you!'});
      var form=document.createElement('form');
      form.className='nexpo-form';
      if(translation && translation.title){
        var title=document.createElement('h3');
        title.textContent=translation.title;
        form.appendChild(title);
      }

      FORM_DATA.fields.slice().sort(function(a,b){return a.sort-b.sort;}).forEach(function(field){
        form.appendChild(renderField(field,CURRENT_LANG));
      });

      var message=document.createElement('div');
      message.className='nexpo-form-message';
      form.appendChild(message);

      var button=document.createElement('button');
      button.type='submit';
      button.textContent=(translation && translation.submit_label) || 'Submit';
      button.className='nexpo-form-submit';
      form.appendChild(button);

      form.addEventListener('submit',function(event){
        event.preventDefault();
        button.disabled=true;
        message.style.color='#16a34a';
        message.textContent='Submitting...';
        submitAnswers(serializeAnswers(form)).then(function(){
          if(FORM_DATA.settings && FORM_DATA.settings.on_success==='redirect' && FORM_DATA.settings.redirect_url){
            window.location.href = FORM_DATA.settings.redirect_url;
            return;
          }
          message.style.color='#16a34a';
          var successText=sanitizeMessage((translation && translation.success_message) || 'Thank you!');
          message.textContent=successText || 'Thank you!';
          form.reset();
        }).catch(function(error){
          message.style.color='#dc2626';
          message.textContent=error.message || 'Something went wrong.';
        }).finally(function(){
          button.disabled=false;
        });
      });

      mount.innerHTML='';
      mount.appendChild(form);
    }

    render();
  })();`;
  return `<script>${escapeScriptTags(scriptBody)}</script>`;


}


