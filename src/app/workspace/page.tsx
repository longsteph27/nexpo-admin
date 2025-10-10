'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function WorkspacePage() {
  return (
    <DashboardLayout
      title="Workspace"
      subtitle="Manage your team and workspace settings"
    >
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <Icon icon="lucide:users" className="w-24 h-24 text-content-tertiary" />
        </div>
        <h3 className="text-xl font-semibold text-content-primary mb-2">Workspace Coming Soon</h3>
        <p className="text-content-secondary text-center max-w-md">
          This feature is under development. You&apos;ll be able to manage your team members, 
          roles, and workspace settings here.
        </p>
      </div>
    </DashboardLayout>
  );
}
