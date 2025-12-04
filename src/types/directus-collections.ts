/**
 * Directus Collections TypeScript Types
 * Generated from schema files in docs/
 * 
 * This file provides type-safe interfaces for all Directus collections,
 * eliminating the need for `:any` types throughout the codebase.
 */

// ============================================================================
// Common Types
// ============================================================================

export type DirectusStatus = 'draft' | 'published' | 'archived';
export type LanguageCode = 'en-US' | 'vi-VN';

export interface DirectusTimestamp {
  date_created?: string | null;
  date_updated?: string | null;
  user_created?: string | null;
  user_updated?: string | null;
}

// ============================================================================
// Pages Collection
// ============================================================================

export interface PageTranslation {
  id: number;
  pages_id: string;
  languages_code: LanguageCode | string;
  title: string | null;
  permalink: string | null;
}

export interface Page extends DirectusTimestamp {
  id: string; // UUID
  sort: number | null;
  status: DirectusStatus;
  site_id?: number | null;
  // Relations
  translations?: PageTranslation[];
  blocks?: PageBlock[];
  site?: Site | null;
}

// For API responses where translations might be nested
export interface PageWithTranslations extends Omit<Page, 'translations'> {
  translations: Array<PageTranslation & {
    languages_code: LanguageCode | string | { code: LanguageCode | string };
  }>;
}

// ============================================================================
// Sites Collection
// ============================================================================

export interface SiteTranslation {
  id: number;
  sites_id: number;
  languages_code: LanguageCode | string;
  title: string | null;
  description?: string | null;
}

export interface Site extends DirectusTimestamp {
  id: number;
  slug?: string | null;
  domain?: string | null;
  status: DirectusStatus;
  sort: number | null;
  logo?: string | null; // UUID reference to directus_files
  favicon?: string | null; // UUID reference to directus_files
  event_id?: number | null;
  tenant_id?: number | null;
  // Relations
  translations?: SiteTranslation[];
  event?: unknown; // Event type if needed (can be extended later)
  tenant?: unknown; // Tenant type if needed (can be extended later)
}

// ============================================================================
// Navigation Collection
// ============================================================================

export interface Navigation extends DirectusTimestamp {
  id: string; // UUID
  type: 'header' | 'footer';
  status: DirectusStatus;
  site?: number | null; // Reference to sites.id
  // Relations
  items?: NavigationItem[];
}

// ============================================================================
// Navigation Items Collection
// ============================================================================

export interface NavigationItemTranslation {
  id: number;
  navigation_items_id: string;
  languages_code: LanguageCode | string;
  title: string | null;
}

export interface NavigationItem extends DirectusTimestamp {
  id: string; // UUID
  navigation?: string | null; // Reference to navigation.id
  sort: number | null;
  type: 'page' | 'url' | null;
  url?: string | null;
  page?: string | null; // Reference to pages.id
  open_in_new_tab?: boolean | null;
  has_children?: boolean | null;
  parent?: string | null; // Reference to navigation_items.id
  icon?: string | null;
  label?: string | null;
  // Relations
  translations?: NavigationItemTranslation[];
  children?: NavigationItem[];
  parent_item?: NavigationItem | null;
  page_item?: Page | null;
}

// For API payloads with nested structure
export interface NavigationItemPayload {
  create?: Array<Omit<NavigationItem, 'id' | 'navigation'>>;
  update?: Array<Partial<NavigationItem> & { id: string }>;
  delete?: string[];
}

// ============================================================================
// Blocks Collections (Many-to-Any with Pages)
// ============================================================================

/**
 * PageBlock represents the junction table entry for Many-to-Any relationship
 * between pages and blocks. In Directus, this is handled via M2A (Many-to-Any).
 */
export interface PageBlock {
  id: string; // UUID - junction table entry ID
  pages_id: string; // Reference to pages.id
  collection: string; // Block collection name (e.g., 'block_hero', 'block_richtext')
  item: string; // UUID reference to the actual block item (block_hero.id, etc.)
  sort: number | null;
  hide_block?: boolean | null;
}

/**
 * Base block translation structure
 * All block translations follow this pattern: {collection}_translations
 */
export interface BlockTranslation {
  id: number;
  languages_code: LanguageCode | string;
  [key: string]: unknown; // Block-specific translation fields (title, content, etc.)
}

