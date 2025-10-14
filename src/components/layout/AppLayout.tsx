'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import EventLayout from './EventLayout';
import EventsPageSkeleton from '@/components/loading/EventsPageSkeleton';
import EventDetailSkeleton from '@/components/loading/EventDetailSkeleton';
import DefaultSkeleton from '@/components/loading/DefaultSkeleton';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AppLayout({ 
  children, 
  title, 
  subtitle, 
  actions 
}: AppLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isRefreshing } = useAuth();
  
  // Check if we're in event detail pages
  const isEventDetailPage = pathname?.match(/^\/events\/\d+/);
  const eventId = isEventDetailPage ? pathname?.split('/')[2] : null;

  // Show loading skeleton ONLY during auth check/refresh, NOT when unauthenticated
  // This allows redirect to login page to work properly
  if (isLoading || isRefreshing) {
    console.log('[AppLayout] Showing loading skeleton:', { 
      isLoading, 
      isRefreshing, 
      isAuthenticated,
      pathname 
    });
    
    // Events list page - Show events grid skeleton
    if (pathname === '/events') {
      return <EventsPageSkeleton />;
    }
    
    // Event detail page - Show event detail skeleton WITHOUT Header/EventLayout
    // to prevent API calls before auth completes
    if (pathname?.match(/^\/events\/\d+$/)) {
      return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
          {/* Header Skeleton */}
          <div className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Main Content with Sidebar Skeleton */}
          <main className="flex-1 overflow-hidden flex">
            {/* Sidebar Skeleton */}
            <div className="w-72 bg-white border-r border-gray-200 p-4 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-y-auto">
              <EventDetailSkeleton />
            </div>
          </main>
        </div>
      );
    }
    
    // Default skeleton for all other routes
    return <DefaultSkeleton />;
  }

  // If not authenticated and not on login page, don't render anything
  // Let AuthContext handle the redirect
  if (!isAuthenticated && pathname !== '/login') {
    console.log('[AppLayout] Not authenticated, letting AuthContext handle redirect');
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <Header 
        onMobileMenuClick={() => {}}
        title={title}
        subtitle={subtitle}
        actions={actions}
        eventId={eventId}
      />

      {/* Page Content */}
      <main className="flex-1 overflow-hidden flex">
        {isEventDetailPage && eventId ? (
          <EventLayout eventId={eventId}>
            {children}
          </EventLayout>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 overflow-y-auto"
          >
            <div className={`${pathname?.startsWith('/events/create') ? 'p-0' : isEventDetailPage ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
              {children}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
