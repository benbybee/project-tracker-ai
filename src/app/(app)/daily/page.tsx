"use client";

import { useState, useMemo, useEffect } from 'react';
import DailyTaskRow from '@/components/daily/DailyTaskRow';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { useTasksStore } from '@/lib/tasks-store';
import { getDB } from '@/lib/db.client';
import type { Task } from '@/types/task';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';


export default function DailyPlannerPage() {
  const { byId, bulkUpsert } = useTasksStore();
  const tasks = Object.values(byId);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Task | null>(null);

  // Load tasks from Dexie on mount
  useEffect(() => {
    (async () => {
      const db = await getDB();
      const allTasks = await db.tasks.toArray();
      bulkUpsert(allTasks);
    })();
  }, [bulkUpsert]);

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime() + 86400000);

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= start &&
          new Date(t.dueDate) < end &&
          t.status !== 'completed'
      ),
    [tasks, start, end]
  );

  const next3 = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) >= end &&
          new Date(t.dueDate) < new Date(end.getTime() + 3 * 86400000) &&
          t.status !== 'completed'
      ),
    [tasks, end]
  );

  function onSelect(id: string, val: boolean) {
    setSelected((prev) => ({ ...prev, [id]: val }));
  }

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Daily Planner</h1>
        <div className="flex gap-2">
          <button
            disabled={!selectedIds.length}
            className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            title="Select tasks below to enable bulk actions"
          >
            Bulk actions ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Bulk bar shows only when selected */}
      {selectedIds.length > 0 && (
        <BulkBar ids={selectedIds} clear={() => setSelected({})} />
      )}

      <Section title={`Today (${todayTasks.length})`}>
        <div className="space-y-2">
          {todayTasks.length > 0 ? (
            todayTasks.map((t) => (
              <DailyTaskRow
                key={t.id}
                task={t}
                selected={!!selected[t.id]}
                onSelect={onSelect}
                onOpen={setEditing}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 py-4">No tasks due today</p>
          )}
        </div>
      </Section>

      <Section title={`Next 3 Days (${next3.length})`}>
        <div className="space-y-2">
          {next3.length > 0 ? (
            next3.map((t) => (
              <DailyTaskRow
                key={t.id}
                task={t}
                selected={!!selected[t.id]}
                onSelect={onSelect}
                onOpen={setEditing}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 py-4">No tasks in next 3 days</p>
          )}
        </div>
      </Section>

      {editing && (
        <TaskEditModal task={editing} open={!!editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function BulkBar({ ids, clear }: { ids: string[]; clear: () => void }) {
  async function post(path: string, body: any) {
    try {
      await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Refresh after bulk action
      window.location.reload();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-3 flex items-center gap-2 flex-wrap shadow-sm">
      <span className="text-sm font-medium text-gray-700">{ids.length} selected</span>
      <button
        onClick={() => post('/api/tasks/bulk/defer', { ids, days: 1 })}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
      >
        Defer +1d
      </button>
      <button
        onClick={() => post('/api/tasks/bulk/defer', { ids, days: 2 })}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
      >
        Defer +2d
      </button>
      <button
        onClick={() => post('/api/tasks/bulk/defer', { ids, days: 7 })}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
      >
        Defer +1w
      </button>
      <button
        onClick={() => post('/api/tasks/bulk/complete', { ids })}
        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
      >
        Mark Complete
      </button>
      <button
        onClick={clear}
        className="ml-auto rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
