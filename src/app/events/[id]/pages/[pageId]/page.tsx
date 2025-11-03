'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PageBuilder } from '@/features/pages/components/editor';

export default function PageBuilderPage() {
  const params = useParams();
  const eventId = String(params?.id || '');
  const pageId = String(params?.pageId || '');
  
  return <PageBuilder eventId={eventId} pageId={pageId} />;
}
