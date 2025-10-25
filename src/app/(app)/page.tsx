'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <main>
      <h1>TaskTracker AI</h1>
      <p>Redirecting to dashboard…</p>
    </main>
  );
}
