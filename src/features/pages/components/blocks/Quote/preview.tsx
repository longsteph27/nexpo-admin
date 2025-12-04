'use client';

import { useEffect } from 'react';
import BlockContainer from '@/components/BlockContainer';

interface QuoteTranslation {
  headline?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  languages_code: string;
}

export interface BlockQuoteData {
  id: string;
  headline?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  background_color?: string;
  tenant_id?: number;
  event_id?: number;
  translations?: QuoteTranslation[];
}

interface QuoteBlockProps {
  data: BlockQuoteData;
  lang: string;
}

export default function QuoteBlock({ data, lang }: QuoteBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation = translations.find((item) => item.languages_code === directusLang) || translations[0];

  const title = translation?.title || data.title || '';
  const subtitle = translation?.subtitle || data.subtitle || '';
  const content = translation?.content || data.content || '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // CSS variables are applied via theme service
    }
  }, []);

  if (!content && !title && !subtitle) {
    return (
      <BlockContainer className="py-16 px-4">
        <div className="relative max-w-3xl mx-auto bg-white/80 shadow-xl rounded-2xl border-l-8 border-[var(--color-primary,#1E40AF)] p-8">
          <div className="text-center text-neutral-400 italic">
            Quote content will appear here
          </div>
        </div>
      </BlockContainer>
    );
  }

  return (
    <BlockContainer className="py-16 px-4">
      <div className="relative max-w-3xl mx-auto bg-white/80 shadow-xl rounded-2xl border-l-8 border-[var(--color-primary,#1E40AF)] p-8">
        {content && (
          <div className="flex items-start space-x-4">
            <span className="text-6xl font-bold text-[var(--color-primary,#1E40AF)] leading-none select-none -mt-2">
              &ldquo;
            </span>
            <div
              className="italic text-2xl font-[var(--font-display)] text-neutral-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        {(title || subtitle) && (
          <div className={content ? 'mt-6 pl-12' : 'mt-0'}>
            {title && <div className="text-lg text-neutral-700 font-semibold">{title}</div>}
            {subtitle && <div className="text-base text-[var(--color-primary,#1E40AF)]">{subtitle}</div>}
          </div>
        )}
      </div>
    </BlockContainer>
  );
}




