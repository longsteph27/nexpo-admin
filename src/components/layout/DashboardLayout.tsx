'use client';

import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // This component is now just a simple wrapper since layout logic is handled by AppProvider
  // The header and sidebar are now managed at the root level in layout.tsx
  return <>{children}</>;
}
