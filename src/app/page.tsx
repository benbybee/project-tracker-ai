'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if launched from PWA (standalone mode or from home screen)
    const isPWA =
      searchParams.get('source') === 'pwa' ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true; // iOS Safari

    if (isPWA) {
      // For PWA launches, use replace to avoid browser history issues
      router.replace('/dashboard');
    } else {
      // For browser launches, redirect normally
      router.replace('/dashboard');
    }
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">TaskTracker AI</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </main>
  );
}
