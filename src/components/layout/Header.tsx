'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import TenantSelector from '@/components/ui/TenantSelector';
import AccountMenu from '@/components/ui/AccountMenu';
import { useEvent } from '@/hooks/useEvents';

interface HeaderProps {
  onMobileMenuClick: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eventId?: string | null;
}

export default function Header({ onMobileMenuClick, actions, eventId }: HeaderProps) {
  // Fetch event data if eventId is provided
  const { data: event } = useEvent(eventId || '');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-content-primary';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="lucide:menu" className="w-6 h-6 text-content-secondary" />
          </button>

          {/* Logo and Event Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Image src="/menu.png" alt="Dashboard Icon" width={100} height={100} className="w-6 h-auto mr-2" />
              <Image src="/logo_nexpo.png" alt="NEXPO" width={100} height={100} className="w-20 h-auto" />
            </div>
            
            {/* Event Info - only show if we have event data */}
            {event && (
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg font-semibold text-content-primary">{event.name}</h1>
                  {event.status && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Live
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Tenant Selector */}
            <div className="hidden md:block min-w-[240px]">
              <TenantSelector />
            </div>
            {actions}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-content-tertiary hover:text-content-secondary rounded-lg hover:bg-gray-100 transition-colors">
                <Icon icon="lucide:bell" className="w-5 h-5" />
              </button>
              <button className="p-2 text-content-tertiary hover:text-content-secondary rounded-lg hover:bg-gray-100 transition-colors">
                <Icon icon="lucide:help-circle" className="w-5 h-5" />
              </button>
              <AccountMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
