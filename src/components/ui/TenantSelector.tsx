'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import type { Tenant } from '@/lib/directus';

export default function TenantSelector() {
  const { tenants, selectedTenant, setSelectedTenant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (tenants.length <= 1) {
    return null; // Don't show selector if user has only one or no tenants
  }

  const handleTenantSelect = (tenant: Tenant) => {
    // Only redirect if selecting a different tenant
    if (selectedTenant?.id !== tenant.id) {
      setSelectedTenant(tenant);
      setIsOpen(false);
      // The context will handle the redirect to home admin page
    } else {
      // Just close the dropdown if selecting the same tenant
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          {selectedTenant?.logo ? (
            <Image 
              src={`https://app.nexpo.vn/assets/${selectedTenant.logo}`} 
              alt={selectedTenant.name}
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Icon icon="lucide:building" className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">
            {selectedTenant?.name || 'Select Tenant'}
          </p>
          <p className="text-xs text-blue-200">
            {tenants.length} workspace{tenants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Icon 
          icon="lucide:chevron-down" 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select Workspace
                </div>
                
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleTenantSelect(tenant)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${selectedTenant?.id === tenant.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      {tenant.logo ? (
                        <Image 
                          src={`https://app.nexpo.vn/assets/${tenant.logo}`} 
                          alt={tenant.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Icon icon="lucide:building" className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-gray-500">
                        Status: {tenant.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                      </p>
                    </div>
                    {selectedTenant?.id === tenant.id && (
                      <Icon icon="lucide:check" className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
