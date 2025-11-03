'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CreatePage } from '@/features/pages/components/create';

export default function CreatePagePage() {
  const params = useParams();
  const eventId = String(params?.id || '');

  return <CreatePage eventId={eventId} />;
}

