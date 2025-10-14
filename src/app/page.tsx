'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth check to complete before redirecting
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/events');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // No loading screen here - let AppLayout handle it
  return null;
}