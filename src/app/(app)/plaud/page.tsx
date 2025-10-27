'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { CheckCircle2, XCircle, Mic } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

type ProposedTask = {
  id: string;
  createdAt: string;
  title: string;
  description?: string | null;
  confidence?: number | null;
  sourceId?: string | null;
  suggestedProjectName?: string | null;
};

type TaskAssignment = {
  projectId?: string;
  projectNameNew?: string;
};

export default function PlaudIngestPage() {
  const [items, setItems] = useState<ProposedTask[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<
    Record<string, TaskAssignment>
  >({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: projects } = trpc.projects.list.useQuery({});

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/plaud/pending');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error('Failed to fetch pending items:', err);
      setError('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  }

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);

  async function bulkAccept() {
    if (selectedIds.length === 0) return;

    // Validate that all selected items have either a projectId or projectNameNew
    const tasksToAccept = selectedIds
      .map((id) => {
        const item = items.find((i) => i.id === id);
        const assignment = assignments[id] || {};

        if (!assignment.projectId && !assignment.projectNameNew) {
          // Use suggested project name if available
          if (item?.suggestedProjectName) {
            assignment.projectNameNew = item.suggestedProjectName;
          } else {
            setError(
              'Please assign all selected tasks to a project or create a new project'
            );
            return null;
          }
        }

        return {
          id,
          title: item?.title || 'Untitled',
          description: item?.description || '',
          projectId: assignment.projectId,
          projectNameNew: assignment.projectNameNew,
        };
      })
      .filter(Boolean);

    if (tasksToAccept.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // Optimistically remove from UI
      setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelected({});
      setAssignments({});

      const res = await fetch('/api/plaud/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasksToAccept }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to accept tasks');
      }

      // Refresh to get latest state
      await fetchItems();
    } catch (err: any) {
      console.error('Failed to accept tasks:', err);
      setError(err.message || 'Failed to accept tasks');
      // Revert optimistic update by refetching
      await fetchItems();
    } finally {
      setProcessing(false);
    }
  }

  async function bulkDecline() {
    if (selectedIds.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // Optimistically remove from UI
      setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelected({});
      setAssignments({});

      const res = await fetch('/api/plaud/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to decline tasks');
      }

      // Refresh to get latest state
      await fetchItems();
    } catch (err: any) {
      console.error('Failed to decline tasks:', err);
      setError(err.message || 'Failed to decline tasks');
      // Revert optimistic update by refetching
      await fetchItems();
    } finally {
      setProcessing(false);
    }
  }

  function handleAssignmentChange(itemId: string, value: string) {
    if (value === '__new__') {
      // Prompt for new project name
      setAssignments((prev) => ({
        ...prev,
        [itemId]: {
          projectNameNew:
            items.find((i) => i.id === itemId)?.suggestedProjectName || '',
        },
      }));
    } else {
      setAssignments((prev) => ({
        ...prev,
        [itemId]: { projectId: value },
      }));
    }
  }

  return (
    <div className="px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          icon={Mic}
          title="Plaud AI Ingestion"
          subtitle="Review and accept tasks extracted from voice notes via Plaud AI webhook"
        />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-3 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.length} selected
            </span>
            <button
              onClick={bulkAccept}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </button>
            <button
              onClick={bulkDecline}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
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
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected[item.id]}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        [item.id]: e.target.checked,
                      }))
                    }
                    className="mt-1 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        {item.confidence && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {item.confidence}% confidence
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Project Assignment */}
                    {selected[item.id] && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <label className="text-xs text-gray-600">
                          Assign to:
                        </label>
                        <select
                          value={
                            assignments[item.id]?.projectId ||
                            (assignments[item.id]?.projectNameNew
                              ? '__new__'
                              : '')
                          }
                          onChange={(e) =>
                            handleAssignmentChange(item.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select project...</option>
                          {projects?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                          <option value="__new__">➕ Create new project</option>
                        </select>

                        {assignments[item.id]?.projectNameNew !== undefined && (
                          <input
                            type="text"
                            placeholder="New project name"
                            value={assignments[item.id]?.projectNameNew || ''}
                            onChange={(e) =>
                              setAssignments((prev) => ({
                                ...prev,
                                [item.id]: { projectNameNew: e.target.value },
                              }))
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-gray-200 bg-white/80">
            <p className="text-lg font-medium text-gray-900 mb-2">
              No pending items
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Tasks from Plaud AI voice notes will appear here when the webhook
              is configured
            </p>
            <p className="text-xs text-gray-400">
              Webhook endpoint:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                /api/plaud/webhook
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
