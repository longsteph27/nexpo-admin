'use client';

import { useParams } from 'next/navigation';
import SpeakersPage from '@/features/speakers/components/SpeakersPage';

export default function SpeakersRoute() {
  const params = useParams();
  const eventId = Number(params?.id);
  return <SpeakersPage eventId={eventId} />;
}
