import BlockContainer from '@/components/BlockContainer'
import { useEffect } from 'react'

interface RawHtml {
  id: string
  raw_html?: string
  translations?: Array<{
    raw_html?: string
    languages_code: string
  }>
}

interface RawHtmlBlockProps {
  data: RawHtml
  lang: string
}

export default function RawHtmlBlock({ data, lang }: RawHtmlBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0]
  const rawHtml = translation?.raw_html || data.raw_html || ''

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body)
      console.log('[RawHtmlBlock] CSS Variables:')
      console.log('--color-primary:', bodyStyles.getPropertyValue('--color-primary'))
      console.log('--font-body:', bodyStyles.getPropertyValue('--font-body'))
      console.log('--font-display:', bodyStyles.getPropertyValue('--font-display'))
      console.log('--font-code:', bodyStyles.getPropertyValue('--font-code'))
    }
  }, [])

  return (
    <BlockContainer>
      <div dangerouslySetInnerHTML={{ __html: rawHtml }}></div>
    </BlockContainer>
  )
}
