'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { FormBuilder } from '@/features/forms';

export default function FormBuilderPage() {
  const params = useParams();
  const eventId = String(params?.id ?? '');
  const formId = String(params?.formId ?? '');

  return <FormBuilder eventId={eventId} formId={formId} />;
}

