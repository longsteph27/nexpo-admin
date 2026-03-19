'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEvent } from '@/hooks/useEvents';
import { siteApi } from '@/features/sites';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import {
  SiteInfoCard,
  SiteMediaCard,
  NavigationCard,
  PagesCard,
  CategoriesCard,
  PostsCard,
  TeamCard,
  TestimonialsCard,
  LanguagesCard,
  RedirectsCard,
  GlobalsCard,
  CustomDomainCard,
  SITE_LANGUAGE_CODES,
} from '@/features/sites';
import type { FeatureSite, SiteInfoEditState, SiteTranslationFormData } from '@/features/sites';
import type { LanguageCode } from '@/types/directus-collections';

const resolveLanguageCode = (code: LanguageCode | string | { code?: string }): string => {
  if (typeof code === 'string') {
    return code;
  }
  if (code && typeof code === 'object' && 'code' in code) {
    return (code as { code?: string }).code ?? '';
  }
  return '';
};

const buildSiteEditState = (site: FeatureSite): SiteInfoEditState => {
  const translations = site.translations ?? [];
  const ensureTranslation = (language: LanguageCode): SiteTranslationFormData => {
    const match = translations.find(
      (translation) => resolveLanguageCode(translation.languages_code) === language
    );
    return {
      id: match?.id,
      languages_code: language,
      title: match?.title ?? '',
      description: match?.description ?? '',
    };
  };

  return {
    slug: site.slug ?? '',
    domain: site.domain ?? '',
    status: site.status ?? 'draft',
    logo: site.logo ?? null,
    favicon: site.favicon ?? null,
    translations: SITE_LANGUAGE_CODES.map(ensureTranslation),
  };
};

const createEmptyEditState = (): SiteInfoEditState => ({
  slug: '',
  domain: '',
  status: 'draft',
  logo: null,
  favicon: null,
  translations: SITE_LANGUAGE_CODES.map((language) => ({
    languages_code: language,
    title: '',
    description: '',
  })),
});

