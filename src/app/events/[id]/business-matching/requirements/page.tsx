'use client';
import dynamic from 'next/dynamic';

const BusinessRequirementsPage = dynamic(
  () => import('@/features/business-matching').then(m => ({ default: m.BusinessRequirementsPage })),
  { ssr: false }
);

export default function BusinessRequirementsRoute() {
  return <BusinessRequirementsPage />;
}
