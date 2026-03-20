'use client';

import dynamic from 'next/dynamic';

const TalentMatchRequestsPage = dynamic(
  () => import('@/features/matching/components/TalentMatchRequestsPage').then(m => ({ default: m.TalentMatchRequestsPage })),
  { ssr: false }
);

export default function TalentMatchRequestsRoute() {
  return <TalentMatchRequestsPage />;
}