const ensureLanguagePresence = (
  translations: SiteTranslationFormData[]
): SiteTranslationFormData[] => {
  const byLanguage = new Map<LanguageCode, SiteTranslationFormData>();

  translations.forEach((translation) => {
    const code = resolveLanguageCode(translation.languages_code) as LanguageCode;
    if (SITE_LANGUAGE_CODES.includes(code)) {
      byLanguage.set(code, { ...translation, languages_code: code });
    }
  });

  SITE_LANGUAGE_CODES.forEach((language) => {
    if (!byLanguage.has(language)) {
      byLanguage.set(language, {
        languages_code: language,
        title: '',
        description: '',
      });
    }
  });

  return Array.from(byLanguage.values());
};

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = String(params?.id || '');
  const siteId = String(params?.siteId || '');

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SiteInfoEditState>(createEmptyEditState());
  const [isSaving, setIsSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<LanguageCode>('en-US');

  // Queries
  const { data: event } = useEvent(eventId);
  const { data: siteResponse, isLoading, error } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteApi.getSite(Number(siteId)),
    enabled: !!siteId,
  });

  // Extract site data from API response
  const site = siteResponse?.data as FeatureSite | undefined;

  // Debug API response
  React.useEffect(() => {
    if (siteResponse) {
      console.log('[SiteDetailPage] API Response:', siteResponse);
      console.log('[SiteDetailPage] Extracted site data:', site);
    }
  }, [siteResponse, site]);

  // Mutations
  const saveSiteMutation = useMutation({
    mutationFn: (data: any) => siteApi.updateSite(Number(siteId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      setIsEditing(false);
      setIsSaving(false);
      toast.success('Site updated successfully');
    },
    onError: (error: any) => {
      setIsSaving(false);
      toast.error(error.message || 'Failed to update site');
    },
  });

  // Initialize edit data when site loads
  React.useEffect(() => {
    if (site && !isEditing) {
      console.log('[SiteDetailPage] Site data loaded:', site);
      console.log('[SiteDetailPage] Site translations:', site.translations);
      const nextEditState = buildSiteEditState(site);
      console.log('[SiteDetailPage] Setting editData:', nextEditState);
      setEditData(nextEditState);
    }
  }, [site, isEditing]);

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (site) {
      setEditData(buildSiteEditState(site));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Transform data to match API expectations
      const translationsUpdate = editData.translations
        .filter((translation) => translation.id)
        .map((translation) => ({
          id: translation.id as number,
          title: translation.title,
          description: translation.description,
        }));

      const translationsCreate = editData.translations
        .filter(
          (translation) =>
            !translation.id && (translation.title?.trim() || translation.description?.trim())
        )
        .map((translation) => ({
          languages_code: { code: translation.languages_code },
          title: translation.title,
          description: translation.description,
        }));

      const saveData: Record<string, unknown> = {
        slug: editData.slug,
        domain: editData.domain,
        status: editData.status,
        logo: editData.logo || undefined,
        favicon: editData.favicon || undefined,
      };

      if (translationsUpdate.length > 0 || translationsCreate.length > 0) {
        saveData.translations = {};
        if (translationsUpdate.length > 0) {
          saveData.translations.update = translationsUpdate;
        }
        if (translationsCreate.length > 0) {
          saveData.translations.create = translationsCreate;
        }
      }

      console.log('[handleSave] Saving site data:', saveData);
      await saveSiteMutation.mutateAsync(saveData);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const updateEditData = <K extends keyof SiteInfoEditState>(
    field: K,
    value: SiteInfoEditState[K]
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateTranslation = (
    langCode: LanguageCode,
    field: 'title' | 'description',
    value: string
  ) => {
    setEditData((prev) => {
      const translations = prev.translations.map((translation) =>
        translation.languages_code === langCode
          ? { ...translation, [field]: value }
          : translation
      );

      if (!translations.some((translation) => translation.languages_code === langCode)) {
        translations.push({
          languages_code: langCode,
          title: field === 'title' ? value : '',
          description: field === 'description' ? value : '',
        });
      }

      return {
        ...prev,
        translations: ensureLanguagePresence(translations),
      };
    });
  };

  const handlePreviewSite = () => {
    if (!site?.slug) {
      toast.error('Site slug is required to preview the site');
      return;
    }

    // Map language codes to URL format
    const languageMap: Record<string, string> = {
      'en-US': 'en',
      'vi-VN': 'vi'
    };

    const languageCode = languageMap[activeLang] || 'en';
    
    // Check if there's a home page (permalink = '/' or empty)
    const homePage = site.pages?.find((page: any) => {
      const translation = page.translations?.find((t: any) => 
        t.languages_code === activeLang
      );
      return translation?.permalink === '/' || translation?.permalink === '';
    });

    let publicUrl: string;
    
    if (homePage) {
      // If home page exists, go to root
      publicUrl = `https://nxp-public-ruby.vercel.app/${site.slug}/${languageCode}`;
    } else if (site.pages && site.pages.length > 0) {
      // If no home page but pages exist, go to first page
      const firstPage = site.pages[0];
      const translation = firstPage.translations?.find((t: any) => 
        t.languages_code === activeLang
      );
      const permalink = translation?.permalink || '';
      publicUrl = `https://nxp-public-ruby.vercel.app/${site.slug}/${languageCode}/${permalink}`;
    } else {
      // No pages at all, go to root
      publicUrl = `https://nxp-public-ruby.vercel.app/${site.slug}/${languageCode}`;
    }
    
    // Open in new tab
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-content-secondary">Loading site details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-content-primary mb-2">Error Loading Site</h3>
            <p className="text-content-secondary mb-4">
              {error.message || 'Failed to load site details'}
            </p>
            <Button onClick={() => window.location.reload()}>
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No site data
  if (!site) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon icon="lucide:file-x" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-content-primary mb-2">Site Not Found</h3>
            <p className="text-content-secondary mb-4">
              The requested site could not be found.
            </p>
            <Button variant="outline" onClick={() => router.push(`/events/${eventId}/sites`)}>
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Back to Sites
        </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push(`/events/${eventId}/sites`)}>
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {site.translations?.[0]?.title || site.slug || 'Site Details'}
            </h1>
            <p className="text-content-secondary mt-1">Configure your event website settings and content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/events/${eventId}/sites/${siteId}/settings`)}>
            <Icon icon="lucide:settings" className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handlePreviewSite}>
            <Icon icon="lucide:eye" className="w-4 h-4 mr-2" />
            Preview Site
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Site Information */}
        <SiteInfoCard
          site={site}
          isEditing={isEditing}
          editData={editData}
          activeLang={activeLang}
          isSaving={isSaving}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onUpdateEditData={updateEditData}
          onUpdateTranslation={updateTranslation}
          onSetActiveLang={setActiveLang}
        />

          {/* Site Media */}
        <SiteMediaCard 
          site={site} 
          siteId={siteId}
          onUpdateSite={updateEditData}
        />

          {/* Navigation */}
        <NavigationCard site={site} />

          {/* Pages */}
        <PagesCard site={site} eventId={eventId} />

          {/* Categories */}
        <CategoriesCard site={site} />

          {/* Posts */}
        <PostsCard site={site} />

          {/* Team */}
        <TeamCard site={site} />

          {/* Testimonials */}
        <TestimonialsCard site={site} />

          {/* Languages */}
        <LanguagesCard site={site} />

          {/* Redirects */}
        <RedirectsCard site={site} />

        {/* Global Settings */}
        <GlobalsCard site={site} />

        {/* Custom Domain */}
        <CustomDomainCard
          site={site}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['site', siteId] })}
        />
        </div>
    </div>
  );
}
