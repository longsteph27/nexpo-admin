import type {
  DirectusStatus,
  LanguageCode,
  Navigation,
  NavigationItem,
  NavigationItemTranslation,
  Site,
  SiteTranslation,
} from '@/types/directus-collections';

export const SITE_LANGUAGE_CODES = ['en-US', 'vi-VN'] as const satisfies readonly LanguageCode[];

export interface SiteCategoryTranslation {
  id?: number;
  languages_code: LanguageCode | string;
  title?: string | null;
}

export interface SiteCategory {
  id: number | string;
  color?: string | null;
  sort?: number | null;
  translations?: SiteCategoryTranslation[];
}

export interface SitePostCategory {
  id?: number | string;
  translations?: SiteCategoryTranslation[];
}

export interface SitePostAuthor {
  id?: number | string;
  name?: string | null;
}

export interface SitePost {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  status?: DirectusStatus | string;
  type?: string | null;
  date_published?: string | null;
  summary?: string | null;
  category?: SitePostCategory | null;
  author?: SitePostAuthor | null;
}

export interface SiteTestimonial {
  id: number | string;
  title?: string | null;
  subtitle?: string | null;
  status?: DirectusStatus | string;
  company?: string | null;
  content?: string | null;
}

export interface SiteTeamTranslation {
  languages_code: LanguageCode | string;
  job_title?: string | null;
  bio?: string | null;
}

export interface SiteTeamMember {
  id: number | string;
  name?: string | null;
  status?: DirectusStatus | string;
  image?: string | null;
  translations?: SiteTeamTranslation[];
}

export interface SiteRedirect {
  id: number | string;
  url_old?: string | null;
  url_new?: string | null;
  response_code?: number | string | null;
}

export interface SiteGlobalSettings {
  id: number | string;
  title?: string | null;
  url?: string | null;
  tagline?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface SiteLanguageLink {
  id: number | string;
  languages_code?: LanguageCode | string | null;
  languages_id?: {
    code?: string;
    name?: string;
    direction?: 'ltr' | 'rtl' | string | null;
  } | null;
}

export interface SiteNavigationTranslation {
  id?: number;
  languages_code: LanguageCode | string;
  title?: string | null;
}

export interface SiteNavigationItemSummary extends Pick<NavigationItem, 'id' | 'type' | 'sort'> {
  translations?: NavigationItemTranslation[];
}

export interface SiteNavigationSummary extends Pick<Navigation, 'id' | 'status' | 'type'> {
  translations?: SiteNavigationTranslation[];
  items?: SiteNavigationItemSummary[];
}

export interface SitePageBlockSummary {
  id: string;
  collection?: string | null;
}

export interface SitePageTranslationSummary {
  id?: number;
  languages_code: LanguageCode | string;
  title?: string | null;
  permalink?: string | null;
}

export interface SitePageSummary {
  id: string;
  sort?: number | null;
  status?: DirectusStatus | string;
  slug?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  translations?: SitePageTranslationSummary[];
  blocks?: SitePageBlockSummary[];
}

export interface FeatureSite extends Site {
  posts?: SitePost[];
  testimonials?: SiteTestimonial[];
  team?: SiteTeamMember[];
  redirects?: SiteRedirect[];
  navigation?: SiteNavigationSummary[];
  pages?: SitePageSummary[];
  categories?: SiteCategory[];
  globals?: SiteGlobalSettings[];
  languages?: SiteLanguageLink[];
  translations?: SiteTranslation[];
}

export interface SiteTranslationFormData {
  id?: number;
  languages_code: LanguageCode;
  title?: string;
  description?: string;
}

export interface SiteInfoEditState {
  slug: string;
  domain?: string | null;
  status: DirectusStatus | string;
  logo: string | null;
  favicon: string | null;
  translations: SiteTranslationFormData[];
}

export interface SiteListItem extends Pick<FeatureSite, 'id' | 'slug' | 'domain' | 'status' | 'date_updated'> {
  translations?: SiteTranslation[];
  pages?: Array<{ id: string }>;
  navigation?: Array<{ id: string }>;
  categories?: Array<{ id: number | string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedSitesResponse {
  sites: SiteListItem[];
  pagination: PaginationMeta;
}

export interface SitePageListItem {
  id: string;
  status?: DirectusStatus | string;
  site_id?: number | null;
  slug?: string | null;
  sort?: number | null;
  date_updated?: string | null;
  translations?: SitePageTranslationSummary[];
  blocks?: SitePageBlockSummary[];
}

export interface PaginatedPagesResponse<T = SitePageListItem> {
  pages: T[];
  pagination: PaginationMeta;
}

export interface SiteBasicInfoTranslationsMapEntry {
  id?: number;
  title: string;
  description: string;
}

export type SiteBasicInfoTranslationsMap = Record<LanguageCode, SiteBasicInfoTranslationsMapEntry>;

export interface SiteBasicInfoFormData {
  slug: string;
  domain: string;
  status: DirectusStatus | string;
  logo: string | null;
  favicon: string | null;
  translations: SiteBasicInfoTranslationsMap;
}

export interface SiteSocialLink {
  service: string;
  url: string;
}

export interface SiteGlobalSettingsFormData {
  title: string;
  tagline: string;
  description: string;
  url: string;
  theme: Record<string, unknown>;
  logo_on_light_bg: string | null;
  logo_on_dark_bg: string | null;
  favicon: string | null;
  og_image: string | null;
  street_address: string;
  address_locality: string;
  address_region: string;
  address_country: string;
  postal_code: string;
  email: string;
  phone: string;
  social_links: SiteSocialLink[];
  build_hook_url: string;
}


