import React from 'react';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import VGallery from '@/components/base/VGallery';

export interface GalleryItemRef {
  directus_files_id:
    | string
    | {
        id: string;
        title?: string;
        description?: string;
        tags?: string | string[];
      };
}

export interface GalleryTranslation {
  languages_code: string;
  title?: string;
  headline?: string;
}

export interface BlockGalleryData {
  id: string;
  title?: string;
  headline?: string;
  gallery_items: GalleryItemRef[];
  translations?: GalleryTranslation[];
}

interface GalleryBlockProps {
  data: BlockGalleryData;
  lang: string;
  className?: string;
}

export default function GalleryBlock({ data, lang, className }: GalleryBlockProps) {
  const translation =
    data.translations?.find(
      (item) =>
        item.languages_code === lang ||
        item.languages_code?.toLowerCase().startsWith(`${lang.toLowerCase()}-`)
    ) || null;

  const title = translation?.title || data.title;
  const headline = translation?.headline || data.headline;

  return (
    <div className={`modern-gallery-block ${className || ''}`}>
      <BlockContainer>
        {title && (
          <TypographyTitle className="font-font-display text-gray">
            {title}
          </TypographyTitle>
        )}
        {headline && (
          <TypographyHeadline
            content={headline}
            size="xl"
            className="font-font-display font-semibold text-primary"
          />
        )}
        {data.gallery_items.length > 0 && (
          <VGallery
            items={data.gallery_items
              .map((item) => {
                const file = item.directus_files_id;
                if (!file) return undefined;
                if (typeof file === 'string') {
                  return { id: file };
                }
                return {
                  id: file.id,
                  title: file.title,
                  description: file.description,
                  tags: Array.isArray(file.tags)
                    ? file.tags
                    : file.tags
                    ? [file.tags]
                    : undefined,
                };
              })
              .filter(
                (
                  item
                ): item is { id: string; title?: string; description?: string; tags?: string[] } =>
                  !!item && !!item.id
              )}
          />
        )}
      </BlockContainer>
    </div>
  );
}




