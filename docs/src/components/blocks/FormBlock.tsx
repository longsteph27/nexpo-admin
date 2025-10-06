import VForm from '@/components/base/VForm'
import { Forms } from '@/directus/types'
import BlockContainer from '@/components/BlockContainer'
import TypographyTitle from '@/components/typography/TypographyTitle'
import TypographyHeadline from '@/components/typography/TypographyHeadline'

interface FormBlockProps {
  title?: string
  headline?: string
  form: Forms
  translations?: {
    languages_code: string
    title?: string
    headline?: string
  }[]
  id: string
}

interface FormBlockComponentProps {
  data: FormBlockProps
  lang: string
}

const FormBlock = ({ data, lang }: FormBlockComponentProps) => {
  console.log('FormBlock - Initial data:', data);
  console.log('FormBlock - Language:', lang);

  if (!data || !data.form) {
    console.log('FormBlock - No data or form found');
    return null;
  }

  // Map language code to match Directus format
  // This mapping can be extended for more languages
  const getDirectusLangCode = (lang: string): string => {
    // Default mapping for common languages
    const langMap: Record<string, string> = {
      'vi': 'vi-VN',
      'en': 'en-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'es': 'es-ES',
      'it': 'it-IT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'th': 'th-TH',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'tr': 'tr-TR',
      'nl': 'nl-NL',
      'pl': 'pl-PL',
      'uk': 'uk-UA',
    };

    // If we have a mapping, use it
    if (langMap[lang]) {
      return langMap[lang];
    }

    // If no mapping exists, try to find a translation that starts with the language code
    const availableTranslations = data.form.translations || [];
    const matchingTranslation = availableTranslations.find(t => 
      t.languages_code.toLowerCase().startsWith(lang.toLowerCase() + '-')
    );

    // If we found a matching translation, use its language code
    if (matchingTranslation) {
      return matchingTranslation.languages_code;
    }

    // If no mapping or matching translation found, return the original language code
    return lang;
  };

  const directusLang = getDirectusLangCode(lang);

  const translation = data.translations?.find(
    (t) =>
      t.languages_code === directusLang ||
      (t.languages_code &&
        directusLang &&
        t.languages_code.toLowerCase().startsWith(directusLang.toLowerCase() + '-'))
  );
  console.log('FormBlock - Found translation:', translation);

  const title = translation?.title || data.title;
  const headline = translation?.headline || data.headline;

  // Transform form.fields to schema expected by VForm
  const formWithSchema = {
    ...data.form,
    schema: (data.form.fields || []).map((field, index) => {
      console.log('FormBlock - Processing field:', field);
      const fieldTranslation = field?.translations?.find(
        (t) => t.languages_code === directusLang
      );
      console.log('FormBlock - Field translation:', fieldTranslation);

      // Use field ID as the name to ensure uniqueness
      const fieldName = field?.id || `field_${index}`;
      
      return {
        id: field?.id || `field_${index}`,
        name: fieldName,
        type: field?.type || 'input',
        label: fieldTranslation?.label || field?.name || fieldName,
        placeholder: fieldTranslation?.placeholder || '',
        help: fieldTranslation?.help || '',
        validation: field?.validation || '',
        width: field?.width || '100',
        options: fieldTranslation?.options || [], // For select fields
      };
    }),
    submit_label:
      data.form.translations?.find((t) => t.languages_code === directusLang)
        ?.submit_label || data.form.submit_label || 'Submit',
    success_message:
      data.form.translations?.find((t) => t.languages_code === directusLang)
        ?.success_message || data.form.success_message || 'Form submitted successfully',
  };

  console.log('FormBlock - Final formWithSchema:', formWithSchema);

  return (
    <BlockContainer>
      <div className='card mx-auto mt-4 max-w-4xl'>
        <div className='card-body'>
          {title && (
            <TypographyTitle className='text-[var(--color-gray)] '>{title}</TypographyTitle>
          )}
          {headline && (
            <TypographyHeadline
              className="text-[var(--color-primary)] font-semibold [font-family:var(--font-display)]"
              content={headline}
            />
          )}
          <VForm form={formWithSchema} className='mt-4' />
        </div>
      </div>
    </BlockContainer>
  );
};

export default FormBlock
