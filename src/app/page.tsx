'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const dynamic = 'force-dynamic';

/**
 * Home page - PWA entry point.
 * This page must NOT redirect server-side for iOS PWA to work.
 * It checks auth client-side and redirects accordingly.
 */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for session to load, then redirect client-side
    if (status === 'loading') return;

    if (session?.user) {
      // User is authenticated, go to dashboard
      router.replace('/dashboard');
    } else {
      // User is not authenticated, go to sign-in
      router.replace('/sign-in');
    }
  }, [router, session, status]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">TaskTracker AI</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </main>
  );
}
