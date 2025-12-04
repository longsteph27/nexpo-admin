import React, { useEffect } from 'react';
import BlockContainer from '@/components/BlockContainer';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import TypographyProse from '@/components/typography/TypographyProse';
import TypographyTitle from '@/components/typography/TypographyTitle';

export interface BlockRichtext {
  title?: string | null;
  headline?: string | null;
  content?: string | null;
  alignment?: 'left' | 'center' | 'right';
  translations?: Array<{
    languages_code: string;
    title?: string;
    headline?: string;
    content?: string;
  }>;
}

interface RichTextBlockProps {
  data: BlockRichtext;
  lang: string;
}

export default function RichTextBlock({ data, lang }: RichTextBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation =
    translations.find((item) => item.languages_code === directusLang) || translations[0];
  const title = translation?.title || data.title || '';
  const headline = translation?.headline || data.headline || '';
  const content = translation?.content || data.content || '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body);
      console.log('[RichTextBlock] CSS Variables:', {
        '--color-primary': bodyStyles.getPropertyValue('--color-primary'),
      });
    }
  }, []);

  return (
    <BlockContainer>
      <div className="text-center">
        {title && (
          <TypographyTitle className="font-font-display text-gray">
            {title}
          </TypographyTitle>
        )}
        {headline && (
          <TypographyHeadline
            content={headline}
            size="xl"
            className="font-font-display font-semibold text-vnpt-blue"
          />
        )}
      </div>
      <TypographyProse content={content} className="font-font-body mx-auto mt-8 text-content-primary" />
    </BlockContainer>
  );
}




