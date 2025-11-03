'use client';

import { useState, useEffect } from 'react';

interface UsePageBuilderNavigationProps {
  navigations?: any[];
}

export function usePageBuilderNavigation({ navigations }: UsePageBuilderNavigationProps) {
  const [headerItems, setHeaderItems] = useState<any[]>([]);
  const [footerItems, setFooterItems] = useState<any[]>([]);

  // Load navigation items
  useEffect(() => {
    if (navigations && Array.isArray(navigations)) {
      const headerNav = navigations.find((n: any) => n.type === 'header');
      const footerNav = navigations.find((n: any) => n.type === 'footer');
      
      if (headerNav?.items) setHeaderItems(headerNav.items);
      if (footerNav?.items) setFooterItems(footerNav.items);
    }
  }, [navigations]);

  return {
    headerItems,
    footerItems,
    setHeaderItems,
    setFooterItems,
  };
}


