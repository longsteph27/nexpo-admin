'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface EventLayoutProps {
  children: React.ReactNode;
  eventId: string;
  eventName?: string;
  eventStatus?: 'published' | 'draft' | 'archived';
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

export default function EventLayout({ children, eventId }: EventLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      id: 'information',
      label: 'Information',
      icon: 'lucide:info',
      href: `/events/${eventId}`,
    },
  ];

  const siteMenuItems: MenuItem[] = [
    {
      id: 'sites',
      label: 'Sites',
      icon: 'lucide:layout-grid',
      href: `/events/${eventId}/sites`,
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: 'lucide:file-text',
      href: `/events/${eventId}/pages`,
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: 'lucide:file-input',
      href: `/events/${eventId}/forms`,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/events/${eventId}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex w-full h-full relative">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            width: sidebarCollapsed ? 0 : 280,
            opacity: sidebarCollapsed ? 0 : 1 
          }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.2 }
          }}
          className="bg-white border-r border-gray-200 flex flex-col h-full shrink-0"
        >

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto p-4 pt-6 min-h-0">
              <div className="space-y-4">
                {/* Event Section */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Event
                  </div>
                  <div className="space-y-1">
                    {menuItems.map((item, index) => {
                      const active = isActive(item.href);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            className={`
                              flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                              ${active
                                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'
                              }
                            `}
                          >
                            <Icon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Site Builder Section */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Site Builder
                  </div>
                  <div className="space-y-1">
                    {siteMenuItems.map((item, index) => {
                      const active = isActive(item.href);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (menuItems.length + index) * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            className={`
                              flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                              ${active
                                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'
                              }
                            `}
                          >
                            <Icon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 shrink-0">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:info" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-900">Team-managed project</p>
                    <button className="text-xs text-blue-700 hover:underline mt-1">
                      Give feedback
                    </button>
                    <span className="text-xs text-blue-700 mx-1">•</span>
                    <button className="text-xs text-blue-700 hover:underline">
                      Learn more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

        {/* Toggle Button */}
        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="fixed z-50 bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
          animate={{ 
            left: sidebarCollapsed ? -1 : 279,
            borderRadius: sidebarCollapsed ? '0 8px 8px 0' : '0 8px 8px 0'
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
            className="w-4 h-4 text-gray-600"
          />
        </motion.button>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
