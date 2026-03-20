'use client';

import dynamic from 'next/dynamic';

const MeetingSlotConfigPage = dynamic(
  () => import('@/features/matching/components/MeetingSlotConfigPage').then(m => ({ default: m.MeetingSlotConfigPage })),
  { ssr: false }
);

export default function TimeslotsRoute() {
  return <MeetingSlotConfigPage />;
}
