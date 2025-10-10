'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MatchingPage() {
  return (
    <DashboardLayout
      title="Matching"
      subtitle="AI-powered attendee matching and networking"
    >
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <Icon icon="lucide:shuffle" className="w-24 h-24 text-content-tertiary" />
        </div>
        <h3 className="text-xl font-semibold text-content-primary mb-2">Matching Coming Soon</h3>
        <p className="text-content-secondary text-center max-w-md">
          This feature is under development. You&apos;ll be able to manage AI-powered 
          attendee matching and networking features here.
        </p>
      </div>
    </DashboardLayout>
  );
}
