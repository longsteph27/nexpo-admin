'use client';

import { useParams } from 'next/navigation';
import AgendasPage from '@/features/agendas/components/AgendasPage';

export default function AgendasRoute() {
  const params = useParams();
  const eventId = Number(params?.id);
  return <AgendasPage eventId={eventId} />;
}
