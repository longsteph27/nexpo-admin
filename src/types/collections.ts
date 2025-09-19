// Collection types based on schema-events.json
export interface CollectionMeta {
  collection: string;
  icon?: string;
  note?: string;
  display_template?: string;
  hidden: boolean;
  singleton: boolean;
  translations?: Array<{
    language: string;
    translation: string;
    singular: string;
    plural: string;
  }>;
  archive_field?: string;
  archive_app_filter: boolean;
  archive_value?: string;
  unarchive_value?: string;
  sort_field?: string;
  accountability: string;
  color?: string;
  item_duplication_fields?: any;
  sort: number;
  group?: string;
  collapse?: string;
  preview_url?: string;
  versioning: boolean;
}

export interface Collection {
  collection: string;
  meta: CollectionMeta;
  schema: Record<string, any>;
}

// Main collections from schema-events.json
export const COLLECTIONS = [
  'block_button_group',
  'block_button',
  'block_columns_rows',
  'block_columns',
  'block_cta',
  'block_divider',
  'block_faqs',
  'block_form',
  'block_gallery_files',
  'block_gallery',
  'block_hero',
  'block_html',
  'block_logocloud_logos',
  'block_logocloud',
  'block_quote',
  'block_richtext',
  'block_step_items',
  'block_steps',
  'block_team',
  'block_testimonial_slider_items',
  'block_testimonials',
  'block_video',
  'blocks',
  'categories',
  'events',
  'form_answers',
  'form_fields',
  'form_submissions',
  'forms',
  'globals',
  'navigation_items',
  'navigation',
  'page_blocks',
  'pages_blog',
  'pages_projects',
  'pages',
  'post_gallery_items',
  'posts',
  'redirects',
  'seo',
  'sites',
  'team',
  'testimonials'
] as const;

export type CollectionName = typeof COLLECTIONS[number];

// Generic item interface for CRUD operations
export interface CollectionItem {
  id?: string | number;
  [key: string]: any;
}

// API response types
export interface CollectionResponse<T = any> {
  data: T[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface SingleItemResponse<T = any> {
  data: T;
}

// CRUD operation types
export interface CreateItemRequest {
  collection: string;
  data: Record<string, any>;
}

export interface UpdateItemRequest {
  collection: string;
  id: string | number;
  data: Record<string, any>;
}

export interface DeleteItemRequest {
  collection: string;
  id: string | number;
}

// Collection metadata for UI
export interface CollectionInfo {
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
  description?: string;
  isSingleton: boolean;
  hasArchive: boolean;
  group?: string;
}

