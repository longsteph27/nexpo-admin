'use client';

import { useParams } from 'next/navigation';
import SessionDetailPage from '@/features/sessions/components/SessionDetailPage';
import { useSession } from '@/features/sessions/hooks/useSessions';

function SessionDetailLoader({ eventId, sessionId }: { eventId: number; sessionId: string }) {
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <SessionDetailPage eventId={eventId} session={session} />;
}

export default function SessionDetailRoute() {
  const params = useParams();
  const eventId = Number(params?.id);
  const sessionId = params?.sessionId as string;

  if (sessionId === 'new') {
    return <SessionDetailPage eventId={eventId} isNew />;
  }

  return <SessionDetailLoader eventId={eventId} sessionId={sessionId} />;
}
