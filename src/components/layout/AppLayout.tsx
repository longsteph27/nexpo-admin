'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import EventLayout from './EventLayout';

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
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if we're in event detail pages
  const isEventDetailPage = pathname?.match(/^\/events\/\d+/);
  const eventId = isEventDetailPage ? pathname?.split('/')[2] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Icon icon="lucide:loader-2" className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-lg font-medium text-content-primary">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
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