/**
 * Base structure for all block collections
 * All blocks have: id (UUID), event_id, tenant_id, and translations
 */
export interface BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: BlockTranslation[];
  [key: string]: unknown; // Block-specific fields (image, button_group, etc.)
}

/**
 * Block Collection Names (for type-safe collection strings)
 */
export type BlockCollectionType =
  | 'block_button'
  | 'block_button_group'
  | 'block_columns'
  | 'block_columns_rows'
  | 'block_cta'
  | 'block_divider'
  | 'block_faqs'
  | 'block_form'
  | 'block_gallery'
  | 'block_gallery_files'
  | 'block_hero'
  | 'block_html'
  | 'block_logocloud'
  | 'block_logocloud_logos'
  | 'block_quote'
  | 'block_richtext'
  | 'block_step_items'
  | 'block_steps'
  | 'block_team'
  | 'block_testimonial_slider_items'
  | 'block_testimonials'
  | 'block_video';

// ============================================================================
// Specific Block Types (examples for most common blocks)
// ============================================================================

/**
 * Block Hero Translation
 */
export interface BlockHeroTranslation extends BlockTranslation {
  block_hero_id: string;
  title?: string | null;
  headline?: string | null;
  content?: string | null;
  [key: string]: unknown;
}

/**
 * Block Hero
 */
export interface BlockHero extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  image?: string | null; // UUID reference to directus_files
  image_position?: string | null;
  button_group?: string | null; // UUID reference to block_button_group
  translations?: BlockHeroTranslation[];
}

/**
 * Block RichText Translation
 */
export interface BlockRichTextTranslation extends BlockTranslation {
  block_richtext_id: string;
  title?: string | null;
  content?: string | null;
  [key: string]: unknown;
}

/**
 * Block RichText
 */
export interface BlockRichText extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: BlockRichTextTranslation[];
  [key: string]: unknown;
}

/**
 * Block FAQs Translation
 */
export interface BlockFaqsTranslation extends BlockTranslation {
  block_faqs_id: string;
  title?: string | null;
  [key: string]: unknown;
}

/**
 * Block FAQs
 */
export interface BlockFaqs extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: BlockFaqsTranslation[];
  [key: string]: unknown;
}

/**
 * Block Quote Translation
 */
export interface BlockQuoteTranslation extends BlockTranslation {
  block_quote_id: string;
  title?: string | null;
  quote?: string | null;
  author?: string | null;
  [key: string]: unknown;
}

/**
 * Block Quote
 */
export interface BlockQuote extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: BlockQuoteTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block Columns
// ============================================================================

export interface BlockColumnsTranslation extends BlockTranslation {
  id?: number; // Optional for new translations
  block_columns_id?: string; // Optional for new translations
  title?: string | null;
  headline?: string | null;
  [key: string]: unknown;
}

export interface BlockColumnsRowsTranslation extends BlockTranslation {
  id?: number; // Optional for new translations
  block_columns_rows_id?: string; // Optional for new translations
  title?: string | null;
  headline?: string | null;
  content?: string | null;
  [key: string]: unknown;
}

export interface BlockButtonTranslation extends BlockTranslation {
  id?: number; // Optional for new translations
  block_button_id?: string; // Optional for new translations
  label?: string | null;
  // href is kept for backward compatibility but schema favors type/page/post/external_url
  href?: string | null;
  [key: string]: unknown;
}

export interface BlockButton {
  id: string; // UUID
  button_group?: string | null; // UUID reference to block_button_group
  sort?: number | null;
  // Link target per schema
  type?: 'pages' | 'posts' | 'external' | null;
  page?: string | null; // m2o pages.id
  post?: string | null; // m2o posts.id
  external_url?: string | null;
  // Style
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | null;
  color?: 'primary' | 'gray' | 'black' | 'white' | null;
  open_in_new_window?: boolean | null;
  translations?: BlockButtonTranslation[];
  [key: string]: unknown;
}

export interface BlockButtonGroup {
  id: string; // UUID
  alignment?: 'start' | 'center' | 'end' | null;
  buttons?: BlockButton[];
  event_id?: number | null;
  tenant_id?: number | null;
  [key: string]: unknown;
}

