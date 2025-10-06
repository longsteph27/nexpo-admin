import React, { useEffect, useMemo } from 'react'
import BlockContainer from '@/components/BlockContainer'
import TypographyTitle from '@/components/typography/TypographyTitle'
import TypographyHeadline from '@/components/typography/TypographyHeadline'
import { VAccordion } from '@/components/base/VAccordion'

interface Faq {
  title: string
  answer: string
}

interface FaqsBlockProps {
  id: string
  title?: string
  headline?: string
  translations?: Array<{
    title?: string
    headline?: string
    languages_code: string
    faqs?: Faq[]
  }>
  lang: string
}

interface Props {
  data: FaqsBlockProps
  lang: string
}

export default function FaqsBlock({ data, lang }: Props) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0]
  const title = translation?.title || data.title || ''
  const headline = translation?.headline || data.headline || ''
  const faqs = useMemo(() => translation?.faqs || [], [translation?.faqs])

  useEffect(() => {
    console.log('\n=== FAQs Block Data ===')
    console.log('Block Data:', {
      id: data.id,
      title,
      headline,
      faqsCount: faqs.length
    })
    console.log('FAQs:', faqs.map(faq => ({
      title: faq.title,
      answer: faq.answer
    })))
  }, [data, title, headline, faqs])

  return (
    <BlockContainer className='mx-auto max-w-screen-xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='mx-auto max-w-4xl text-center'>
        {title && (
          <TypographyTitle className="font-[var(--font-display)] text-[var(--color-gray)]">
            {title}
          </TypographyTitle>
        )}
        {headline && (
          <TypographyHeadline
            content={headline}
            size='xl'
            className="font-[var(--font-display) ] font-semibold  text-[var(--color-primary)]"
          />
        )}
        <div className='mt-6 pt-6'>
          <dl className='space-y-6'>
            {faqs.map((faq, itemIdx) => (
              <VAccordion 
                key={itemIdx}
                title={faq.title}
              >
                {faq.answer}
              </VAccordion>
            ))}
          </dl>
        </div>
      </div>
    </BlockContainer>
  )
}
