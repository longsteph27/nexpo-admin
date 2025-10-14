'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import EventSidebar from './EventSidebar';

interface EventLayoutProps {
  children: React.ReactNode;
  eventId: string;
  eventName?: string;
  eventStatus?: 'published' | 'draft' | 'archived';
}

export default function EventLayout({ children, eventId }: EventLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Animation variants for content transitions
  const contentVariants = {
    initial: {
      opacity: 0,
      x: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98,
    },
  };

  const childVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="flex w-full h-full relative">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? 0 : 288, // 72 * 4 = 288px (w-72)
          opacity: sidebarCollapsed ? 0 : 1 
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.2 }
        }}
        className="h-full shrink-0 overflow-hidden"
      >
        <EventSidebar eventId={eventId} />
      </motion.div>

      {/* Toggle Button */}
      <motion.div
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed z-50 bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow rounded-r-lg cursor-pointer"
        animate={{ 
          left: sidebarCollapsed ? -1 : 287, // 288 - 1
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1]
        }}
        style={{
          padding: '12px 8px',
          top: 'calc(64px + 50vh)', // 64px header + 50% of remaining viewport
          transform: 'translateY(-50%)',
        }}
      >
        <Icon
          icon={sidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'}
          className="w-4 h-4 text-content-secondary"
        />
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.4,
              ease: "easeOut",
              staggerChildren: 0.1,
            }}
            className="h-full w-full"
          >
            <motion.div
              variants={childVariants}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
