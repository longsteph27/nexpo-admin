'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, NavigationItem } from '@/directus/types';
import Link from 'next/link';
import { buildUrl, getCurrentLanguage } from '@/lib/utils/routing';
import { usePathname } from '@/lib/navigation';

interface TheFooterProps {
  navigation: Navigation | null;
  lang: string;
  pathname?: string;
}

// Helper function to generate URL for navigation items
function getNavigationUrl(item: NavigationItem, currentLang: string, currentPathname: string) {
  console.log('[getNavigationUrl] Called with:', { item, currentLang, currentPathname })
  
  let permalink = ''
  
  if (item.type === 'page' && typeof item.page !== 'string') {
    // Find translation for current language
    const translation = item.page?.translations?.find(t => 
      t.languages_code.startsWith(currentLang)
    )
    
    // Use current language translation if available, otherwise fallback to first translation
    permalink = translation?.permalink || item.page?.translations[0]?.permalink || ''
  } else {
    // For internal URLs, get the clean URL
    if (item.url?.startsWith('http')) {
      return item.url // External URL, return as is
    }
    
    permalink = item.url?.startsWith('/') ? item.url.slice(1) : item.url || ''
  }
  
  console.log('[getNavigationUrl] Permalink:', permalink)
  
  // Build URL using utility function with current pathname
  const result = buildUrl(currentLang, permalink, undefined, currentPathname)
  console.log('[getNavigationUrl] Result:', result)
  return result
}

function TheFooterContent({ navigation, lang, pathname = '/' }: TheFooterProps) {
  const currentLang = getCurrentLanguage(pathname);
  const [currentYear, setCurrentYear] = useState<string>('');
  
  // Set the year on the client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);
  
  if (!navigation || !Array.isArray(navigation.items)) return null;

  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto flex flex-col items-center">
        <nav className="mb-4">
          <ul className="flex flex-wrap justify-center gap-6">
            {navigation.items.map((item: NavigationItem) => {
              const title = item.translations[0]?.title || 'Untitled';
              return (
                <li key={item.id}>
                  <Link
                    href={getNavigationUrl(item, currentLang, pathname)}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="text-gray-400 text-sm">
          © {currentYear} Your Company. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Client component wrapper
export default function TheFooter({ navigation, lang, pathname }: TheFooterProps) {
  // If pathname is provided, use it; otherwise fall back to usePathname hook
  const clientPathname = usePathname();
  const finalPathname = pathname || clientPathname;
  
  return <TheFooterContent navigation={navigation} lang={lang} pathname={finalPathname} />;
}