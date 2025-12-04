import React, { useEffect } from 'react'
import VButton from '@/components/base/VButton'
import BlockContainer from '@/components/BlockContainer'
import TypographyHeadline from '@/components/typography/TypographyHeadline'
import { getDirectusMedia } from '@/lib/utils/directus-helpers'
import Image from 'next/image'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface BlockHeroButton {
  id: string
  label: string
  href: string
  open_in_new_window: boolean
  variant: string
  translations?: Array<{
    label: string
    href: string
    languages_code: string
  }>
}

export interface BlockHero {
  headline: string
  title?: string | null
  content: string
  image?: string
  image_position?: 'left' | 'right'
  buttons?: BlockHeroButton[]
  button_group?: {
    buttons: BlockHeroButton[]
  }
}

interface HeroBlockProps {
  data: BlockHero & {
    translations?: Array<any>
    title?: string | null
  }
  lang: string
}

export default function HeroBlock({ data, lang }: HeroBlockProps) {
  // console.log('[HeroBlock] lang prop:', lang)
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN'
  // console.log('[HeroBlock] directusLang:', directusLang)
  // console.log('[HeroBlock] data.translations:', data.translations)
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation = translations.find((t: any) => t.languages_code === directusLang) || translations[0];
  const headline = translation?.headline || '';
  const title = translation?.title || '';
  const content = translation?.content || '';

  const buttons = data.buttons || data.button_group?.buttons || [];
  const imagePosition = data.image_position || 'right'; // Default to right

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyStyles = window.getComputedStyle(document.body);
      console.log('[HeroBlock] CSS Variables:');
      console.log('--color-primary:', bodyStyles.getPropertyValue('--color-primary'));
      console.log('--font-body:', bodyStyles.getPropertyValue('--font-body'));
      console.log('--font-display:', bodyStyles.getPropertyValue('--font-display'));
      console.log('--font-code:', bodyStyles.getPropertyValue('--font-code'));
    }
  }, []);

  // Render content and image based on position - using exact docs styling
  const contentSection = (
    <div
      className='md:col-span-2 md:pt-12 transition-all duration-700 ease-out'
    >
      {headline && (
        <TypographyHeadline
          content={headline}
          size='xl'
          className="text-primary font-font-display font-bold leading-tight mb-4"
        />
      )}
      <p className="w-full py-4 font-font-body text-sm sm:text-base md:text-lg leading-relaxed text-gray">
        {content}
      </p>
      <div className='flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0'>
        {buttons.map((button) => {
          const btnTrans = button.translations?.find(t => t.languages_code === directusLang)
          return (
            <VButton
              key={button.id}
              href={btnTrans?.href || button.href}
              variant={button.variant}
              target={button.open_in_new_window ? '_blank' : '_self'}
              size='lg'
            >
              {btnTrans?.label || button.label}
            </VButton>
          )
        })}
      </div>
    </div>
  );

  const imageSection = data.image && (
    <div
      className='p-4 flex items-center justify-center'
    >
      <Image
        className='w-full h-auto max-h-[500px] object-contain'
        width='500'
        height='500'
        src={getDirectusMedia(data.image) as any}
        alt=''
      />
    </div>
  );

  return (
    <BlockContainer className='relative grid gap-6 md:grid-cols-3'>
      {imagePosition === 'left' ? (
        <>
          {imageSection}
          {contentSection}
        </>
      ) : (
        <>
          {contentSection}
          {imageSection}
        </>
      )}
    </BlockContainer>
  )
}
