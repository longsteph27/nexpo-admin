'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import { globalApi } from '@/lib/api';
import { toast } from 'sonner';
import Input from '@/components/ui/input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useAuthStore } from '@/store/auth';

interface GlobalSettingsProps {
  siteId: number;
  global: {
    id: string;
    site_id: number;
    title?: string;
    tagline?: string;
    description?: string;
    url?: string;
    theme?: Record<string, unknown>;
    logo_on_light_bg?: string | null;
    logo_on_dark_bg?: string | null;
    favicon?: string | null;
    og_image?: string | null;
    street_address?: string;
    address_locality?: string;
    address_region?: string;
    address_country?: string;
    postal_code?: string;
    email?: string;
    phone?: string;
    social_links?: Array<{ service: string; url: string }>;
    build_hook_url?: string;
  } | null;
  onUpdate: () => void;
}

const DEFAULT_THEME = {
  primary: "#1E40AF",
  orange: "slate",
  borderRadius: "xl",
  fonts: {
    families: {
      display: "Roboto, Arial, sans-serif",
      body: "Poppins, Open Sans, sans-serif",
      code: "Source Code Pro, Consolas, monospace"
    }
  }
};

export default function GlobalSettings({ siteId, global, onUpdate }: GlobalSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'seo' | 'theming' | 'contact' | 'social'>('seo');
  const selectedTenant = useAuthStore((state) => state.selectedTenant);
  const folderId = (selectedTenant as any)?.folder_files_id;

  const [formData, setFormData] = useState({
    title: global?.title || '',
    tagline: global?.tagline || '',
    description: global?.description || '',
    url: global?.url || '',
    theme: global?.theme || DEFAULT_THEME,
    logo_on_light_bg: global?.logo_on_light_bg || null,
    logo_on_dark_bg: global?.logo_on_dark_bg || null,
    favicon: global?.favicon || null,
    og_image: global?.og_image || null,
    street_address: global?.street_address || '',
    address_locality: global?.address_locality || '',
    address_region: global?.address_region || '',
    address_country: global?.address_country || '',
    postal_code: global?.postal_code || '',
    email: global?.email || '',
    phone: global?.phone || '',
    social_links: global?.social_links || [],
    build_hook_url: global?.build_hook_url || '',
  });

  const [themeJson, setThemeJson] = useState(JSON.stringify(formData.theme, null, 2));

  useEffect(() => {
    if (global) {
      const newData = {
        title: global.title || '',
        tagline: global.tagline || '',
        description: global.description || '',
        url: global.url || '',
        theme: global.theme || DEFAULT_THEME,
        logo_on_light_bg: global.logo_on_light_bg || null,
        logo_on_dark_bg: global.logo_on_dark_bg || null,
        favicon: global.favicon || null,
        og_image: global.og_image || null,
        street_address: global.street_address || '',
        address_locality: global.address_locality || '',
        address_region: global.address_region || '',
        address_country: global.address_country || '',
        postal_code: global.postal_code || '',
        email: global.email || '',
        phone: global.phone || '',
        social_links: global.social_links || [],
        build_hook_url: global.build_hook_url || '',
      };
      setFormData(newData);
      setThemeJson(JSON.stringify(newData.theme, null, 2));
    }
  }, [global]);

  const handleThemeJsonChange = (value: string) => {
    setThemeJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData({ ...formData, theme: parsed });
    } catch (error) {
      // Invalid JSON, don't update formData
    }
  };

  const handleSave = async () => {
    if (!global) {
      toast.error('No global settings found');
      return;
    }

    setIsSaving(true);
    try {
      // Validate theme JSON
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

  const addSocialLink = () => {
    setFormData({
      ...formData,
      social_links: [...formData.social_links, { service: '', url: '' }]
    });
  };

  const removeSocialLink = (index: number) => {
    setFormData({
      ...formData,
      social_links: formData.social_links.filter((_, i) => i !== index)
    });
  };

  const updateSocialLink = (index: number, field: 'service' | 'url', value: string) => {
    const updated = [...formData.social_links];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, social_links: updated });
  };

  if (!global) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12">
        <div className="text-center">
          <Icon icon="lucide:globe" className="w-16 h-16 text-content-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No Global Settings</h3>
          <p className="text-content-tertiary mb-6">Global settings haven't been configured for this site yet.</p>
          <Button onClick={() => {/* Create global logic */}}>
            <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
            Create Global Settings
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'seo' as const, label: 'SEO & Info', icon: 'lucide:search' },
    { id: 'theming' as const, label: 'Theming', icon: 'lucide:palette' },
    { id: 'contact' as const, label: 'Contact', icon: 'lucide:mail' },
    { id: 'social' as const, label: 'Social & Build', icon: 'lucide:share-2' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Global Settings</h2>
          <p className="text-xs text-content-tertiary mt-0.5">Site-wide configuration and branding</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    title: global.title || '',
                    tagline: global.tagline || '',
                    description: global.description || '',
                    url: global.url || '',
                    theme: global.theme || DEFAULT_THEME,
                    logo_on_light_bg: global.logo_on_light_bg || null,
                    logo_on_dark_bg: global.logo_on_dark_bg || null,
                    favicon: global.favicon || null,
                    og_image: global.og_image || null,
                    street_address: global.street_address || '',
                    address_locality: global.address_locality || '',
                    address_region: global.address_region || '',
                    address_country: global.address_country || '',
                    postal_code: global.postal_code || '',
                    email: global.email || '',
                    phone: global.phone || '',
                    social_links: global.social_links || [],
                    build_hook_url: global.build_hook_url || '',
                  });
                  setThemeJson(JSON.stringify(global.theme || DEFAULT_THEME, null, 2));
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
      <div className="p-6">
        {/* SEO & Info Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Site Title</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Awesome Event"
                  className="w-full"
                />
              ) : (
                <div className="text-content-primary">{formData.title || '—'}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Tagline</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="The best event of the year"
                  className="w-full"
                />
              ) : (
                <div className="text-content-primary">{formData.tagline || '—'}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Site description for SEO..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <div className="text-content-primary">{formData.description || '—'}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Base URL</label>
              {isEditing ? (
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://myevent.com"
                  className="w-full"
                />
              ) : (
                <code className="text-sm font-mono text-blue-600">{formData.url || '—'}</code>
              )}
            </div>

            {/* OG Image */}
            {isEditing && folderId && (
              <div>
                <label className="text-sm font-medium text-content-primary block mb-3">
                  Open Graph Image
                  <span className="text-xs text-content-tertiary font-normal ml-2">(Social media preview)</span>
                </label>
                <ImageUploadField
                  value={formData.og_image}
                  onChange={(assetId) => setFormData({ ...formData, og_image: assetId })}
                  folderId={folderId}
                >
                  {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                    <div className="space-y-2">
                      <div
                        onClick={openPicker}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                            <span className="text-sm text-gray-500">Uploading...</span>
                          </div>
                        ) : hasImage ? (
                          <img src={imageUrl} alt="OG Image" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-2">
                              <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Upload OG Image</span>
                            <span className="text-xs text-gray-400 mt-1">1200 × 630 px recommended</span>
                          </div>
                        )}
                      </div>
                      {hasImage && (
                        <Button variant="ghost" size="sm" onClick={removeImage} className="w-full">
                          <Icon icon="lucide:trash-2" className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </ImageUploadField>
              </div>
            )}
          </div>
        )}

        {/* Theming Tab */}
        {activeTab === 'theming' && (
          <div className="space-y-6">
            {/* Theme JSON Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-content-primary">Theme Configuration</label>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const formatted = JSON.stringify(DEFAULT_THEME, null, 2);
                      setThemeJson(formatted);
                      setFormData({ ...formData, theme: DEFAULT_THEME });
                    }}
                  >
                    <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={themeJson}
                    onChange={(e) => handleThemeJsonChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={16}
                    placeholder={JSON.stringify(DEFAULT_THEME, null, 2)}
                  />
                  <div className="flex items-start space-x-2 text-xs text-content-tertiary bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Icon icon="lucide:info" className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700 mb-1">Theme JSON Format:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li><code>primary</code>: Primary color (hex)</li>
                        <li><code>orange</code>: Secondary color palette name</li>
                        <li><code>borderRadius</code>: Border radius preset (sm, md, lg, xl, 2xl)</li>
                        <li><code>fonts.families</code>: Font family definitions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm font-mono text-content-primary">
                    {JSON.stringify(formData.theme, null, 2)}
                  </code>
                </pre>
              )}
            </div>

            {/* Logo Uploads */}
            {isEditing && folderId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                {/* Logo on Light Background */}
                <div>
                  <label className="text-sm font-medium text-content-primary block mb-3">Logo (Light Background)</label>
                  <ImageUploadField
                    value={formData.logo_on_light_bg}
                    onChange={(assetId) => setFormData({ ...formData, logo_on_light_bg: assetId })}
                    folderId={folderId}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <div className="space-y-2">
                        <div
                          onClick={openPicker}
                          className="w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all"
                        >
                          {isUploading ? (
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-gray-400 animate-spin" />
                          ) : hasImage ? (
                            <img src={imageUrl} alt="Logo Light" className="max-w-full max-h-full object-contain p-4" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-2">
                                <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-500 font-medium">Upload</span>
                            </div>
                          )}
                        </div>
                        {hasImage && (
                          <Button variant="ghost" size="sm" onClick={removeImage} className="w-full">
                            <Icon icon="lucide:trash-2" className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </ImageUploadField>
                </div>

                {/* Logo on Dark Background */}
                <div>
                  <label className="text-sm font-medium text-content-primary block mb-3">Logo (Dark Background)</label>
                  <ImageUploadField
                    value={formData.logo_on_dark_bg}
                    onChange={(assetId) => setFormData({ ...formData, logo_on_dark_bg: assetId })}
                    folderId={folderId}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <div className="space-y-2">
                        <div
                          onClick={openPicker}
                          className="w-full h-40 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-500 hover:bg-gray-800 cursor-pointer transition-all"
                        >
                          {isUploading ? (
                            <Icon icon="lucide:loader-2" className="w-8 h-8 text-gray-400 animate-spin" />
                          ) : hasImage ? (
                            <img src={imageUrl} alt="Logo Dark" className="max-w-full max-h-full object-contain p-4" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center mb-2">
                                <Icon icon="lucide:plus" className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-300 font-medium">Upload</span>
                            </div>
                          )}
                        </div>
                        {hasImage && (
                          <Button variant="ghost" size="sm" onClick={removeImage} className="w-full">
                            <Icon icon="lucide:trash-2" className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </ImageUploadField>
                </div>
              </div>
            )}

            {/* Favicon */}
            {isEditing && folderId && (
              <div className="border-t border-gray-200 pt-6">
                <label className="text-sm font-medium text-content-primary block mb-3">Favicon</label>
                <ImageUploadField
                  value={formData.favicon}
                  onChange={(assetId) => setFormData({ ...formData, favicon: assetId })}
                  folderId={folderId}
                >
                  {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                    <div className="space-y-2">
                      <div
                        onClick={openPicker}
                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-all"
                      >
                        {isUploading ? (
                          <Icon icon="lucide:loader-2" className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : hasImage ? (
                          <img src={imageUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center mb-1">
                              <Icon icon="lucide:plus" className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Upload</span>
                          </div>
                        )}
                      </div>
                      {hasImage && (
                        <Button variant="ghost" size="sm" onClick={removeImage}>
                          <Icon icon="lucide:trash-2" className="w-3 h-3 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </ImageUploadField>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@myevent.com"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.email || '—'}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">Phone</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.phone || '—'}</div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-content-primary block mb-2">Street Address</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full"
                />
              ) : (
                <div className="text-content-primary">{formData.street_address || '—'}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">City</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.address_locality}
                    onChange={(e) => setFormData({ ...formData, address_locality: e.target.value })}
                    placeholder="New York"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.address_locality || '—'}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">State/Region</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.address_region}
                    onChange={(e) => setFormData({ ...formData, address_region: e.target.value })}
                    placeholder="NY"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.address_region || '—'}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">Country</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.address_country}
                    onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                    placeholder="United States"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.address_country || '—'}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-content-primary block mb-2">Postal Code</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="10001"
                    className="w-full"
                  />
                ) : (
                  <div className="text-content-primary">{formData.postal_code || '—'}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Social & Build Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-content-primary">Social Media Links</label>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={addSocialLink}>
                    <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {formData.social_links.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <Icon icon="lucide:share-2" className="w-8 h-8 text-content-tertiary mx-auto mb-2" />
                      <p className="text-sm text-content-tertiary">No social links added</p>
                    </div>
                  ) : (
                    formData.social_links.map((link, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Input
                          type="text"
                          value={link.service}
                          onChange={(e) => updateSocialLink(index, 'service', e.target.value)}
                          placeholder="facebook"
                          className="w-32 flex-shrink-0"
                        />
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSocialLink(index)}
                        >
                          <Icon icon="lucide:trash-2" className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.social_links.length === 0 ? (
                    <div className="text-content-tertiary text-sm">No social links configured</div>
                  ) : (
                    formData.social_links.map((link, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Icon icon={`lucide:${link.service}`} className="w-5 h-5 text-content-tertiary" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-content-primary capitalize">{link.service}</div>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                            {link.url}
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Build Hook */}
            <div className="border-t border-gray-200 pt-6">
              <label className="text-sm font-medium text-content-primary block mb-2">
                Build Hook URL
                <span className="text-xs text-content-tertiary font-normal ml-2">(Deployment trigger)</span>
              </label>
              {isEditing ? (
                <Input
                  type="url"
                  value={formData.build_hook_url}
                  onChange={(e) => setFormData({ ...formData, build_hook_url: e.target.value })}
                  placeholder="https://api.vercel.com/..."
                  className="w-full"
                />
              ) : (
                <code className="text-sm font-mono text-blue-600 break-all">{formData.build_hook_url || '—'}</code>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

