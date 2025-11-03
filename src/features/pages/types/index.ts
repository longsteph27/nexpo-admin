// Re-export types from directus-collections for convenience
export type {
  Page,
  PageTranslation,
  PageBlock,
  PageBlockWithItem,
  PageWithTranslations,
  PageDetailResponse,
  PageUpdatePayload,
  PageTranslationPayload,
  DirectusStatus,
  LanguageCode,
  BlockCollectionType,
  BlockItem,
  BaseBlock,
  BlockTranslation,
  BlockHero,
  BlockHeroTranslation,
  BlockRichText,
  BlockRichTextTranslation,
  BlockFaqs,
  BlockFaqsTranslation,
  BlockQuote,
  BlockQuoteTranslation,
} from '@/types/directus-collections';

// Block interface for Page Builder (with item reference)
export interface Block {
  id: string;
  collection: string;
  sort: number;
  item?: Record<string, unknown>; // Block-specific data structure
}


