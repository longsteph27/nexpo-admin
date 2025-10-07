import React from 'react'
import BlockContainer from '@/components/BlockContainer'

export interface BlockRichtext {
  title?: string | null
  headline?: string | null
  content?: string | null
  alignment?: 'left' | 'center' | 'right'
  translations?: Array<{
    languages_code: string
    title?: string
    headline?: string
    content?: string
  }>
}

interface RichTextBlockProps {
  data: BlockRichtext
  lang: string
}

export default function RichTextBlock({ data, lang }: RichTextBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find((t: any) => t.languages_code === directusLang) || translations[0]

  const title = translation?.title || data.title || ''
  const headline = translation?.headline || data.headline || ''
  const content = translation?.content || data.content || ''
  const alignment = data.alignment || 'center'

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <BlockContainer className={`py-12 ${alignmentClasses[alignment]}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Title */}
        {title && (
          <div className="text-sm font-medium text-[var(--color-gray)] uppercase tracking-wide mb-2">
            {title}
          </div>
        )}

        {/* Headline */}
        {headline && (
          <h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-[var(--font-display)] font-bold text-[var(--color-primary)] mb-6"
            dangerouslySetInnerHTML={{ __html: headline }}
          />
        )}

        {/* Content */}
        {content && (
          <div 
            className="prose prose-lg max-w-none font-[var(--font-body)] text-[var(--color-gray)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              '--tw-prose-body': 'var(--color-gray)',
              '--tw-prose-headings': 'var(--color-primary)',
              '--tw-prose-links': 'var(--color-primary)',
              '--tw-prose-bold': 'var(--color-primary)',
            } as React.CSSProperties}
          />
        )}
      </div>
    </BlockContainer>
  )
}