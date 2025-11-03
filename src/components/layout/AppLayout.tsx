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
  
  // Check if we're in event detail pages
  const isEventDetailPage = pathname?.match(/^\/events\/\d+/);
  const eventId = isEventDetailPage ? pathname?.split('/')[2] : null;
  
  // Check if we're in create event page - needs full screen layout
  const isCreateEventPage = pathname === '/events/create';

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
        {/* {isEventDetailPage && eventId ? (
          <EventLayout eventId={eventId}>
            {children}
          </EventLayout>
        ) : ( */}
          {isCreateEventPage ? (
            // Full screen layout for create event page
            <div className="flex-1 h-full">
              {children}
            </div>
          ) : (
            // Normal layout for other pages
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 overflow-y-auto"
            >
                {children}
            </motion.div>
          )}
        {/* )} */}
      </main>
    </div>
  );
}
