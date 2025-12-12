'use client';

import React from 'react';
import Image from 'next/image';
import { assetsApi } from '@/lib/api';
import BlockContainer from '@/components/BlockContainer';
import TypographyTitle from '@/components/typography/TypographyTitle';
import TypographyHeadline from '@/components/typography/TypographyHeadline';
import type { BlockLogoCloud, LogoCloudTranslation, LogoCloudLogo } from './types';

interface DirectusFile {
    id: string;
    type?: string;
    title?: string;
    modified_on?: string;
    filename_download?: string;
}

interface LogoCloudPreviewProps {
    data: BlockLogoCloud | Record<string, unknown>;
    lang: string;
}

export default function LogoCloudPreview({
    data,
    lang,
}: LogoCloudPreviewProps) {
    const directusLang = lang === 'en' ? 'en-US' : 'vi-VN';
    const translations = Array.isArray(data.translations) ? (data.translations as LogoCloudTranslation[]) : [];
    const translation = translations.find(t => t.languages_code === directusLang) || translations[0];

    // Fallback to direct properties if translation specific ones aren't found
    const title = translation?.title || (data.title as string) || '';
    const headline = translation?.headline || (data.headline as string) || '';

    const logoItems = ((data as Record<string, unknown>).logos as LogoCloudLogo[]) || [];
    const logos = logoItems.map((item) => {
        const fileId = typeof item.directus_files_id === 'string'
            ? item.directus_files_id
            : (item.directus_files_id as DirectusFile)?.id;

        const fileMetadata = typeof item.directus_files_id === 'object' && item.directus_files_id !== null
            ? (item.directus_files_id as DirectusFile)
            : undefined;

        // Ensure we have a valid ID
        if (!fileId) return null;

        return {
            id: fileId,
            file: fileMetadata,
        };
    }).filter((item): item is { id: string; file: DirectusFile | undefined } => item !== null);

    if (logos.length === 0 && !title && !headline) {
        return (
            <div className="text-center py-12 text-neutral-400">
                <p>No logos added yet. Add some company logos to display them here.</p>
            </div>
        );
    }

    return (
        <BlockContainer className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Title */}
            {title && (
                <TypographyTitle className="text-neutral-500 font-semibold mb-4">
                    {title}
                </TypographyTitle>
            )}

            {/* Headline */}
            {headline && (
                <TypographyHeadline
                    className="text-primary-600 font-semibold mb-8"
                    size="xl"
                    content={headline}
                />
            )}

            {/* Marquee Container */}
            {logos.length > 0 && (
                <div className="mt-8 lg:mt-10 overflow-hidden w-full relative">
                    <style jsx>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-marquee {
                            animation: marquee 30s linear infinite;
                            width: max-content;
                        }
                        .animate-marquee:hover {

                        }
                    `}</style>

                    <div className="flex animate-marquee">
                        {/* Duplicate content for seamless loop */}
                        {[...logos, ...logos].map((logo, index) => (
                            <div
                                key={`${logo.id}-${index}`}
                                className="flex-shrink-0 w-48 h-48 flex items-center justify-center rounded-xl bg-white p-8 mx-4 hover:z-10 hover:scale-125 transition-transform duration-300 ease-in-out shadow-sm"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={assetsApi.getAssetUrl(logo.id)}
                                        alt={logo.file?.title || ''}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </BlockContainer>
    );
}
