'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/store/auth';
import Header from './Header';
import Sidebar from './Sidebar';

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
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, initializeFromStoredTokens } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const stableInitializeAuth = useCallback(() => {
    // First try to initialize from stored tokens, then fallback to checkAuth
    initializeFromStoredTokens().then(() => {
      // If initialization didn't work, try checkAuth
      if (!isAuthenticated) {
        checkAuth();
      }
    });
  }, [initializeFromStoredTokens, checkAuth, isAuthenticated]);

  useEffect(() => {
    // Only initialize auth once on mount
    stableInitializeAuth();
  }, [stableInitializeAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && isAuthenticated) {
      // After a successful auth check, ensure we land on events
      if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        router.replace('/events');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Icon icon="lucide:loader-2" className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-lg font-medium text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onToggle={handleToggleSidebar}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-80'}`}>
        {/* Header */}
        <Header 
          onMobileMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
          actions={actions}
        />

        {/* Page Content */}
        <main className={`flex-1 ${pathname?.startsWith('/events/create') ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
