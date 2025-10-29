'use client';

import { useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto mt-16">
      <GlassCard className="p-6 text-center">
        <h2 className="text-lg font-semibold">Something went sideways</h2>
        <p className="text-sm text-slate-500 mt-1">
          We've logged the issue. Try again?
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 rounded-full text-white"
          style={{ backgroundImage: 'var(--grad-primary)' }}
        >
          Reload section
        </button>
      </GlassCard>
    </div>
  );
}
