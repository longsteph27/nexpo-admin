import { ReactNode } from 'react';

interface CollectionsLayoutProps {
  children: ReactNode;
}

export default function CollectionsLayout({ children }: CollectionsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

