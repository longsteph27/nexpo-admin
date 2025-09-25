'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuthStore } from '@/store/auth';

interface HeaderProps {
  onMobileMenuClick: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ onMobileMenuClick, title, subtitle, actions }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Determine page title and subtitle based on pathname if not provided
  const getPageInfo = () => {
    if (title && subtitle) return { title, subtitle };
    
    switch (pathname) {
      case '/dashboard':
        return { title: 'Event Management', subtitle: 'Manage your events and settings' };
      case '/dashboard/create':
        return { title: 'Create Event', subtitle: 'Set up a new event' };
      case '/events':
        return { title: 'Events', subtitle: 'Manage and organize your events' };
      case '/events/create':
      case '/events/create/step1':
        return { title: 'Create Event', subtitle: 'Set up a new event' };
      case '/workspace':
        return { title: 'Workspace', subtitle: 'Your workspace dashboard' };
      case '/matching':
        return { title: 'Matching', subtitle: 'Find and match opportunities' };
      default:
        return { title: 'NEXPO Admin', subtitle: 'Event management platform' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="lucide:menu" className="w-6 h-6 text-gray-600" />
          </button>

          {/* Page Title */}
          <div className="flex-1 lg:flex-none">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{pageInfo.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{pageInfo.subtitle}</p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Icon icon="lucide:help-circle" className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Icon icon="lucide:user" className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
