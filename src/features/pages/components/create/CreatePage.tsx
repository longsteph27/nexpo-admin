'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { siteApi } from '@/lib/api';
import { useCreatePage } from '@/features/pages/hooks/usePages';
import { Button } from '@/components/ui/button-base';
import { Icon } from '@iconify/react';
import Input from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreatePageProps {
  eventId: string;
}

export default function CreatePage({ eventId }: CreatePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [permalink, setPermalink] = useState('');
  const [language, setLanguage] = useState('en-US');

  // Fetch site data
  const { data: site } = useQuery({
    queryKey: ['site', { eventId }],
    queryFn: () => siteApi.getSiteByEvent(eventId),
    select: (r) => r.data || null,
    enabled: !!eventId,
  });

  const createPageMutation = useCreatePage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!site) {
      toast.error('No site found');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!permalink.trim()) {
      toast.error('Permalink is required');
      return;
    }

    try {
      const result = await createPageMutation.mutateAsync({
        site_id: site.id,
        sort: 1,
        translations: {
          create: [
            { 
              languages_code: { code: language }, 
              title: title.trim(),
              permalink: permalink.trim()
            },
          ],
        },
      });

      if (result) {
        // Invalidate pages cache
        queryClient.invalidateQueries({ queryKey: ['pages'] });

        // Redirect to page builder
        const pageId = (result as any).id;
        toast.success('Page created successfully!', {
          description: 'Redirecting to page editor...',
        });
        router.push(`/events/${eventId}/pages/${pageId}`);
      }
    } catch (error) {
      toast.error('Failed to create page', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Icon icon="lucide:globe" className="w-16 h-16 text-content-tertiary mb-4" />
        <h3 className="text-xl font-semibold text-content-primary mb-2">
          No Site Found
        </h3>
        <p className="text-content-tertiary mb-6">
          Create a site first to manage pages
        </p>
        <Button onClick={() => router.push(`/events/${eventId}/sites`)}>
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Go to Sites
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Create New Page</h1>
        <p className="text-content-secondary mt-1">
          Add a new page to your event website
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-content-primary mb-2">
            Language<span className="text-red-500">*</span>
          </label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English</SelectItem>
              <SelectItem value="vi-VN">Vietnamese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Page Title*"
          placeholder="Home Page"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Permalink*"
          placeholder="/home"
          value={permalink}
          onChange={(e) => setPermalink(e.target.value)}
          required
          helperText="URL path for this page (e.g., /home, /about)"
        />

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            loading={createPageMutation.isPending}
          >
            <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
            Create Page
          </Button>
        </div>
      </form>
    </div>
  );
}


