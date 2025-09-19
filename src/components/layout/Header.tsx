'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ title, onMenuClick, sidebarOpen }: HeaderProps) {
  const { logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // AuthContext handles the redirect internally
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`bg-white shadow-sm border-b border-nexpo-light-gray ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 mr-3"
            >
              <Icon icon="mdi:menu" className="w-6 h-6" />
            </button>
            
            <Image src="/menu.png" alt="Dashboard Icon" width={100} height={100} className="w-6 h-auto mr-2" />
            <Image src="/logo_nexpo.png" alt="NEXPO" width={100} height={100} className="w-20 h-auto" />
            {title && (
              <>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-500">{title}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="Dashboard"
            >
              <Icon icon="mdi:view-dashboard" className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/events')}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="Events"
            >
              <Icon icon="mdi:calendar-event" className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              title="Profile"
            >
              <Icon icon="mdi:account" className="w-5 h-5" />
            </button>
            <Icon icon="mdi:bell-outline" className="w-5 h-5 text-gray-400" />
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isLoading ? "Logging out..." : "Logout"}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
              ) : (
                <Icon icon="mdi:logout" className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
