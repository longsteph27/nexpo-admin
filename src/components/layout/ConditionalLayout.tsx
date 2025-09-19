'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  
  // Don't show header on login page
  const shouldShowHeader = pathname !== '/';
  
  // Get page title based on route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Collections Dashboard';
    if (pathname.startsWith('/events')) return 'Events';
    if (pathname.startsWith('/collections')) return 'Collections';
    if (pathname === '/profile') return 'Profile';
    return '';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowHeader && (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onToggle={toggleSidebar} />
          <Header title={getPageTitle()} onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        </>
      )}
      <div className={shouldShowHeader ? (sidebarOpen ? 'lg:ml-56' : 'lg:ml-0') : ''}>
        {children}
      </div>
    </div>
  );
}
