'use client';

import { useParams } from 'next/navigation';
import AgendaDetailPage from '@/features/agendas/components/AgendaDetailPage';
import { useAgendaEvent } from '@/features/agendas/hooks/useAgendas';

function AgendaDetailLoader({ eventId, agendaId }: { eventId: number; agendaId: string }) {
  const { data: agenda, isLoading } = useAgendaEvent(agendaId);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <AgendaDetailPage eventId={eventId} agenda={agenda} />;
}

export default function AgendaDetailRoute() {
  const params = useParams();
  const eventId = Number(params?.id);
  const agendaId = params?.agendaId as string;

  if (agendaId === 'new') {
    return <AgendaDetailPage eventId={eventId} isNew />;
  }

  return <AgendaDetailLoader eventId={eventId} agendaId={agendaId} />;
}
