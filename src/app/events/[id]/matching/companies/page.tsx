'use client';

import dynamic from 'next/dynamic';

const CompanyProfilesPage = dynamic(
  () => import('@/features/matching/components/CompanyProfilesPage'),
  { ssr: false }
);

export default function CompanyProfilesRoute() {
  return <CompanyProfilesPage />;
}
