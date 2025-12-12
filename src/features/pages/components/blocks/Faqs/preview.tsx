'use client';

import { useEffect, useMemo } from 'react';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import { VAccordion } from '@/components/base/VAccordion';

interface FaqItem {
  title: string;
  answer: string;
}

interface FaqTranslation {
  title?: string;
  headline?: string;
  faqs?: FaqItem[];
  languages_code: string;
}

export interface BlockFaqsData {
  id: string;
  title?: string;
  headline?: string;
  alignment?: 'left' | 'center';
  translations?: FaqTranslation[];
}

interface FaqsBlockProps {
  data: BlockFaqsData;
  lang: string;
}

export default function FaqsBlock({ data, lang }: FaqsBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation = translations.find((item) => item.languages_code === directusLang) || translations[0];
  const title = translation?.title || data.title || '';
  const headline = translation?.headline || data.headline || '';
  const faqItems = useMemo(() => translation?.faqs || [], [translation?.faqs]);
  const alignment = data.alignment || 'center';

  useEffect(() => {
    // ... console logs ...
  }, [data, title, headline, faqItems]);

  return (
    <BlockContainer className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className={`mx-auto max-w-4xl ${alignment === 'left' ? 'text-left' : 'text-center'}`}>
        {title && (
          <TypographyTitle className="font-[var(--font-display)] text-[var(--color-gray)]">
            {title}
          </TypographyTitle>
        )}
        {headline && (
          <TypographyHeadline
            content={headline}
            size="xl"
            className="font-[var(--font-display)] font-semibold w-full text-[var(--color-primary)] flex justify-center"
          />
        )}
        <div className="mt-6 pt-6">
          <dl className="space-y-6">
            {faqItems.map((faq, index) => (
              <VAccordion key={index} title={faq.title}>
                {faq.answer}
              </VAccordion>
            ))}
          </dl>
        </div>
      </div>
    </BlockContainer>
  );
}




