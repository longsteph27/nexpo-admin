'use client';
import dynamic from 'next/dynamic';

const JobMatchSuggestionsPage = dynamic(
  () => import('@/features/matching/components/JobMatchSuggestionsPage').then(m => ({ default: m.JobMatchSuggestionsPage })),
  { ssr: false }
);

export default function TalentAIRoute() {
  return <JobMatchSuggestionsPage />;
}
