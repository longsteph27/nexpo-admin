'use client';

import dynamic from 'next/dynamic';

const MatchingPage = dynamic(
  () => import('@/features/matching/components/MatchingPage').then(m => ({ default: m.MatchingPage })),
  { ssr: false }
);

export default function MatchingRoute() {
  return <MatchingPage />;
}
