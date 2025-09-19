'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    {
      id: 'events',
      label: 'Event Manager',
      icon: 'mdi:view-grid',
      path: '/events',
      isActive: pathname.startsWith('/events')
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: 'mdi:server',
      path: '/dashboard',
      isActive: pathname === '/dashboard' || pathname.startsWith('/collections')
    },
    {
      id: 'matching',
      label: 'Matching',
      icon: 'mdi:grid',
      path: '/matching',
      isActive: pathname.startsWith('/matching')
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-56 bg-slate-900 transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Toggle Button */}
          <div className="flex justify-end p-4 border-b border-slate-700">
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Icon icon="mdi:chevron-left" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Items */}
          <div className="flex-1 flex flex-col justify-center px-6 py-8">
            <nav className="space-y-8">
              {navigationItems.map((item) => (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex flex-col items-center space-y-3 p-4 transition-all duration-200 relative rounded-lg
                      ${item.isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className="relative">
                      {item.id === 'events' && (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-3 h-3 bg-blue-400 rounded-sm opacity-70"></div>
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-blue-400 rounded-sm opacity-90"></div>
                            <div className="w-3 h-3 bg-blue-400 rounded-sm opacity-70"></div>
                          </div>
                        </div>
                      )}
                      {item.id === 'workspace' && (
                        <div className="relative w-8 h-8">
                          <div className="absolute inset-0 bg-slate-700 rounded-lg"></div>
                          <div className="absolute inset-1 bg-slate-600 rounded-md"></div>
                          <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                        </div>
                      )}
                      {item.id === 'matching' && (
                        <div className="grid grid-cols-2 gap-1 w-8 h-8">
                          <div className="bg-blue-600 rounded-sm"></div>
                          <div className="bg-blue-400 rounded-sm opacity-70"></div>
                          <div className="bg-blue-400 rounded-sm opacity-70"></div>
                          <div className="bg-blue-600 rounded-sm"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                  
                  {/* Active indicator - left border */}
                  {item.isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-blue-400 rounded-r-full"></div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          
          {/* Close Button */}
          <div className="px-6 py-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="w-full text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200 text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
