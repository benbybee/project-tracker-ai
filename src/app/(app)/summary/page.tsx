'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

export default function DailySummaryPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: replace with real KPI endpoint
    setStats({
      projectsAdded: 0,
      tasksAdded: 0,
      tasksCompleted: 0,
      dueCompleted: 0,
      dueMissed: 0,
      tomorrowEstimate: 0,
      expectedPctDone: 0,
    });
  }, []);

  async function generate() {
    // Stub: call AI summary endpoint if available
    setLoading(true);
    try {
      const res = await fetch('/api/ai/daily-summary', { method: 'POST' });
      const data = await res.json().catch(() => ({ summary: '' }));
      setSummary(data.summary ?? 'Summary generation not yet wired.');
    } catch {
      setSummary('Summary generation not yet wired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={FileText}
          title="Daily Summary"
          subtitle="AI-generated insights and progress overview"
        />
      
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {stats &&
          Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-gray-200 bg-white/80 p-3">
              <div className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-xl font-semibold text-gray-900">{String(v)}</div>
            </div>
          ))}
      </div>

      {/* Generate Button */}
      <div className="flex gap-2">
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate AI Summary'}
        </button>
      </div>

        {/* Summary Output */}
        {summary && (
          <div className="rounded-xl border border-gray-200 bg-white/80 p-4 whitespace-pre-wrap text-gray-700">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}