export interface BlockColumnsRows {
  id: string; // UUID
  block_columns?: string | null; // UUID reference to block_columns
  sort?: number | null;
  image?: string | null; // UUID reference to directus_files
  image_position?: 'left' | 'right' | null;
  button_group?: string | BlockButtonGroup | null; // UUID reference or populated object
  translations?: BlockColumnsRowsTranslation[];
  event_id?: number | null;
  tenant_id?: number | null;
  [key: string]: unknown;
}

export interface BlockColumns extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  rows?: BlockColumnsRows[];
  translations?: BlockColumnsTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block Steps
// ============================================================================

export interface BlockStepsTranslation extends BlockTranslation {
  block_steps_id: string;
  title?: string | null;
  headline?: string | null;
  [key: string]: unknown;
}

export interface BlockStepItemTranslation {
  id?: number;
  block_step_items_id?: string | null; // UUID FK to block_step_items
  languages_code: LanguageCode | string;
  title?: string | null;
  content?: string | null;
  [key: string]: unknown;
}

export interface BlockStepItem {
  id?: string; // UUID - Optional for new items (Directus generates)
  block_steps?: string | null; // UUID FK to block_steps - CRITICAL for linking
  sort?: number | null;
  title?: string | null;
  content?: string | null;
  image?: string | null; // UUID reference to directus_files
  button_group?: string | BlockButtonGroup | null; // UUID reference to block_button_group
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: BlockStepItemTranslation[];
  [key: string]: unknown;
}

export interface BlockSteps extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  alternate_image_position?: boolean | null;
  show_step_numbers?: boolean | null;
  steps?: BlockStepItem[]; // O2M alias - populated from block_step_items
  translations?: BlockStepsTranslation[];
  [key: string]: unknown;
}

// Backward compatibility aliases
export type BlockStepItems = BlockStepItem;
export type BlockStepItemsTranslation = BlockStepItemTranslation;

// ============================================================================
// Block Form
// ============================================================================

export interface BlockFormTranslation extends BlockTranslation {
  block_form_id: string;
  title?: string | null;
  headline?: string | null;
  [key: string]: unknown;
}

export interface BlockForm extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  form?: string | null; // UUID reference to forms collection
  translations?: BlockFormTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block Gallery
// ============================================================================

export interface BlockGalleryTranslation extends BlockTranslation {
  block_gallery_id: string;
  title?: string | null;
  headline?: string | null;
  [key: string]: unknown;
}

export interface BlockGalleryFiles {
  id: string; // UUID
  block_gallery?: string | null; // UUID reference to block_gallery
  directus_files_id?: string | null; // UUID reference to directus_files
  sort?: number | null;
  event_id?: number | null;
  tenant_id?: number | null;
  [key: string]: unknown;
}

export interface BlockGallery extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  gallery_items?: BlockGalleryFiles[];
  translations?: BlockGalleryTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block Video
// ============================================================================

export interface BlockVideoTranslation extends BlockTranslation {
  block_video_id: string;
  title?: string | null;
  headline?: string | null;
  [key: string]: unknown;
}

export interface BlockVideo extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  title?: string | null; // Legacy field, prefer translations.title
  headline?: string | null; // Legacy field, prefer translations.headline
  type?: 'url' | 'file' | null; // 'url' for external video, 'file' for uploaded video
  video_url?: string | null; // URL for external video (YouTube, Vimeo, etc.)
  video_file?: string | null; // UUID of directus_files for uploaded video
  translations?: BlockVideoTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block CTA
// ============================================================================

export interface BlockCtaTranslation extends BlockTranslation {
  block_cta_id: string;
  title?: string | null;
  headline?: string | null;
  content?: string | null;
  [key: string]: unknown;
}

export interface BlockCta extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  background_color?: string | null;
  button_style?: string | null;
  button_group?: string | BlockButtonGroup | null;
  translations?: BlockCtaTranslation[];
  [key: string]: unknown;
}

// ============================================================================
// Block FAQs
// ============================================================================

export interface BlockFaqsItemsTranslation extends BlockTranslation {
  block_faqs_items_id?: string;
  question?: string | null;
  answer?: string | null;
  [key: string]: unknown;
}

export interface BlockFaqsItems {
  id: string; // UUID
  block_faqs?: string | null; // UUID reference to block_faqs
  sort?: number | null;
  translations?: BlockFaqsItemsTranslation[];
  event_id?: number | null;
  tenant_id?: number | null;
  [key: string]: unknown;
}

