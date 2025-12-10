'use client';

import { Plus, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { WeekProgressCard } from '@/components/pattern4/week-progress-card';
import { useState } from 'react';
import { formatDateForSQL, generateSprintWeeks } from '@/lib/pattern4-utils';
import { parseISO } from 'date-fns';

export default function WeeksPage() {
  const [isCreating, setIsCreating] = useState(false);
  const utils = trpc.useContext();

  // Fetch active sprint
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch weeks
  const { data: weeks = [], isLoading } = trpc.pattern4.weeks.list.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  // Create week mutation
  const createWeek = trpc.pattern4.weeks.create.useMutation({
    onSuccess: () => {
      utils.pattern4.weeks.list.invalidate();
    },
  });

  const handleGenerateWeeks = async () => {
    if (!activeSprint) return;

    setIsCreating(true);
    try {
      const generatedWeeks = generateSprintWeeks(parseISO(activeSprint.startDate));

      for (const week of generatedWeeks) {
        await createWeek.mutateAsync({
          sprintId: activeSprint.id,
          weekIndex: week.weekIndex,
          startDate: formatDateForSQL(week.startDate),
          endDate: formatDateForSQL(week.endDate),
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!activeSprint) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            No Active Sprint
          </h1>
          <p className="text-muted-foreground">
            Create a sprint first to manage your weeks.
          </p>
          <a
            href="/pattern4/sprint-overview"
            className="inline-block mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go to Sprint Overview
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sprint Weeks
          </h1>
          <p className="text-muted-foreground">
            Manage your 13-week sprint execution plan
          </p>
        </div>
        {weeks.length === 0 && (
          <button
            onClick={handleGenerateWeeks}
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Plus className="h-5 w-5" />
            Generate 13 Weeks
          </button>
        )}
      </div>

      {/* Weeks Grid */}
      {weeks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeks.map((week) => (
            <WeekProgressCard
              key={week.id}
              week={week}
              progress={{
                totalTasks: 0,
                completedTasks: 0,
                completionPercentage: 0,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white/5 border border-white/10">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Weeks Created Yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Generate all 13 weeks for your sprint to start planning your execution.
          </p>
          <button
            onClick={handleGenerateWeeks}
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mx-auto"
          >
            {isCreating ? (
              <>Generating...</>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Generate 13 Weeks
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

