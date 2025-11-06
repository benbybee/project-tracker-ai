'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isStandalone } from '@/lib/pwa-utils';

export const dynamic = 'force-dynamic';

/**
 * Home page - PWA entry point.
 * This page must NOT redirect server-side for iOS PWA to work.
 * For iOS PWA, we delay redirects to ensure the page is recognized as standalone.
 */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const standalone = isStandalone();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // For iOS PWA standalone mode, add a small delay to ensure iOS recognizes it as a real page
    // This prevents iOS from treating it as a redirect and opening in browser mode
    const delay = standalone ? 100 : 0;

    const timer = setTimeout(() => {
      setShouldRedirect(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [status, standalone]);

  useEffect(() => {
    if (!shouldRedirect || status === 'loading') return;

    if (session?.user) {
      // User is authenticated, go to dashboard
      router.replace('/dashboard');
    } else {
      // User is not authenticated, go to sign-in
      router.replace('/sign-in');
    }
  }, [router, session, status, shouldRedirect]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            TaskTracker AI
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </main>
  );
}
