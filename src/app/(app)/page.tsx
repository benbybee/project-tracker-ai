'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  // If you want it to land on /dashboard:
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <main>
      <h1>TaskTracker AI</h1>
      <p>Redirecting…</p>
    </main>
  );
}
