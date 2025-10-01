'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/store/auth';
import TenantSelector from '@/components/ui/TenantSelector';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'event-manager',
    label: 'Event Manager',
    icon: 'lucide:calendar-days',
    href: '/events',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isCollapsed?: boolean;
}

export default function Sidebar({ isOpen, onClose, onToggle, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  // Mobile sidebar animation variants
  const mobileSidebarVariants = {
    open: { x: 0 },
    closed: { x: -320 }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar with smooth animation */}
      <motion.aside
        className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 overflow-hidden"
        initial={false}
        animate={{ width: isCollapsed ? 0 : 320 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        {/* Sidebar Content */}
        <div className="relative flex flex-col h-full bg-nexpo-bg-sidebar text-sidebar-text-primary w-80">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">NX</span>
                </div>
                <span className="text-xl font-bold">NEXPO</span>
              </div>
              
              {/* Tenant Selector */}
              <TenantSelector />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={`
                        flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <Icon 
                        icon={item.icon} 
                        className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/70'}`}
                      />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border/50">
              {/* User Profile */}
              {user && (
                <div className="flex items-center space-x-3 mb-4 p-3 bg-white/10 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Icon icon="lucide:user" className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-sidebar-text-secondary truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl transition-colors"
              >
                <Icon icon="lucide:log-out" className="w-5 h-5" />
                <span className="font-medium">Close</span>
              </button>
            </div>
          </div>
      </motion.aside>

      {/* Toggle Button - fixed so it stays visible while sliding */}
      <motion.button
        onClick={onToggle}
        className="hidden lg:flex fixed top-1/2 -translate-y-1/2 w-6 h-14 bg-nexpo-bg-sidebar text-white rounded-tr-full rounded-br-full shadow-md hover:shadow-lg transition-colors items-center justify-center z-50"
        animate={{ left: isCollapsed ? 0 : 320 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        aria-label="Toggle sidebar"
      >
        <Icon icon={isCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'} className="w-4 h-4" />
      </motion.button>

      {/* Mobile sidebar - slides in from left */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileSidebarVariants}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300 
            }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-nexpo-bg-sidebar text-sidebar-text-primary shadow-2xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-sidebar-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-900">NX</span>
                    </div>
                    <span className="text-xl font-bold">NEXPO</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-sidebar-border/20 rounded-lg transition-colors"
                  >
                    <Icon icon="lucide:x" className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                {/* Tenant Selector */}
                <TenantSelector />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className={`
                          flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200
                          ${isActive 
                            ? 'bg-white/20 text-white shadow-lg' 
                            : 'text-sidebar-text-secondary hover:bg-white/10 hover:text-white'
                          }
                        `}
                        onClick={onClose} // Close sidebar on mobile after navigation
                      >
                        <Icon 
                          icon={item.icon} 
                          className={`w-6 h-6 ${isActive ? 'text-white' : 'text-sidebar-text-muted'}`}
                        />
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-sidebar-border/50">
                {/* User Profile */}
                {user && (
                  <div className="flex items-center space-x-3 mb-4 p-3 bg-white/10 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Icon icon="lucide:user" className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-sidebar-text-secondary truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl transition-colors"
                >
                  <Icon icon="lucide:log-out" className="w-5 h-5 text-white" />
                  <span className="font-medium">Close</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}