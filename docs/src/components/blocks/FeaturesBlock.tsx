import { Link } from '@/lib/navigation'
import { useEffect } from 'react'
import BlockContainer from '@/components/BlockContainer'

interface FeaturesBlockProps {
  data: {
    title?: string
    description?: string
    features: Feature[]
    translations?: Array<{
      title?: string
      description?: string
      languages_code: string
    }>
  }
  lang: string
}

interface Feature {
  id: string
  title: string
  description: string
  show_link: boolean
  new_tab: boolean
  url: string
  text: string
  translations?: Array<{
    title?: string
    description?: string
    text?: string
    languages_code: string
  }>
}

function Feature({
  title,
  description,
  show_link,
  new_tab,
  url,
  text,
  translations,
  lang
}: Feature & { translations?: Feature['translations'], lang: string }) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translation = translations?.find(t => t.languages_code === directusLang)
  const translatedTitle = translation?.title || title
  const translatedDescription = translation?.description || description
  const translatedText = translation?.text || text

  return (
    <div className='flex flex-col items-center p-4'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 20 20'
        fill='currentColor'
        className='h-8 w-8'
      >
        <path
          fillRule='evenodd'
          d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z'
          clipRule='evenodd'
        ></path>
      </svg>
      <h3 className='my-3 text-3xl font-semibold'>{translatedTitle}</h3>
      <div className='my-6 space-y-1 leading-tight'>
        <p>{translatedDescription}</p>
      </div>
      {show_link && url && translatedText && (
        <div>
          <Link href={url} target={new_tab ? '_blank' : '_self'} className=''>
            <button className='btn btn-accent btn-outline'>{translatedText}</button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function FeaturesBlock({ data, lang }: FeaturesBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  const translations = Array.isArray(data.translations) ? data.translations : []
  const translation = translations.find(t => t.languages_code === directusLang) || translations[0]
  const title = translation?.title || data.title || ''
  const description = translation?.description || data.description || ''

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body)
      console.log('[FeaturesBlock] CSS Variables:')
      console.log('--color-primary:', bodyStyles.getPropertyValue('--color-primary'))
      console.log('--font-body:', bodyStyles.getPropertyValue('--font-body'))
      console.log('--font-display:', bodyStyles.getPropertyValue('--font-display'))
      console.log('--font-code:', bodyStyles.getPropertyValue('--font-code'))
    }
  }, [])

  return (
    <BlockContainer className='m:py-12lg:py-24'>
      <div className='container mx-auto space-y-2 py-4 text-center'>
        <h2 className='text-5xl font-bold'>{title}</h2>
        <p>{description}</p>
      </div>
      <div className='container mx-auto my-6 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {data.features.map((feature: Feature, index: number) => (
          <Feature key={index} {...feature} translations={feature.translations} lang={lang} />
        ))}
      </div>
    </BlockContainer>
  )
}
