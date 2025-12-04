'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { globalApi } from '@/lib/api';
import type {
  SiteGlobalSettings,
  SiteGlobalSettingsFormData,
  SiteSocialLink,
} from '@/features/sites';

interface GlobalSettingsProps {
  siteId: number;
  global: SiteGlobalSettings | null;
  onUpdate: () => void;
}

const DEFAULT_THEME: Record<string, unknown> = {
  primary: '#1E40AF',
  orange: 'slate',
  borderRadius: 'xl',
  fonts: {
    families: {
      display: 'Roboto, Arial, sans-serif',
      body: 'Poppins, Open Sans, sans-serif',
      code: 'Source Code Pro, Consolas, monospace',
    },
  },
};

const buildInitialFormData = (global: SiteGlobalSettings | null): SiteGlobalSettingsFormData => ({
  title: global?.title ?? '',
  tagline: global?.tagline ?? '',
  description: global?.description ?? '',
  url: global?.url ?? '',
  theme: global?.theme ?? DEFAULT_THEME,
  logo_on_light_bg: global?.logo_on_light_bg ?? null,
  logo_on_dark_bg: global?.logo_on_dark_bg ?? null,
  favicon: global?.favicon ?? null,
  og_image: global?.og_image ?? null,
  street_address: global?.street_address ?? '',
  address_locality: global?.address_locality ?? '',
  address_region: global?.address_region ?? '',
  address_country: global?.address_country ?? '',
  postal_code: global?.postal_code ?? '',
  email: global?.email ?? '',
  phone: global?.phone ?? '',
  social_links: global?.social_links ?? [],
  build_hook_url: global?.build_hook_url ?? '',
});

