import type { LanguageCode } from '@/types/directus-collections';

export interface SpeakerTranslation {
  id?: number;
  languages_code: LanguageCode | string;
  bio?: string | null;
  name?: string | null;
  title?: string | null;
  company?: string | null;
}

export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'website' | 'youtube' | string;
  url: string;
}

export interface Speaker {
  id: string;
  status?: string;
  sort?: number;
  event_id?: number;
  name: string;
  position?: string | null;
  company?: string | null;
  photo?: string | null;
  avatar?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  social_links?: SocialLink[] | null;
  translations?: SpeakerTranslation[];
  date_created?: string;
  date_updated?: string;
}

export interface SpeakerListOptions {
  search?: string;
  page?: number;
  limit?: number;
  eventId?: number;
}

export interface SpeakerPayload {
  id?: string;
  status?: string;
  sort?: number;
  name: string;
  position?: string | null;
  company?: string | null;
  linkedin_url?: string | null;
  photo?: string | null;
  avatar?: string | null;
  bio?: string | null;
  social_links?: SocialLink[] | null;
  event_id: number;
  translations?: {
    create?: Array<{
      languages_code: { code: LanguageCode | string };
      bio?: string;
      name?: string;
      title?: string;
      company?: string;
    }>;
    update?: Array<{
      id: number;
      bio?: string;
      name?: string;
      title?: string;
      company?: string;
    }>;
    delete?: number[];
  };
}
