'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';

export default function EventsPage() {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push('/events/create/step1');
  };

  return (
    <DashboardLayout title="Events" subtitle="Manage all your events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-1">Manage and organize your events</p>
          </div>
          <Button onClick={handleCreateEvent} className="gradient-primary">
            <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Icon icon="lucide:calendar" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Yet</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first event
            </p>
            <Button onClick={handleCreateEvent} className="gradient-primary">
              <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
              Create Your First Event
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
