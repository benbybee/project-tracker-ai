'use client';

import { useEffect, useState } from 'react';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

type ProposedTask = {
  id: string;
  title: string;
  description?: string;
};

export default function PlaudIngestPage() {
  const [items, setItems] = useState<ProposedTask[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real endpoint populated by webhook
    fetch('/api/plaud/pending')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);

  async function bulkAccept() {
    setLoading(true);
    try {
      await fetch('/api/plaud/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      // Refresh items
      const res = await fetch('/api/plaud/pending');
      const data = await res.json();
      setItems(data.items ?? []);
      setSelected({});
    } catch (error) {
      console.error('Failed to accept tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function bulkDecline() {
    setLoading(true);
    try {
      await fetch('/api/plaud/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      // Refresh items
      const res = await fetch('/api/plaud/pending');
      const data = await res.json();
      setItems(data.items ?? []);
      setSelected({});
    } catch (error) {
      console.error('Failed to decline tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Plaud AI Ingestion</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and accept tasks extracted from voice notes via Plaud AI webhook
        </p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-3 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
          <button
            onClick={bulkAccept}
            disabled={loading}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={bulkDecline}
            disabled={loading}
            className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      {/* Items List */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading pending items...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((it) => (
            <label
              key={it.id}
              className="grid grid-cols-[28px_1fr] gap-3 rounded-xl border border-gray-200 bg-white/80 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={!!selected[it.id]}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [it.id]: e.target.checked }))
                }
                className="mt-1 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">{it.title}</div>
                {it.description && (
                  <div className="text-sm text-gray-600 mt-1">{it.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No pending items.</p>
          <p className="text-sm text-gray-500">
            Tasks from Plaud AI voice notes will appear here when the webhook is configured.
          </p>
        </div>
      )}
    </div>
  );
}
