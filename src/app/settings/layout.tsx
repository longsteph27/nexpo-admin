'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/settings/industries', label: 'Industries', icon: 'lucide:layers' },
  { href: '/settings/facilities', label: 'Facility Catalog', icon: 'lucide:package' },
  { href: '/settings/countries', label: 'Countries', icon: 'lucide:globe' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0">
      {/* Settings sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col py-6 px-3 gap-1">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</p>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-content-secondary hover:bg-slate-50 hover:text-content-primary'
              )}
            >
              <Icon icon={item.icon} className={cn('w-4 h-4', active ? 'text-blue-600' : 'text-content-tertiary')} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-background-secondary">
        {children}
      </div>
    </div>
  );
}