export default function GlobalSettings({ siteId, global, onUpdate }: GlobalSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'seo' | 'theming' | 'contact' | 'social'>('seo');
  const selectedTenant = useAuthStore((state) => state.selectedTenant);
  const folderId = (selectedTenant as { folder_files_id?: string } | null)?.folder_files_id;

  const initialFormData = useMemo(() => buildInitialFormData(global), [global]);

  const [formData, setFormData] = useState<SiteGlobalSettingsFormData>(initialFormData);
  const [themeJson, setThemeJson] = useState<string>(JSON.stringify(initialFormData.theme, null, 2));

  useEffect(() => {
    const nextData = buildInitialFormData(global);
    setFormData(nextData);
    setThemeJson(JSON.stringify(nextData.theme, null, 2));
  }, [global]);

  if (!global) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12">
        <div className="text-center">
          <Icon icon="lucide:globe" className="w-16 h-16 text-content-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No Global Settings</h3>
          <p className="text-content-tertiary mb-6">
            Global settings haven't been configured for this site yet.
          </p>
          <Button onClick={() => toast.info('Global settings creation is not implemented yet.') }>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
            Create Global Settings
          </Button>
        </div>
      </div>
    );
  }

  const handleThemeJsonChange = (value: string) => {
    setThemeJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => ({ ...prev, theme: parsed }));
    } catch (error) {
      // Ignore invalid JSON while typing
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      try {
        JSON.parse(themeJson);
      } catch (error) {
        toast.error('Invalid theme JSON format');
        setIsSaving(false);
        return;
      }

      const payload = {
        ...formData,
        theme: JSON.parse(themeJson),
      };

      const result = await globalApi.updateGlobal(global.id, payload);
      if (result.success) {
        toast.success('Global settings updated successfully');
        setIsEditing(false);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to update global settings');
      }
    } catch (error) {
      toast.error('Failed to update global settings');
      console.error('Update global error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const nextData = buildInitialFormData(global);
    setFormData(nextData);
    setThemeJson(JSON.stringify(nextData.theme, null, 2));
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      social_links: [...prev.social_links, { service: '', url: '' }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (index: number, field: keyof SiteSocialLink, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.social_links];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, social_links: updated };
    });
  };

  const tabs = [
    { id: 'seo' as const, label: 'SEO & Info', icon: 'lucide:search' },
    { id: 'theming' as const, label: 'Theming', icon: 'lucide:palette' },
    { id: 'contact' as const, label: 'Contact', icon: 'lucide:mail' },
    { id: 'social' as const, label: 'Social & Build', icon: 'lucide:share-2' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Global Settings</h2>
          <p className="text-xs text-content-tertiary mt-0.5">Branding, metadata, and global configuration</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pt-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-content-secondary hover:bg-gray-100'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeTab === 'seo' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Site Title</label>
              {isEditing ? (
                <Input
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Your site title"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.title || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Tagline</label>
              {isEditing ? (
                <Input
                  value={formData.tagline}
                  onChange={(event) => setFormData((prev) => ({ ...prev, tagline: event.target.value }))}
                  placeholder="Short site tagline"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.tagline || '—'}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-primary mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  placeholder="Describe your site for search engines and social media"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[80px]">
                  {formData.description || '—'}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-primary mb-2">Primary URL</label>
              {isEditing ? (
                <Input
                  value={formData.url}
                  onChange={(event) => setFormData((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="https://example.com"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {formData.url || '—'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'theming' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-content-primary mb-2">Logo (Light Background)</label>
              <ImageUploadField
                value={formData.logo_on_light_bg}
                onChange={(assetId) => setFormData((prev) => ({ ...prev, logo_on_light_bg: assetId }))}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      {hasImage && imageUrl ? (
                        <img src={imageUrl} alt="Logo on light" className="max-w-[48px] max-h-[48px]" />
                      ) : (
                        <Icon icon="lucide:plus" className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {hasImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeImage}
                        disabled={isUploading}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </ImageUploadField>

              <label className="block text-sm font-medium text-content-primary mb-2">Logo (Dark Background)</label>
              <ImageUploadField
                value={formData.logo_on_dark_bg}
                onChange={(assetId) => setFormData((prev) => ({ ...prev, logo_on_dark_bg: assetId }))}
                folderId={folderId}
              >
                {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                      onClick={openPicker}
                      disabled={isUploading}
                    >
                      {hasImage && imageUrl ? (
                        <img src={imageUrl} alt="Logo on dark" className="max-w-[48px] max-h-[48px]" />
                      ) : (
                        <Icon icon="lucide:plus" className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {hasImage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeImage}
                        disabled={isUploading}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </ImageUploadField>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-2">Favicon</label>
                  <ImageUploadField
                    value={formData.favicon}
                    onChange={(assetId) => setFormData((prev) => ({ ...prev, favicon: assetId }))}
                    folderId={folderId}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          className="w-12 h-12 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                          onClick={openPicker}
                          disabled={isUploading}
                        >
                          {hasImage && imageUrl ? (
                            <img src={imageUrl} alt="Favicon" className="max-w-[32px] max-h-[32px]" />
                          ) : (
                            <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        {hasImage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={removeImage}
                            disabled={isUploading}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </ImageUploadField>
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-2">OG Image</label>
                  <ImageUploadField
                    value={formData.og_image}
                    onChange={(assetId) => setFormData((prev) => ({ ...prev, og_image: assetId }))}
                    folderId={folderId}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                          onClick={openPicker}
                          disabled={isUploading}
                        >
                          {hasImage && imageUrl ? (
                            <img src={imageUrl} alt="OG image" className="max-w-[48px] max-h-[48px]" />
                          ) : (
                            <Icon icon="lucide:plus" className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {hasImage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={removeImage}
                            disabled={isUploading}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </ImageUploadField>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Theme JSON</label>
              <textarea
                value={themeJson}
                onChange={(event) => handleThemeJsonChange(event.target.value)}
                rows={20}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-content-tertiary mt-2">
                Customize the theme configuration using JSON. Invalid JSON will prevent saving.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Email</label>
              {isEditing ? (
                <Input
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="contact@example.com"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.email || '—'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Phone</label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+84 123 456 789"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.phone || '—'}
                </div>
              )}
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">Street Address</label>
                {isEditing ? (
                  <Input
                    value={formData.street_address}
                    onChange={(event) => setFormData((prev) => ({ ...prev, street_address: event.target.value }))}
                    placeholder="123 Sample Street"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {formData.street_address || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">Locality</label>
                {isEditing ? (
                  <Input
                    value={formData.address_locality}
                    onChange={(event) => setFormData((prev) => ({ ...prev, address_locality: event.target.value }))}
                    placeholder="City"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {formData.address_locality || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">Region</label>
                {isEditing ? (
                  <Input
                    value={formData.address_region}
                    onChange={(event) => setFormData((prev) => ({ ...prev, address_region: event.target.value }))}
                    placeholder="Province/State"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {formData.address_region || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">Country</label>
                {isEditing ? (
                  <Input
                    value={formData.address_country}
                    onChange={(event) => setFormData((prev) => ({ ...prev, address_country: event.target.value }))}
                    placeholder="Country"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {formData.address_country || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">Postal Code</label>
                {isEditing ? (
                  <Input
                    value={formData.postal_code}
                    onChange={(event) => setFormData((prev) => ({ ...prev, postal_code: event.target.value }))}
                    placeholder="700000"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {formData.postal_code || '—'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Build Hook URL</label>
              {isEditing ? (
                <Input
                  value={formData.build_hook_url}
                  onChange={(event) => setFormData((prev) => ({ ...prev, build_hook_url: event.target.value }))}
                  placeholder="https://api.example.com/build-hook"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {formData.build_hook_url || '—'}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-content-primary">Social Links</label>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={addSocialLink}>
                    <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                    Add link
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {formData.social_links.length === 0 && !isEditing ? (
                  <p className="text-sm text-content-tertiary">No social links configured</p>
                ) : (
                  formData.social_links.map((link, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-2">
                      {isEditing ? (
                        <>
                          <Input
                            value={link.service}
                            onChange={(event) => updateSocialLink(index, 'service', event.target.value)}
                            placeholder="Service (e.g., twitter)"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={link.url}
                              onChange={(event) => updateSocialLink(index, 'url', event.target.value)}
                              placeholder="https://social.example.com"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSocialLink(index)}
                              className="text-red-600"
                            >
                              <Icon icon="lucide:trash" className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm">
                            {link.service || '—'}
                          </div>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm">
                            {link.url || '—'}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
