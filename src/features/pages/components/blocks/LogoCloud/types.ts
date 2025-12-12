import type { LanguageOption } from '@/types/directus-collections';

interface DirectusFile {
    id: string;
    type?: string;
    title?: string;
    modified_on?: string;
    filename_download?: string;
}

export interface LogoCloudTranslation {
    id?: number;
    block_logocloud_id?: string;
    languages_code?: string;
    title?: string | null;
    headline?: string | null;
}

export interface LogoCloudLogo {
    id: string;
    block_logocloud_id?: string;
    directus_files_id: string | DirectusFile;
    sort: number;
}

export interface BlockLogoCloud {
    id: string;
    tenant_id?: number;
    event_id?: number;
    translations?: LogoCloudTranslation[];
    logos?: LogoCloudLogo[];
    title?: string;
    headline?: string;
}

export interface LogoImageData {
    id: string;
    file?: DirectusFile;
}
