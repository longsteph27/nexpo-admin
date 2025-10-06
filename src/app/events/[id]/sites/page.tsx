"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEvent } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { siteApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Icon } from "@iconify/react";

export default function EventSitesListPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");
  const { selectedTenant } = useAuth();

  // Fetch event data (includes site IDs)
  const { data: event, isLoading: loadingEvent } = useEvent(eventId);

  // Fetch all sites data for list display (filtered by event_id and tenant_id)
  const { data: sites = [], isLoading: loadingSites } = useQuery({
    queryKey: ["sites-list", { eventId, tenantId: selectedTenant?.id }],
    queryFn: () => siteApi.getSitesList(Number(eventId), selectedTenant?.id),
    select: (r) => r.data || [],
    enabled: !!eventId && !!selectedTenant?.id,
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loadingEvent || loadingSites) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-gray-700">
            Loading sites...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-600 mt-1">Manage websites for your event</p>
        </div>
        <Button variant="primary">
          <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
          Create Site
        </Button>
      </div>

      {/* Sites List */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            All Sites ({sites.length})
          </h2>
        </div>
        <div className="p-6">
          {sites.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="lucide:layout-grid"
                  className="w-8 h-8 text-gray-400"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No sites found
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Create your first site to start building your event website
              </p>
              <Button variant="primary">
                <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                Create Site
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((site: any) => (
                <div
                  key={site.id}
                  onClick={() =>
                    router.push(`/events/${eventId}/sites/${site.id}`)
                  }
                  className="group cursor-pointer border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                >
                  {/* Site Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon
                        icon="lucide:globe"
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}
                    >
                      {site.status || "draft"}
                    </span>
                  </div>

                  {/* Site Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                        {site.translations?.[0]?.title ||
                          site.slug ||
                          `Site #${site.id}`}
                      </h3>
                      {site.translations?.[0]?.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {site.translations[0].description}
                        </p>
                      )}
                    </div>

                    {/* Site Meta */}
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      {site.domain && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Icon
                            icon="lucide:link"
                            className="w-3.5 h-3.5 text-gray-400"
                          />
                          <span className="font-mono truncate">
                            {site.domain}
                          </span>
                        </div>
                      )}
                      {site.slug && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Icon
                            icon="lucide:hash"
                            className="w-3.5 h-3.5 text-gray-400"
                          />
                          <span className="font-mono">{site.slug}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Icon
                            icon="lucide:file-text"
                            className="w-3.5 h-3.5"
                          />
                          <span>
                            {(site.pages as any[])?.length || 0} pages
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon icon="lucide:menu" className="w-3.5 h-3.5" />
                          <span>
                            {(site.navigation as any[])?.length || 0} menus
                          </span>
                        </div>
                        {site.categories &&
                          (site.categories as any[]).length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Icon icon="lucide:tag" className="w-3.5 h-3.5" />
                              <span>
                                {(site.categories as any[])?.length || 0}
                              </span>
                            </div>
                          )}
                      </div>
                      <Icon
                        icon="lucide:arrow-right"
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                      />
                    </div>

                    {/* Last Updated */}
                    <div className="text-xs text-gray-400">
                      Updated {formatDate(site.date_updated)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
