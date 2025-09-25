'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CreateEventPage() {
  const router = useRouter();

  // Redirect to step 1
  React.useEffect(() => {
    router.replace('/events/create/step1');
  }, [router]);

  return (
    <DashboardLayout title="Create Event" subtitle="Set up a new event">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to event creation...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
