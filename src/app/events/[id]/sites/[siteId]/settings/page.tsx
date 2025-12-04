'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { globalApi } from '@/lib/api';
import { siteApi } from '@/features/sites';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import { SiteBasicInfo, GlobalSettings } from '@/features/sites';

export default function SiteSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || '');
  const siteId = String(params?.siteId || '');
  const [activeTab, setActiveTab] = useState<'info' | 'global'>('info');

  // Fetch site data
  const { data: site, isLoading: loadingSite, refetch: refetchSite } = useQuery({
    queryKey: ['site-settings', siteId],
    queryFn: () => siteApi.getSite(Number(siteId)),
    select: (r) => r.data || null,
    enabled: !!siteId,
  });

  // Fetch global settings
  const { data: global, isLoading: loadingGlobal, refetch: refetchGlobal } = useQuery({
    queryKey: ['global-settings', siteId],
    queryFn: () => globalApi.getGlobal(Number(siteId)),
    select: (r) => r.data || null,
    enabled: !!siteId,
  });

  const handleUpdate = () => {
    refetchSite();
    refetchGlobal();
  };

  if (loadingSite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-content-primary">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Icon icon="lucide:alert-circle" className="w-16 h-16 text-content-tertiary mb-4" />
        <h3 className="text-xl font-semibold text-content-primary mb-2">Site not found</h3>
        <p className="text-content-tertiary mb-6">The site you're looking for doesn't exist.</p>
        <Button onClick={() => router.push(`/events/${eventId}/sites`)}>
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Back to Sites
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'info' as const, label: 'Site Information', icon: 'lucide:info' },
    { id: 'global' as const, label: 'Global Settings', icon: 'lucide:settings' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push(`/events/${eventId}/sites/${siteId}`)}>
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Site Settings</h1>
            <p className="text-content-secondary mt-1">
              {site.translations?.[0]?.title || site.slug || `Site #${site.id}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-content-tertiary hover:text-content-secondary hover:border-gray-300'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'info' && site && (
          <SiteBasicInfo site={site as any} onUpdate={handleUpdate} />
        )}

        {activeTab === 'global' && (
          loadingGlobal ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <GlobalSettings siteId={Number(siteId)} global={global as any} onUpdate={handleUpdate} />
          )
        )}
      </div>
    </div>
  );
}

