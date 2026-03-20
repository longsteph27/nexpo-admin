'use client';
import dynamic from 'next/dynamic';

const BusinessMatchSuggestionsPage = dynamic(
  () => import('@/features/business-matching').then(m => ({ default: m.BusinessMatchSuggestionsPage })),
  { ssr: false }
);

export default function BusinessAIRoute() {
  return <BusinessMatchSuggestionsPage />;
}
