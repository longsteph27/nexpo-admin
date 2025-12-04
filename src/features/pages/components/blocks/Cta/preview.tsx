import React, { useEffect } from 'react';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import TypographyProse from '@/components/typography/TypographyProse';
import VButton from '@/components/base/VButton';

interface ButtonTranslation {
  label?: string;
  href?: string; // backward compat
  languages_code: string;
}

interface CtaButton {
  id: string;
  // link
  type?: 'pages' | 'posts' | 'external';
  page?: string | null;
  post?: string | null;
  external_url?: string | null;
  // style
  open_in_new_window?: boolean;
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | 'default';
  color?: 'primary' | 'gray' | 'black' | 'white';
  // i18n
  label?: string; // fallback
  href?: string; // fallback for legacy
  translations?: ButtonTranslation[];
}

export interface BlockCtaData {
  id: string;
  title?: string;
  headline?: string;
  content?: string;
  button_group?: { id: string; buttons?: CtaButton[] } | string | null;
  buttons?: CtaButton[]; // legacy
  translations?: Array<{
    title?: string;
    headline?: string;
    content?: string;
    languages_code: string;
  }>;
}

interface CtaBlockProps {
  data: BlockCtaData;
  lang: string;
}

export default function CtaBlock({ data, lang }: CtaBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation = translations.find((item) => item.languages_code === directusLang) || translations[0];
  const title = translation?.title || data.title || '';
  const headline = translation?.headline || data.headline || '';
  const content = translation?.content || data.content || '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body);
      console.log('[CtaBlock] CSS Variables:');
      console.log('--color-primary:', bodyStyles.getPropertyValue('--color-primary'));
    }
  }, []);

  return (
    <BlockContainer className="glass-card-blue mx-auto w-full max-w-8xl">
      <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-transparent p-2">
        <div className="relative overflow-hidden rounded-xl px-6 py-8">
          <div className="relative md:flex md:items-center md:justify-between md:space-x-4">
            <div>
              {title && (
                <TypographyTitle className="text-gray font-font-display font-semibold">
                  {title}
                </TypographyTitle>
              )}
              {headline && (
                <TypographyHeadline
                  className="text-primary font-font-display font-semibold"
                  size="xl"
                  content={headline}
                />
              )}
              {content && (
                <TypographyProse content={content} className="mt-2 font-font-body" />
              )}
            </div>
            <div className="mt-4 flex-shrink-0 md:mt-0">
              {(() => {
                const groupButtons =
                  typeof (data as any).button_group === 'object' && (data as any).button_group !== null
                    ? ((data as any).button_group.buttons as any[] | undefined) || []
                    : [];
                const legacyButtons = (data as any).buttons as any[] | undefined;
                const buttons = groupButtons.length > 0 ? groupButtons : (legacyButtons || []);
                return buttons.map((button: any) => {
                  const buttonTranslation =
                    button.translations?.find((item: any) => item.languages_code === directusLang) ||
                    button.translations?.[0];
                  const buttonLabel = buttonTranslation?.label || button.label || '';

                  // Derive href based on schema: type/page/post/external_url
                  let buttonHref = '#';
                  if (button.type === 'external') {
                    buttonHref = button.external_url || buttonTranslation?.href || '#';
                  } else if (button.type === 'pages') {
                    // Admin preview: we only have page UUID, no permalink here
                    buttonHref = '#';
                  } else if (button.type === 'posts') {
                    buttonHref = '#';
                  } else if (!button.type) {
                    // Backward compatibility
                    buttonHref = button.href || buttonTranslation?.href || '#';
                  }

                  return (
                    <VButton
                      key={button.id}
                      href={buttonHref}
                      target={button.open_in_new_window ? '_blank' : '_self'}
                      size="xl"
                      color={button.color || 'primary'}
                      variant={button.variant || 'solid'}
                      className="block"
                    >
                      {buttonLabel}
                    </VButton>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </BlockContainer>
  );
}




