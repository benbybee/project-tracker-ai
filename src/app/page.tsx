'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Home page - redirects to dashboard.
 * Note: PWA launches go directly to /dashboard via manifest start_url,
 * so this page is only hit for direct browser visits to the root URL.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard for all browser visits to root
    // PWA launches bypass this page entirely (start_url is /dashboard)
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">TaskTracker AI</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </main>
  );
}
