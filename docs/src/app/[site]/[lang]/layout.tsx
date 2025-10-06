import React from 'react';
import '@/app/globals.css'; // Đảm bảo Tailwind được import
import { getTranslations } from '@/i18n/i18n'

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  const { lang } = resolvedParams;
  
  // Initialize i18n instance
  await getTranslations({ locale: lang })

  return <>{children}</>;
} 