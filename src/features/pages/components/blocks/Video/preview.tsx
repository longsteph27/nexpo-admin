'use client';

import { useMemo } from 'react';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import VVideo from '@/components/base/VVideo';
import { getDirectusMedia } from '@/lib/utils/directus-helpers';
import type { BlockVideo, BlockVideoTranslation, LanguageCode } from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';

export interface BlockVideoData extends BlockVideo { }

interface VideoBlockProps {
  data: BlockVideo | Record<string, unknown>;
  lang: LanguageCode | string;
}

export default function VideoBlock({ data, lang }: VideoBlockProps) {
  const blockData = data as BlockVideo;
  const languageCode = extractLanguageCode(lang);
  const directusLang = languageCode === 'en' ? 'en-US' : 'vi-VN';

  const translations = Array.isArray(blockData.translations) ? blockData.translations : [];
  const translation =
    translations.find((item: BlockVideoTranslation) => item.languages_code === directusLang) ||
    (translations[0] as BlockVideoTranslation | undefined);

  const title = translation?.title || blockData.title || '';
  const headline = translation?.headline || blockData.headline || '';
  const videoType = blockData.type || 'url';
  const videoFile = blockData.video_file || null;
  const videoUrl = blockData.video_url || '';

  const url = useMemo(() => {
    if (videoType === 'file' && videoFile) {
      return getDirectusMedia(videoFile as string);
    }
    if (videoType === 'url' && videoUrl) {
      return videoUrl;
    }
    return null;
  }, [videoType, videoFile, videoUrl]);

  if (!url) {
    return (
      <BlockContainer className="mx-auto max-w-4xl py-12 text-center">
        <div className="text-neutral-500">
          <p>No video source configured</p>
        </div>
      </BlockContainer>
    );
  }

  return (
    <BlockContainer className="mx-auto max-w-4xl py-12 text-center">
      {title && (
        <TypographyTitle className="font-font-display text-gray">
          {title}
        </TypographyTitle>
      )}
      {headline && (
        <TypographyHeadline
          content={headline}
          size="xl"
          className="font-font-display text-primary justify-center flex"
        />
      )}
      <div className="relative flex justify-center items-center mt-8">
        <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-br-2xl rounded-tl-2xl opacity-30" />
        <VVideo className="relative mt-4 overflow-hidden rounded-br-xl rounded-tl-xl" url={url} title={title || 'Video'} />
      </div>
    </BlockContainer>
  );
}




