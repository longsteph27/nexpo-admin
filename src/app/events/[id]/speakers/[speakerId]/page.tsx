'use client';

import { useParams } from 'next/navigation';
import SpeakerDetailPage from '@/features/speakers/components/SpeakerDetailPage';
import { useSpeaker } from '@/features/speakers/hooks/useSpeakers';

function SpeakerDetailLoader({ eventId, speakerId }: { eventId: number; speakerId: string }) {
  const { data: speaker, isLoading } = useSpeaker(speakerId);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <SpeakerDetailPage eventId={eventId} speaker={speaker} />;
}

export default function SpeakerDetailRoute() {
  const params = useParams();
  const eventId = Number(params?.id);
  const speakerId = params?.speakerId as string;

  if (speakerId === 'new') {
    return <SpeakerDetailPage eventId={eventId} isNew />;
  }

  return <SpeakerDetailLoader eventId={eventId} speakerId={speakerId} />;
}
