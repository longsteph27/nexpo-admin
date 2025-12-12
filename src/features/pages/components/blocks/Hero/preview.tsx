import React, { useEffect } from 'react';
import Image from 'next/image';
import VButton from '@/components/base/VButton';
import BlockContainer from '@/components/BlockContainer';
import { getDirectusMedia } from '@/lib/utils/directus-helpers';
import type { BlockHeroButton, BlockHeroData } from './types'; // Assuming types file or using previous interfaces? 
// Actually I'll redefine interfaces or use types logic as before but with aligned structure

export interface BlockHeroButtonType {
  id: string;
  label: string;
  href: string;
  open_in_new_window: boolean;
  variant: string;
  translations?: Array<{
    label: string;
    href: string;
    languages_code: string;
  }>;
}

export interface BlockHeroDataType {
  headline: string;
  title?: string | null;
  content: string;
  image?: string;
  image_position?: 'left' | 'right';
  buttons?: BlockHeroButtonType[];
  button_group?: {
    buttons: BlockHeroButtonType[];
  };
  translations?: Array<{
    headline?: string | null;
    title?: string | null;
    content?: string | null;
    languages_code?: string;
  }>;
}

interface HeroBlockProps {
  data: BlockHeroDataType;
  lang: string;
}

export default function HeroBlock({ data, lang }: HeroBlockProps) {
  const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
  const translations = Array.isArray(data.translations) ? data.translations : [];
  const translation =
    translations.find((item) => item.languages_code === directusLang) || translations[0];

  const headline = translation?.headline || '';
  const title = translation?.title || '';
  const content = translation?.content || '';

  const buttons = data.buttons || data.button_group?.buttons || [];
  // HeroBlock.tsx doesn't seem to care about image_position but the old preview did.
  // The user said "Render preview theo @[docs/src/components/blocks/HeroBlock.tsx] HOẶC đơn giản chỉ cần giữ nguyên ... của Hero cũ trước khi bạn đổi"
  // The HeroBlock.tsx has image on right (implicit or detailed in code).
  // I will follow HeroBlock.tsx structure exactly as requested.
  // HeroBlock.tsx structure: 
  /*
    <BlockContainer className='relative grid gap-6 md:grid-cols-3'>
       <div ... md:col-span-2 ...> 
          <h1 ... dangerouslySetInnerHTML />
          <p ...>{content}</p>
          <div ... buttons ... />
       </div>
       {data.image && <div ...><Image .../></div>}
    </BlockContainer>
  */
  // It seems to ignore image_position field, always placing image on right (or bottom in mobile).
  // But wait, the previous code had logic for image_position. 
  // If I want to match HeroBlock.tsx strictly, I should ignore image_position.
  // However, removing functionality might be regression if they want the *Editor* options to work.
  // The user said "Preview according to HeroBlock.tsx OR keep old layout".
  // HeroBlock.tsx uses fixed layout. I will use that for accuracy to their doc request.

  const imagePosition = data.image_position || 'right';

  const contentSection = (
    <div className="md:col-span-2 md:pt-12 transition-all duration-700 ease-out">
      {headline && (
        <h1
          className="text-[var(--color-primary)] xs:text-5xl font-[var(--font-display)] font-bold text-4xl sm:text-2xl lg:text-6xl leading-snug"
          dangerouslySetInnerHTML={{ __html: headline }}
        />
      )}
      <p className="w-full py-6 font-[var(--font-display)] text-[18px] lg:leading-loose text-[var(--color-gray)]">
        {content}
      </p>
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        {buttons.map((button) => {
          const buttonTranslation = button.translations?.find(
            (item) => item.languages_code === directusLang
          );
          return (
            <VButton
              key={button.id}
              href={buttonTranslation?.href || button.href}
              variant={button.variant}
              target={button.open_in_new_window ? '_blank' : '_self'}
              size="lg"
            >
              {buttonTranslation?.label || button.label}
            </VButton>
          );
        })}
      </div>
    </div>
  );

  const imageClasses = imagePosition === 'left'
    ? "p-2 lg:relative lg:w-full flex items-center justify-center"
    : "p-2 lg:relative lg:w-full flex items-center justify-center";

  const imageSection = data.image ? (
    <div className="col-span-1">
      <div className={imageClasses}>
        <Image
          className="max-h-[700px] w-full overflow-hidden object-cover"
          width={700}
          height={700}
          src={getDirectusMedia(data.image) as any}
          alt={title || ''}
        />
      </div>
    </div>
  ) : null;

  return (
    <BlockContainer className="relative grid gap-6 md:grid-cols-3">
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
  );
}




