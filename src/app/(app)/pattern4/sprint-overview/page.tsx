'use client';

import { useState } from 'react';
import { Plus, Calendar, Target, TrendingUp, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SprintProgressBar } from '@/components/pattern4/sprint-progress-bar';
import { WeekProgressCard } from '@/components/pattern4/week-progress-card';
import { OpportunityCard } from '@/components/pattern4/opportunity-card';
import { SprintForm } from '@/components/pattern4/sprint-form';
import { format, parseISO } from 'date-fns';
import { getCurrentSprintWeek } from '@/lib/pattern4-utils';
import { TaskList } from '@/components/pattern4/task-list';
import { BurndownChart } from '@/components/pattern4/charts/burndown-chart';
import { OpportunityPieChart } from '@/components/pattern4/charts/opportunity-pie-chart';

export default function SprintOverviewPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const utils = trpc.useContext();

  // Fetch active sprint
  const { data: activeSprint, isLoading: sprintLoading } =
    trpc.pattern4.sprints.getActive.useQuery();

  // Fetch sprint weeks
  const { data: weeks = [] } = trpc.pattern4.weeks.list.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  // Fetch opportunities
  const { data: opportunities = [] } = trpc.pattern4.opportunities.list.useQuery(
    { sprintId: activeSprint?.id },
    { enabled: !!activeSprint }
  );

  // Get sprint progress
  const { data: sprintProgress } = trpc.pattern4.stats.sprintProgress.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  // Fetch chart data
  const { data: burndownData } = trpc.analyticsPattern4.getBurndownData.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  const { data: oppDistribution } = trpc.analyticsPattern4.getOpportunityDistribution.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  // Get current week
  const currentWeekNumber = activeSprint
    ? getCurrentSprintWeek(parseISO(activeSprint.startDate))
    : 1;
  const currentWeek = weeks.find((w) => w.weekIndex === currentWeekNumber);

  // Fetch current week tasks
  const { data: currentTasks = [] } = trpc.pattern4.tasks.listByWeek.useQuery(
    { weekId: currentWeek?.id! },
    { enabled: !!currentWeek }
  );

  // Create sprint mutation
  const createSprint = trpc.pattern4.sprints.create.useMutation({
    onSuccess: () => {
      utils.pattern4.sprints.getActive.invalidate();
      setShowCreateForm(false);
    },
  });

  // Task mutations
  const createTask = trpc.pattern4.tasks.createForPattern4.useMutation({
    onSuccess: () => {
      utils.pattern4.tasks.listByWeek.invalidate({ weekId: currentWeek?.id });
      utils.pattern4.stats.sprintProgress.invalidate({ sprintId: activeSprint?.id });
    },
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.pattern4.tasks.listByWeek.invalidate({ weekId: currentWeek?.id });
      utils.pattern4.stats.sprintProgress.invalidate({ sprintId: activeSprint?.id });
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.pattern4.tasks.listByWeek.invalidate({ weekId: currentWeek?.id });
      utils.pattern4.stats.sprintProgress.invalidate({ sprintId: activeSprint?.id });
    },
  });

  const handleCreateSprint = async (data: {
    name: string;
    startDate: string;
    endDate: string;
    goalSummary?: string;
  }) => {
    await createSprint.mutateAsync(data);
  };

  if (sprintLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  // No active sprint
  if (!activeSprint) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Target className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Start Your First Sprint
            </h1>
            <p className="text-muted-foreground">
              Create a 90-day sprint to organize your opportunities, weeks, and tasks.
            </p>
          </div>

          {showCreateForm ? (
            <SprintForm
              onSubmit={handleCreateSprint}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mx-auto flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Create Sprint
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {activeSprint.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(parseISO(activeSprint.startDate), 'MMM d, yyyy')} -{' '}
                {format(parseISO(activeSprint.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          {activeSprint.goalSummary && (
            <p className="mt-3 text-foreground/80">{activeSprint.goalSummary}</p>
          )}
        </div>
      </div>

      {/* Quick Stats & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Sprint Progress</p>
            <p className="text-3xl font-bold text-foreground mb-4">
              {sprintProgress?.completionPercentage || 0}%
            </p>
            {sprintProgress && (
              <SprintProgressBar
                completionPercentage={sprintProgress.completionPercentage}
                totalTasks={sprintProgress.totalTasks}
                completedTasks={sprintProgress.completedTasks}
                showStats={false}
              />
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Weeks</p>
              <p className="text-lg font-semibold">{weeks.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-lg font-semibold">{sprintProgress?.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <BurndownChart
            data={burndownData || []}
            title="Burndown"
            className="h-full border-none bg-transparent"
          />
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <OpportunityPieChart
            data={oppDistribution?.statusData || []}
            title="Opp. Status"
            className="h-full border-none bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Week */}
        {currentWeek ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center justify-between">
              Current Week
              <span className="text-sm font-normal text-muted-foreground">
                Week {currentWeek.weekIndex}
              </span>
            </h2>
            <WeekProgressCard
              week={currentWeek}
              progress={{
                totalTasks: currentTasks.length,
                completedTasks: currentTasks.filter(t => t.status === 'completed').length,
                completionPercentage: currentTasks.length > 0 
                  ? Math.round((currentTasks.filter(t => t.status === 'completed').length / currentTasks.length) * 100)
                  : 0,
              }}
            />
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                This Week's Tasks
              </h3>
              <TaskList
                tasks={currentTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  priorityScore: t.priorityScore,
                  budgetPlanned: t.budgetPlanned,
                  budgetSpent: t.budgetSpent,
                  sprintWeekId: t.sprintWeekId,
                  opportunityId: t.opportunityId,
                }))}
                onTaskCreate={async (data) => {
                  await createTask.mutateAsync({
                    ...data,
                    sprintWeekId: currentWeek.id,
                    sprintId: activeSprint.id,
                  });
                }}
                onTaskUpdate={async (id, data) => {
                  await updateTask.mutateAsync({ id, ...data });
                }}
                onTaskDelete={async (id) => {
                  await deleteTask.mutateAsync({ id });
                }}
                sprintWeekId={currentWeek.id}
                sprintId={activeSprint.id}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
            <p className="text-muted-foreground">No current week found within sprint dates.</p>
          </div>
        )}

        {/* Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Top Opportunities
            </h2>
            <a
              href="/pattern4/opportunities"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All →
            </a>
          </div>
          {opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.slice(0, 3).map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No opportunities yet. Create your first opportunity to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
