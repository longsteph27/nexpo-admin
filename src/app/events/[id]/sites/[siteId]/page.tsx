'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEvent } from '@/hooks/useEvents';
import { siteApi } from '@/lib/api';
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
} from '@/components/sites';

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = String(params?.id || '');
  const siteId = String(params?.siteId || '');

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<'en-US' | 'vi-VN'>('en-US');

  // Queries
  const { data: event } = useEvent(eventId);
  const { data: siteResponse, isLoading, error } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteApi.getSite(Number(siteId)),
    enabled: !!siteId,
  });

  // Extract site data from API response
  const site = siteResponse?.data;

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
      
      // Đảm bảo có đủ translations cho cả 2 ngôn ngữ
      const existingTranslations = site.translations || [];
      const enTranslation = existingTranslations.find((t: any) => t.languages_code === 'en-US') || 
        { languages_code: 'en-US', title: '', description: '' };
      const viTranslation = existingTranslations.find((t: any) => t.languages_code === 'vi-VN') || 
        { languages_code: 'vi-VN', title: '', description: '' };
      
      const editDataToSet = {
        slug: site.slug || '',
        domain: site.domain || '',
        status: site.status || 'draft',
        logo: site.logo || null,
        favicon: site.favicon || null,
        translations: [enTranslation, viTranslation]
      };
      
      console.log('[SiteDetailPage] Setting editData:', editDataToSet);
      setEditData(editDataToSet);
    }
  }, [site, isEditing]);

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (site) {
      // Đảm bảo có đủ translations cho cả 2 ngôn ngữ
      const existingTranslations = site.translations || [];
      const enTranslation = existingTranslations.find((t: any) => t.languages_code === 'en-US') || 
        { languages_code: 'en-US', title: '', description: '' };
      const viTranslation = existingTranslations.find((t: any) => t.languages_code === 'vi-VN') || 
        { languages_code: 'vi-VN', title: '', description: '' };
      
      setEditData({
        slug: site.slug || '',
        domain: site.domain || '',
        status: site.status || 'draft',
        logo: site.logo || null,
        favicon: site.favicon || null,
        translations: [enTranslation, viTranslation]
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Transform data to match API expectations
      const saveData = {
        slug: editData.slug,
        domain: editData.domain,
        status: editData.status,
        logo: editData.logo,
        favicon: editData.favicon,
        translations: {
          update: editData.translations
            .filter((t: any) => t.id) // Only existing translations
            .map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description
            })),
          create: editData.translations
            .filter((t: any) => !t.id) // Only new translations
            .map((t: any) => ({
              languages_code: { code: t.languages_code },
              title: t.title,
              description: t.description
            }))
        }
      };
      
      console.log('[handleSave] Saving site data:', saveData);
      await saveSiteMutation.mutateAsync(saveData);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const updateEditData = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTranslation = (langCode: string, field: string, value: string) => {
    setEditData((prev: any) => {
      const updatedTranslations = prev.translations.map((t: any) =>
        t.languages_code === langCode ? { ...t, [field]: value } : t
      );
      
      // Đảm bảo luôn có đủ 2 translations
      const hasEn = updatedTranslations.some((t: any) => t.languages_code === 'en-US');
      const hasVi = updatedTranslations.some((t: any) => t.languages_code === 'vi-VN');
      
      if (!hasEn) {
        updatedTranslations.push({ languages_code: 'en-US', title: '', description: '' });
      }
      if (!hasVi) {
        updatedTranslations.push({ languages_code: 'vi-VN', title: '', description: '' });
      }
      
      return {
        ...prev,
        translations: updatedTranslations
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
        <PagesCard site={site} eventId={eventId} siteId={siteId} />

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
        </div>
    </div>
  );
}
