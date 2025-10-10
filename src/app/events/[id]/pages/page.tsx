"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEvent } from "@/hooks/useEvents";
import { siteApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function EventPagesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventId = String(params?.id || "");

  // Fetch event data
  const { data: event } = useEvent(eventId);

  // Fetch site data
  const { data: site } = useQuery({
    queryKey: ["site", { eventId }],
    queryFn: () => siteApi.getSiteByEvent(eventId),
    select: (r) => r.data || null,
    enabled: !!eventId,
  });

  // Fetch pages
  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["pages", { siteId: site?.id }],
    queryFn: () =>
      site
        ? siteApi.getPagesBySite(site.id)
        : Promise.resolve({ success: true, data: [] } as any),
    select: (r: any) => r.data || [],
    enabled: !!site?.id,
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (values: {
      title: string;
      permalink: string;
      language: string;
    }) => {
      if (!site) throw new Error("No site found");

      const result = await siteApi.createPage({
        site_id: site.id,
        sort: (pages.length || 0) + 1,
        translations: {
          create: [
            { 
              languages_code: { code: values.language }, 
              title: values.title,
              permalink: values.permalink
            },
          ],
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create page");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pages", { siteId: site?.id }],
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-content-primary";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-content-primary";
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
          <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
          Go to Sites
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Pages</h1>
          <p className="text-content-secondary mt-1">
            Manage pages for your event website
          </p>
        </div>
        <Button 
          variant="gradient"
          onClick={() => router.push(`/events/${eventId}/pages/create`)}
        >
          <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      {/* Pages List */}
      {pagesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="text-center">
            <Icon
              icon="lucide:file-text"
              className="w-16 h-16 text-content-tertiary mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              No Pages Yet
            </h3>
            <p className="text-content-tertiary mb-6">
              Create your first page to get started
            </p>
            <Button 
              variant="gradient"
              onClick={() => router.push(`/events/${eventId}/pages/create`)}
            >
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Create First Page
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page: any, index: number) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/events/${eventId}/sites/${page.site_id}/pages/${page.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="lucide:file-text"
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(page.status || "draft")}`}
                  >
                    {page.status || "draft"}
                  </span>
                </div>
                <h3 className="font-semibold text-content-primary mb-2">
                  {page.translations?.[0]?.title || `Page ${page.id}`}
                </h3>
                <p className="text-sm text-content-tertiary mb-4">{page.translations?.[0]?.permalink || "—"}</p>
                <div className="flex items-center justify-between text-xs text-content-tertiary">
                  <span>{page.blocks?.length || 0} blocks</span>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      Edit
                    </button>
                    <button className="text-content-tertiary hover:text-content-secondary">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
