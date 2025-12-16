'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import EventSidebar from '@/components/layout/EventSidebar';
import { useAppContextStore } from '@/store/appContext';

import { usePathname } from 'next/navigation';

export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const { setEventId } = useAppContextStore();

  // Check if current page is Page Builder ( /events/:id/pages/:pageId ) but not create or list
  const isBuilderPage = pathname?.includes('/pages/') &&
    !pathname?.endsWith('/pages') &&
    !pathname?.endsWith('/create');

  useEffect(() => {
    const n = Number(params.id);
    setEventId(Number.isFinite(n) ? n : null);
  }, [params.id, setEventId]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="w-full h-full relative bg-background-secondary">
      <div className="flex h-full relative">
        {/* Sidebar */}
        <div className={cn(
          " min-h-full shrink-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-72 opacity-100 overflow-y-auto"
        )}>
          <EventSidebar eventId={params.id} />
        </div>

        {/* Toggle Button - positioned at center outside sidebar */}
        <motion.div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute z-50 bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow rounded-full cursor-pointer flex items-center justify-center"
          animate={{
            left: sidebarCollapsed ? 8 : 296, // 288 + 8px margin
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            width: '40px',
            height: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        //   whileHover={{ scale: 1.05 }}
        //   whileTap={{ scale: 0.95 }}
        >
          <Icon
            icon={sidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'}
            className="w-5 h-5 text-content-secondary"
          />
        </motion.div>

        {/* Main Content */}
        <div className={cn(
          "flex-1",
          isBuilderPage ? "flex flex-col overflow-hidden" : "overflow-y-auto"
        )}>
          <div className={cn(
            "flex-1 min-w-0 relative",
            isBuilderPage ? "h-full p-0 flex flex-col" : "overflow-y-auto p-4 sm:p-6 lg:p-8"
          )}>
            <motion.div
              className={cn("bg-background-secondary p-4 sm:p-2 lg:p-4", isBuilderPage && "h-full")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
