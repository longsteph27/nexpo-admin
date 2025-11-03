'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EventsList } from '@/features/events/components/list';

export default function EventsPage() {
  return (
    <DashboardLayout>
      <EventsList />
    </DashboardLayout>
  );
}
