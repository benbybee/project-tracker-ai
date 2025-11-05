'use client';

import { useState, useMemo, useEffect } from 'react';
import DailyTaskRow from '@/components/daily/DailyTaskRow';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import type { Task } from '@/types/task';
import { Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DailyPlanSuggestions } from '@/components/ai/DailyPlanSuggestions';
import { SuggestionCard } from '@/components/ai/SuggestionCard';
import { PlanActionBar } from '@/components/ai/PlanActionBar';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
import { trpc } from '@/lib/trpc';
import { parseDateAsLocal } from '@/lib/date-utils';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';

// Helper function to sort tasks by priority (highest first)
function sortByPriority(taskList: Task[]): Task[] {
  return [...taskList].sort((a, b) => {
    const priorityA = a.priorityScore ? Number(a.priorityScore) : 2;
    const priorityB = b.priorityScore ? Number(b.priorityScore) : 2;
    return priorityB - priorityA; // Descending: 4, 3, 2, 1
  });
}

// Helper function to calculate days a task has been in current status
function getDaysInStatus(task: Task): number {
  if (!task.updatedAt) return 0;
  const updatedDate = new Date(task.updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - updatedDate.getTime()) / 86400000);
}

export default function DailyPlannerPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Task | null>(null);
  const [showAiSuggestions] = useState(true);
  const [triggerGenerate, setTriggerGenerate] = useState(false);

  // Fetch all tasks from tRPC (React Query handles caching)
  const { data: tasks = [] } = trpc.tasks.list.useQuery({});

  const { suggestions, fetchSuggestions, acceptSuggestion, rejectSuggestion } =
    useAiSuggestions();

  // Fetch AI suggestions when component mounts
  useEffect(() => {
    if (showAiSuggestions) {
      fetchSuggestions({ currentView: 'daily' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiSuggestions]);

  const { start, end } = useMemo(() => {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const end = new Date(start.getTime() + 86400000);
    return { start, end };
  }, []);

  // Urgent: Tasks blocked or in QA/Launch for 2+ days
  const urgentFollowupTasks = useMemo(() => {
    const urgent = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const isStuckStatus = ['blocked', 'qa', 'launch'].includes(t.status);
      if (!isStuckStatus) return false;
      const daysInStatus = getDaysInStatus(t);
      return daysInStatus >= 2;
    });
    return sortByPriority(urgent);
  }, [tasks]);

  // Past due tasks
  const pastDueTasks = useMemo(() => {
    const pastDue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const taskDate = parseDateAsLocal(t.dueDate);
      return taskDate && taskDate < start;
    });
    return sortByPriority(pastDue);
  }, [tasks, start]);

  const todayTasks = useMemo(() => {
    const today = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const taskDate = parseDateAsLocal(t.dueDate);
      return taskDate && taskDate >= start && taskDate < end;
    });
    return sortByPriority(today);
  }, [tasks, start, end]);

  // Stagnant tasks - no updates in 7+ days
  const stagnantTasks = useMemo(() => {
    const stagnant = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const incompleteStatuses = [
        'not_started',
        'in_progress',
        'blocked',
        'content',
        'design',
        'dev',
        'qa',
        'launch',
      ];
      if (!incompleteStatuses.includes(t.status)) return false;
      const daysStale = getDaysInStatus(t);
      return daysStale >= 7;
    });
    return sortByPriority(stagnant);
  }, [tasks]);

  const next3 = useMemo(() => {
    const upcoming = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const taskDate = parseDateAsLocal(t.dueDate);
      const threeDaysLater = new Date(end.getTime() + 3 * 86400000);
      return taskDate && taskDate >= end && taskDate < threeDaysLater;
    });
    return sortByPriority(upcoming);
  }, [tasks, end]);

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

  const handleAcceptPlan = async () => {
    // Refresh page to see changes
    window.location.reload();
  };

  const handleUpdatePatterns = async () => {
    try {
      const response = await fetch('/api/ai/patterns/update', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Patterns updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update patterns:', error);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Calendar}
          title="Daily Planner"
          subtitle="Track overdue, blocked, and upcoming tasks with priority-based planning"
          actions={
            <button
              disabled={!selectedIds.length}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors whitespace-nowrap"
              title="Select tasks below to enable bulk actions"
            >
              Bulk actions ({selectedIds.length})
            </button>
          }
        />

        {/* AI Planning Section */}
        {showAiSuggestions && (
          <div className="space-y-4">
            <PlanActionBar
              onGeneratePlan={() => setTriggerGenerate(!triggerGenerate)}
              onUpdatePatterns={handleUpdatePatterns}
              isLoading={false}
            />

            <DailyPlanSuggestions
              onAcceptPlan={handleAcceptPlan}
              triggerGenerate={triggerGenerate}
              onGenerateComplete={() => setTriggerGenerate(false)}
            />

            {/* Context-aware Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  AI Suggestions
                </h3>
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={acceptSuggestion}
                    onReject={rejectSuggestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk bar shows only when selected */}
        {selectedIds.length > 0 && (
          <BulkBar ids={selectedIds} clear={() => setSelected({})} />
        )}

        {/* Urgent Follow-up Section */}
        {urgentFollowupTasks.length > 0 && (
          <Section
            title={`🚨 Urgent: Needs Follow-up (${urgentFollowupTasks.length})`}
            variant="urgent"
          >
            <div className="space-y-2">
              {urgentFollowupTasks.map((t) => (
                <DailyTaskRow
                  key={t.id}
                  task={t}
                  selected={!!selected[t.id]}
                  onSelect={onSelect}
                  onOpen={setEditing}
                  showFollowUpAction={true}
                  daysInStatus={getDaysInStatus(t)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Past Due Section */}
        {pastDueTasks.length > 0 && (
          <Section title={`Past Due (${pastDueTasks.length})`} variant="danger">
            <div className="space-y-2">
              {pastDueTasks.map((t) => (
                <DailyTaskRow
                  key={t.id}
                  task={t}
                  selected={!!selected[t.id]}
                  onSelect={onSelect}
                  onOpen={setEditing}
                />
              ))}
            </div>
          </Section>
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

        {/* Stagnant Tasks Section */}
        {stagnantTasks.length > 0 && (
          <Section
            title={`Stagnant Tasks (${stagnantTasks.length})`}
            variant="warning"
          >
            <p className="text-sm text-gray-600 mb-3">
              Tasks with no updates in 7+ days
            </p>
            <div className="space-y-2">
              {stagnantTasks.map((t) => (
                <DailyTaskRow
                  key={t.id}
                  task={t}
                  selected={!!selected[t.id]}
                  onSelect={onSelect}
                  onOpen={setEditing}
                  daysInStatus={getDaysInStatus(t)}
                />
              ))}
            </div>
          </Section>
        )}

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
              <p className="text-sm text-gray-500 py-4">
                No tasks in next 3 days
              </p>
            )}
          </div>
        </Section>

        {editing && (
          <TaskEditModal
            task={editing}
            open={!!editing}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  variant = 'default',
}: {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'urgent' | 'danger' | 'warning';
}) {
  const variantStyles = {
    default: 'text-gray-800',
    urgent: 'text-red-700 bg-red-50 -mx-2 px-2 py-2 rounded-lg',
    danger: 'text-red-600',
    warning: 'text-amber-700',
  };

  return (
    <section>
      <h2 className={`mb-3 font-semibold ${variantStyles[variant]}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BulkBar({ ids, clear }: { ids: string[]; clear: () => void }) {
  async function post(path: string, body: Record<string, unknown>) {
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
    <div className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {ids.length} selected
        </span>
        <button
          onClick={clear}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => post('/api/tasks/bulk/defer', { ids, days: 1 })}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Defer +1d
        </button>
        <button
          onClick={() => post('/api/tasks/bulk/defer', { ids, days: 2 })}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Defer +2d
        </button>
        <button
          onClick={() => post('/api/tasks/bulk/defer', { ids, days: 7 })}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Defer +1w
        </button>
        <button
          onClick={() => post('/api/tasks/bulk/complete', { ids })}
          className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
