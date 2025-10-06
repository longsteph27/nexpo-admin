'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { siteApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = String(params?.id || '');
  const { selectedTenant } = useAuth();

  const [formData, setFormData] = useState({
    title_en: '',
    permalink: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Get site for this event
  const [siteId, setSiteId] = useState<number | null>(null);

  React.useEffect(() => {
    const fetchSite = async () => {
      const result = await siteApi.getSiteByEvent(eventId);
      if (result.success && result.data?.id) {
        setSiteId(result.data.id);
      }
    };
    fetchSite();
  }, [eventId]);

  // Simple auto-translate helper (basic word mapping)
  const autoTranslateTitle = (enTitle: string): string => {
    const translations: Record<string, string> = {
      'about': 'giới thiệu',
      'about us': 'giới thiệu',
      'contact': 'liên hệ',
      'features': 'tính năng',
      'pricing': 'bảng giá',
      'services': 'dịch vụ',
      'team': 'đội ngũ',
      'blog': 'tin tức',
      'news': 'tin tức',
      'faq': 'câu hỏi thường gặp',
      'faqs': 'câu hỏi thường gặp',
      'home': 'trang chủ',
      'portfolio': 'dự án',
      'gallery': 'thư viện ảnh',
      'testimonials': 'đánh giá',
      'careers': 'tuyển dụng',
    };
    
    const lower = enTitle.toLowerCase();
    return translations[lower] || enTitle;
  };

  const handleCreate = async () => {
    if (!siteId || !formData.title_en || !formData.permalink) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      // Auto-translate Vietnamese title if not provided
      const viTitle = autoTranslateTitle(formData.title_en);
      
      const result = await siteApi.createPage({
        site_id: siteId,
        sort: 0,
        status: 'draft',
        translations: {
          create: [
            {
              languages_code: { code: 'en-US' },
              title: formData.title_en,
              permalink: formData.permalink,
            },
            {
              languages_code: { code: 'vi-VN' },
              title: viTitle,
              permalink: formData.permalink,
            },
          ],
          update: [],
          delete: [],
        },
      });

      if (result.success && result.data) {
        // Invalidate pages cache
        queryClient.invalidateQueries({ queryKey: ['pages'] });

        // Redirect to page builder
        const pageId = (result.data as any).id;
        router.push(`/events/${eventId}/sites/${siteId}/pages/${pageId}`);
      } else {
        alert(result.error || 'Failed to create page');
      }
    } catch (error) {
      console.error('Create page error:', error);
      alert('Failed to create page. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/events/${eventId}/pages`)}
            className="mb-4"
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Back to Pages
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icon icon="lucide:file-plus" className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Create New Page</h1>
              <p className="text-neutral-600">Set up your page and start building</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-6">
          {/* English Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Page Title (English) <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              placeholder="e.g., About Us, Features, Contact"
              className="w-full"
            />
            <p className="text-xs text-neutral-500 mt-1">
              This will appear in navigation and browser tabs
            </p>
          </div>

          {/* Permalink */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Page URL (Permalink) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500">/</span>
              <Input
                value={formData.permalink}
                onChange={(e) => {
                  // Auto-format permalink
                  const permalink = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-/]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  setFormData({ ...formData, permalink });
                }}
                placeholder="about-us"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              URL path for this page (e.g., /about-us or /company/about)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 Vietnamese translation will be auto-generated
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  What happens next?
                </h4>
                <p className="text-xs text-blue-700">
                  After creating the page, you'll be redirected to the Page Builder where you can:
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Add sections and blocks</li>
                  <li>Edit content in multiple languages</li>
                  <li>See live preview as you build</li>
                  <li>Configure header and footer navigation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <Button
              variant="ghost"
              onClick={() => router.push(`/events/${eventId}/pages`)}
            >
              Cancel
            </Button>
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
              onClick={handleCreate}
              disabled={isCreating || !formData.title_en || !formData.permalink || !siteId}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="lucide:arrow-right" className="w-4 h-4 mr-2" />
                  Create & Open Builder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Card */}
        <div className="mt-6 bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Preview</h3>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center space-x-2 text-sm">
              <Icon icon="lucide:link" className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">
                {formData.permalink ? `yoursite.com${formData.permalink}` : 'yoursite.com/your-page'}
              </span>
            </div>
            <div className="mt-3 text-lg font-semibold text-neutral-900">
              {formData.title_en || 'Your Page Title'}
            </div>
            {formData.title_en && (
              <div className="mt-1 text-sm text-neutral-600">
                🇻🇳 {autoTranslateTitle(formData.title_en)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

