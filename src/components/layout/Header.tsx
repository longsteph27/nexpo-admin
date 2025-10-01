'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface HeaderProps {
  onMobileMenuClick: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ onMobileMenuClick, actions }: HeaderProps) {

  // Determine page title and subtitle based on pathname if not provided

  // const pageInfo = getPageInfo(title, subtitle);

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
          <div className='flex flex-row items-center'>
            <Image src="/menu.png" alt="Dashboard Icon" width={100} height={100} className="w-6 h-auto mr-2" />
            <Image src="/logo_nexpo.png" alt="NEXPO" width={100} height={100} className="w-20 h-auto" />
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
