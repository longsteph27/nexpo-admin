'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEvent } from '@/hooks/useEvents';
import { siteApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import { Icon } from '@iconify/react';
// import NavigationDrawer from '@/components/ui/NavigationDrawer';
// import { type Navigation } from '@/hooks/useNavigation';

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || '');
  const siteId = String(params?.siteId || '');
  // const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  // const [selectedNavigation, setSelectedNavigation] = useState<Navigation | null>(null);

  // Fetch event data
  const { data: event, isLoading: loadingEvent } = useEvent(eventId);

  // Fetch full site data with all relationships
  const { data: site, isLoading: loadingSite } = useQuery({
    queryKey: ['site-detail', { siteId }],
    queryFn: () => siteApi.getSite(Number(siteId)),
    select: (r) => r.data || null,
    enabled: !!siteId,
  });

  if (loadingEvent || loadingSite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-gray-700">Loading site...</span>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Icon icon="lucide:alert-circle" className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Site not found</h3>
        <p className="text-gray-500 mb-6">The site you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.push(`/events/${eventId}/sites`)}>
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Back to Sites
        </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {site.translations?.[0]?.title || site.slug || 'Site Details'}
            </h1>
            <p className="text-gray-600 mt-1">Configure your event website settings and content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon icon="lucide:eye" className="w-4 h-4 mr-2" />
            Preview Site
          </Button>
          <Button className="gradient-primary">
            <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Site Information */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Site Information</h2>
              <p className="text-xs text-gray-500">* Indicates a required field</p>
            </div>
            <Button size="sm" variant="outline">
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Site ID</label>
                  <div className="mt-1 text-gray-900">#{site.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      site.status === 'published' ? 'bg-green-100 text-green-800' : 
                      site.status === 'archived' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {site.status || 'draft'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Event ID</label>
                  <div className="mt-1 text-gray-900">#{site.event_id}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Slug</label>
                  <div className="mt-1 text-gray-900 font-mono text-sm">{site.slug || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Domain</label>
                  <div className="mt-1 text-gray-900 font-mono text-sm">{site.domain || '—'}</div>
                </div>
              </div>
              {site.translations?.[0]?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1 text-gray-900">{site.translations[0].description}</div>
                </div>
              )}
            </div>
          </section>

          {/* Site Media */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Site Media</h2>
                <p className="text-xs text-gray-500">Upload logo and favicon for your site</p>
              </div>
              <Button size="sm" variant="outline">
                <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Site Logo</label>
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Icon icon="lucide:image" className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {site.logo ? `File ID: ${site.logo}` : 'No logo uploaded'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Favicon</label>
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Icon icon="lucide:image" className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {site.favicon ? `File ID: ${site.favicon}` : 'No favicon uploaded'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Navigation</h2>
                <p className="text-xs text-gray-500">Manage site navigation menus</p>
              </div>
              <Button size="sm" onClick={() => {/* setNavDrawerOpen(true) */}}>
                <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                Manage Navigation
              </Button>
            </div>
            <div className="p-6">
              {!site.navigation || (site.navigation as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="lucide:navigation" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No navigation menus configured</p>
                  <Button size="sm" onClick={() => {/* setNavDrawerOpen(true) */}}>
                    <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                    Create Navigation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(site.navigation as any[]).map((nav: any) => (
                    <div key={nav.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Icon 
                              icon={
                                nav.type === 'header' ? 'lucide:align-start' : 
                                nav.type === 'footer' ? 'lucide:align-end' : 
                                'lucide:menu'
                              } 
                              className="w-5 h-5 text-purple-600" 
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {nav.translations?.[0]?.title || 'Untitled Navigation'}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500 capitalize">{nav.type}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                nav.status === 'published' ? 'bg-green-100 text-green-800' : 
                                nav.status === 'archived' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {nav.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => {/* setNavDrawerOpen(true) */}}>
                          <Icon icon="lucide:edit" className="w-4 h-4" />
                        </Button>
                      </div>
                      {nav.items && nav.items.length > 0 && (
                        <div className="ml-13 pl-4 border-l-2 border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">{nav.items.length} navigation items</div>
                          <div className="space-y-1">
                            {nav.items.slice(0, 3).map((item: any) => (
                              <div key={item.id} className="text-xs text-gray-700 flex items-center space-x-2">
                                <Icon icon="lucide:circle" className="w-2 h-2" />
                                <span className="truncate">{item.translations?.[0]?.title || 'Untitled Item'}</span>
                                <span className="text-gray-400">({item.type})</span>
                              </div>
                            ))}
                            {nav.items.length > 3 && (
                              <div className="text-xs text-gray-400 ml-4">+{nav.items.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Pages */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Pages</h2>
                <p className="text-xs text-gray-500">{(site.pages as any[])?.length || 0} pages</p>
              </div>
              <Button size="sm" onClick={() => router.push(`/events/${eventId}/pages`)}>
                <Icon icon="lucide:arrow-right" className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="p-6">
              {!site.pages || (site.pages as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pages found for this site.
                </div>
              ) : (
                <div className="space-y-2">
                  {(site.pages as any[]).map((page: any) => (
                    <div 
                      key={page.id} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group cursor-pointer"
                      onClick={() => router.push(`/events/${eventId}/sites/${siteId}/pages/${page.id}`)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Icon icon="lucide:file-text" className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {page.translations?.[0]?.title || 'Untitled'}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            <span>{page.blocks?.length || 0} blocks</span>
                            <span>•</span>
                            <span>Updated {new Date(page.date_updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          page.status === 'published' ? 'bg-green-100 text-green-800' : 
                          page.status === 'archived' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {page.status}
                        </span>
                        <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Categories */}
          {site.categories && (site.categories as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Categories</h2>
                  <p className="text-xs text-gray-500">{(site.categories as any[])?.length || 0} categories</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {(site.categories as any[]).map((category: any) => (
                    <div 
                      key={category.id} 
                      className="inline-flex items-center px-3 py-1.5 rounded-full border text-sm"
                      style={{ 
                        borderColor: category.color || '#e5e7eb',
                        backgroundColor: `${category.color}20` || '#f9fafb'
                      }}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color || '#9ca3af' }}></span>
                      {category.translations?.[0]?.title || 'Untitled'}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Posts */}
          {site.posts && (site.posts as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Posts</h2>
                  <p className="text-xs text-gray-500">{(site.posts as any[])?.length || 0} posts</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Post
                </Button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {(site.posts as any[]).map((post: any) => (
                    <div key={post.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon 
                            icon={
                              post.type === 'blog' ? 'lucide:newspaper' : 
                              post.type === 'project' ? 'lucide:briefcase' : 
                              post.type === 'video' ? 'lucide:video' :
                              'lucide:file-text'
                            } 
                            className="w-4 h-4 text-gray-500" 
                          />
                          <h4 className="font-medium text-gray-900 truncate">{post.title || 'Untitled'}</h4>
                        </div>
                        {post.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.summary}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {post.category && (
                            <span className="inline-flex items-center">
                              <Icon icon="lucide:tag" className="w-3 h-3 mr-1" />
                              {post.category.translations?.[0]?.title || 'Uncategorized'}
                            </span>
                          )}
                          {post.author && (
                            <span className="inline-flex items-center">
                              <Icon icon="lucide:user" className="w-3 h-3 mr-1" />
                              {post.author.name}
                            </span>
                          )}
                          {post.date_published && (
                            <span>{new Date(post.date_published).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          post.status === 'published' ? 'bg-green-100 text-green-800' : 
                          post.status === 'archived' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                        {post.type && (
                          <span className="text-xs text-gray-500 capitalize">{post.type}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Team */}
          {site.team && (site.team as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
                  <p className="text-xs text-gray-500">{(site.team as any[])?.length || 0} members</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(site.team as any[]).map((member: any) => (
                    <div key={member.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          {member.image ? (
                            <Icon icon="lucide:user" className="w-6 h-6 text-white" />
                          ) : (
                            <Icon icon="lucide:user" className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{member.name || 'Unnamed'}</h4>
                          {member.translations?.[0]?.title && (
                            <p className="text-xs text-gray-600 truncate">{member.translations[0].title}</p>
                          )}
                          {member.translations?.[0]?.bio && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{member.translations[0].bio}</p>
                          )}
                          <div className="mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              member.status === 'published' ? 'bg-green-100 text-green-800' : 
                              member.status === 'archived' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Testimonials */}
          {site.testimonials && (site.testimonials as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Testimonials</h2>
                  <p className="text-xs text-gray-500">{(site.testimonials as any[])?.length || 0} testimonials</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {(site.testimonials as any[]).map((testimonial: any) => (
                    <div key={testimonial.id} className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50/30 transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon icon="lucide:quote" className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900">{testimonial.title || 'Untitled'}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              testimonial.status === 'published' ? 'bg-green-100 text-green-800' : 
                              testimonial.status === 'archived' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {testimonial.status}
                            </span>
                          </div>
                          {testimonial.subtitle && (
                            <p className="text-xs text-gray-600 mb-2">{testimonial.subtitle}</p>
                          )}
                          {testimonial.content && (
                            <p className="text-sm text-gray-700 line-clamp-3 mb-2" dangerouslySetInnerHTML={{ __html: testimonial.content }}></p>
                          )}
                          {testimonial.company && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Icon icon="lucide:building" className="w-3 h-3 mr-1" />
                              {testimonial.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Languages */}
          {site.languages && (site.languages as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Languages</h2>
                  <p className="text-xs text-gray-500">Supported languages for this site</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {(site.languages as any[]).map((lang: any) => (
                    <div key={lang.languages_id?.code} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      <Icon icon="lucide:globe" className="w-4 h-4 mr-2" />
                      {lang.languages_id?.name || lang.languages_id?.code}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Redirects */}
          {site.redirects && (site.redirects as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Redirects</h2>
                  <p className="text-xs text-gray-500">{(site.redirects as any[])?.length || 0} URL redirects</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
                  Add Redirect
                </Button>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {(site.redirects as any[]).map((redirect: any) => (
                    <div key={redirect.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Icon icon="lucide:corner-down-right" className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div className="flex items-center space-x-2 text-sm flex-1 min-w-0">
                          <code className="text-gray-700 font-mono text-xs truncate">{redirect.url_old}</code>
                          <Icon icon="lucide:arrow-right" className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <code className="text-gray-700 font-mono text-xs truncate">{redirect.url_new}</code>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {redirect.response_code === 301 ? '301 Permanent' : '302 Temporary'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Globals */}
          {site.globals && (site.globals as any[]).length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Global Settings</h2>
                  <p className="text-xs text-gray-500">Site-wide configuration</p>
                </div>
                <Button size="sm" variant="outline">
                  <Icon icon="lucide:settings" className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {(site.globals as any[]).map((global: any) => (
                    <div key={global.id} className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Title</label>
                          <div className="text-sm font-medium text-gray-900 mt-1">{global.title || '—'}</div>
                        </div>
                        {global.tagline && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Tagline</label>
                            <div className="text-sm text-gray-900 mt-1">{global.tagline}</div>
                          </div>
                        )}
                      </div>
                      {global.description && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Description</label>
                          <p className="text-sm text-gray-700 mt-1">{global.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {global.url && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Base URL</label>
                            <code className="text-xs font-mono text-blue-600 mt-1 block truncate">{global.url}</code>
                          </div>
                        )}
                        {global.email && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Email</label>
                            <div className="text-sm text-gray-900 mt-1">{global.email}</div>
                          </div>
                        )}
                        {global.phone && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Phone</label>
                            <div className="text-sm text-gray-900 mt-1">{global.phone}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Navigation Drawer */}
        {/* {site.id && (
          <NavigationDrawer
            isOpen={navDrawerOpen}
            onClose={() => setNavDrawerOpen(false)}
            siteId={site.id}
            selectedNavigation={selectedNavigation}
            onNavigationSelect={setSelectedNavigation}
          />
        )} */}
    </div>
  );
}

