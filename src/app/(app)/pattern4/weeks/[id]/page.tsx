'use client';

import { use } from 'react';
import { Calendar, ArrowLeft, Edit2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

export default function WeekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');
  const utils = trpc.useContext();

  // Fetch week details
  const { data: weekData, isLoading } = trpc.pattern4.weeks.getById.useQuery({
    id: resolvedParams.id,
  });

  // Fetch week progress
  const { data: progress } = trpc.pattern4.stats.weekProgress.useQuery({
    weekId: resolvedParams.id,
  });

  // Update week mutation
  const updateWeek = trpc.pattern4.weeks.update.useMutation({
    onSuccess: () => {
      utils.pattern4.weeks.getById.invalidate({ id: resolvedParams.id });
      setIsEditingTheme(false);
    },
  });

  const handleUpdateTheme = async () => {
    await updateWeek.mutateAsync({
      id: resolvedParams.id,
      theme: theme || undefined,
      notes: notes || undefined,
    });
  };

  if (isLoading || !weekData) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const { week, sprint } = weekData;

  return (
    <div className="p-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/pattern4/weeks"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Weeks
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-indigo-400" />
          <h1 className="text-3xl font-bold text-foreground">
            Week {week.weekIndex}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {format(parseISO(week.startDate), 'MMMM d')} -{' '}
          {format(parseISO(week.endDate), 'MMMM d, yyyy')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Sprint: {sprint.name}
        </p>
      </div>

      {/* Progress */}
      {progress && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Week Progress</span>
            <span className="text-sm font-semibold text-foreground">
              {progress.completedTasks} / {progress.totalTasks} tasks (
              {progress.completionPercentage}%)
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Theme & Notes */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Week Theme & Notes
          </h2>
          {!isEditingTheme && (
            <button
              onClick={() => {
                setTheme(week.theme || '');
                setNotes(week.notes || '');
                setIsEditingTheme(true);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {isEditingTheme ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Theme
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Focus on marketing, Launch prep, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add notes about this week..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdateTheme}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingTheme(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {week.theme ? (
              <p className="text-foreground mb-3">{week.theme}</p>
            ) : (
              <p className="text-muted-foreground italic mb-3">No theme set</p>
            )}
            {week.notes && (
              <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                {week.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Tasks</h2>
        <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
          <p className="text-muted-foreground">
            Task management integration coming soon. Use the existing task system
            and link tasks to this week via sprint week assignment.
          </p>
        </div>
      </div>
    </div>
  );
}