export interface BlockFaqs extends BaseBlock {
  id: string; // UUID
  event_id?: number | null;
  tenant_id?: number | null;
  items?: BlockFaqsItems[];
  translations?: BlockFaqsTranslation[];
  [key: string]: unknown;
}

/**
 * Union type for all block types
 * Use this when you need to handle any block type
 */
export type BlockItem = 
  | BlockHero
  | BlockRichText
  | BlockFaqs
  | BlockQuote
  | BlockColumns
  | BlockSteps
  | BlockForm
  | BlockGallery
  | BlockVideo
  | BlockCta
  | BaseBlock; // Fallback for other block types

/**
 * PageBlock with populated item
 */
export interface PageBlockWithItem extends PageBlock {
  item_data?: BlockItem; // Populated block item
}

// ============================================================================
// API Payload Types
// ============================================================================

export interface PageTranslationPayload {
  create?: Array<{
    pages_id: string; // UUID reference to pages.id
    languages_code: { code: LanguageCode | string };
    title?: string | null;
    permalink?: string | null;
  }>;
  update?: Array<{
    id: number;
    title?: string | null;
    permalink?: string | null;
  }>;
  delete?: number[];
}

export interface PageUpdatePayload {
  sort?: number | null;
  status?: DirectusStatus;
  site_id?: number | null;
  translations?: PageTranslationPayload;
  blocks?: {
    create?: Array<{
      collection: BlockCollectionType | string;
      sort: number;
      item: BlockItem | string; // Block item data (for new blocks) or UUID (for existing)
    }>;
    update?: Array<{
      id: string; // PageBlock junction ID
      collection?: BlockCollectionType | string;
      sort?: number;
      item?: BlockItem | string;
    }>;
    delete?: string[]; // PageBlock junction IDs to delete
  };
}

export interface SiteTranslationPayload {
  create?: Array<{
    languages_code: { code: LanguageCode | string };
    title?: string | null;
    description?: string | null;
  }>;
  update?: Array<{
    id: number;
    title?: string | null;
    description?: string | null;
  }>;
  delete?: number[];
}

export interface SiteUpdatePayload {
  slug?: string | null;
  domain?: string | null;
  status?: DirectusStatus;
  sort?: number | null;
  logo?: string | null;
  favicon?: string | null;
  event_id?: number | null;
  tenant_id?: number | null;
  translations?: SiteTranslationPayload;
}

export interface NavigationUpdatePayload {
  type?: 'header' | 'footer';
  status?: DirectusStatus;
  site?: number | null;
  items?: NavigationItemPayload;
}

// ============================================================================
// Query Response Types (with nested relations)
// ============================================================================

export interface PageDetailResponse extends Page {
  translations: Array<PageTranslation & {
    languages_code: LanguageCode | string | { code: LanguageCode | string };
  }>;
  blocks?: Array<PageBlockWithItem>;
  site?: Site & {
    translations?: SiteTranslation[];
  };
}

export interface NavigationDetailResponse extends Navigation {
  items?: Array<NavigationItem & {
    translations?: NavigationItemTranslation[];
    children?: NavigationItem[];
    page_item?: Page;
  }>;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type guard to check if languages_code is an object
 */
export function isLanguageCodeObject(
  langCode: LanguageCode | string | { code: LanguageCode | string }
): langCode is { code: LanguageCode | string } {
  return typeof langCode === 'object' && langCode !== null && 'code' in langCode;
}

/**
 * Extract language code from various formats
 */
export function extractLanguageCode(
  langCode: LanguageCode | string | { code: LanguageCode | string }
): string {
  return isLanguageCodeObject(langCode) ? langCode.code : langCode;
}

/**
 * Normalize page translation to have consistent languages_code format
 */
export function normalizePageTranslation(
  translation: PageTranslation | (PageTranslation & { languages_code: LanguageCode | string | { code: LanguageCode | string } })
): PageTranslation {
  return {
    ...translation,
    languages_code: extractLanguageCode(translation.languages_code) as LanguageCode,
  };
}

/**
 * Normalize navigation item translation
 */
export function normalizeNavigationItemTranslation(
  translation: NavigationItemTranslation | (NavigationItemTranslation & { languages_code: LanguageCode | string | { code: LanguageCode | string } })
): NavigationItemTranslation {
  return {
    ...translation,
    languages_code: extractLanguageCode(translation.languages_code) as LanguageCode,
  };
}

