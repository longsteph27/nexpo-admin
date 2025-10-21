'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface PostsCardProps {
  site: any;
}

export default function PostsCard({ site }: PostsCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Posts</h2>
        <p className="text-xs text-content-tertiary">Blog posts and articles</p>
      </div>
      <div className="p-6">
        {site.posts && site.posts.length > 0 ? (
          <div className="space-y-3">
            {site.posts.map((post: any, index: number) => (
              <div key={post.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon icon="lucide:file-text" className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {post.title || 'Untitled Post'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      {post.date_published ? new Date(post.date_published).toLocaleDateString() : 'Not published'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    post.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {post.status || 'draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:file-text" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No posts created</p>
            <p className="text-xs text-content-tertiary">Create posts to share content with your audience</p>
          </div>
        )}
      </div>
    </section>
  );
}
