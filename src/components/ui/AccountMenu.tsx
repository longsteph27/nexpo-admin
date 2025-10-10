'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  const handleAccountInfo = () => {
    setIsOpen(false);
    router.push('/account');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.first_name && !user?.last_name) return 'U';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Account menu"
      >
        {user?.avatar ? (
          <img 
            src={`https://app.nexpo.vn/assets/${user.avatar}`} 
            alt={`${user.first_name} ${user.last_name}`}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-xs font-semibold text-white">
            {getUserInitials()}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user?.avatar ? (
                    <img 
                      src={`https://app.nexpo.vn/assets/${user.avatar}`} 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-content-tertiary truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              <button
                onClick={handleAccountInfo}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group"
              >
                <Icon 
                  icon="lucide:user-circle" 
                  className="w-5 h-5 text-content-tertiary group-hover:text-content-secondary transition-colors" 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-content-primary group-hover:text-content-primary">
                    Account Info
                  </p>
                  <p className="text-xs text-content-tertiary">
                    View and edit your profile
                  </p>
                </div>
                <Icon 
                  icon="lucide:chevron-right" 
                  className="w-4 h-4 text-content-tertiary group-hover:text-content-secondary transition-colors" 
                />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
              >
                <Icon 
                  icon="lucide:log-out" 
                  className="w-5 h-5 text-content-tertiary group-hover:text-red-600 transition-colors" 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-content-primary group-hover:text-red-600">
                    Logout
                  </p>
                  <p className="text-xs text-content-tertiary group-hover:text-red-500">
                    Sign out of your account
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

