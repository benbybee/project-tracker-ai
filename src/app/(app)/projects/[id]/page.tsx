'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { ProjectHeaderCompact } from '@/components/projects/project-header-compact';
import { ProjectMetricsGrid } from '@/components/projects/project-metrics-grid';
import { ProjectQuickActions } from '@/components/projects/project-quick-actions';
import { UnifiedAiChatModal } from '@/components/ai/unified-ai-chat-modal';
import { QuickAddTask } from '@/components/projects/quick-add-task';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ProjectNotesSection } from '@/components/projects/ProjectNotesSection';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } =
    trpc.projects.get.useQuery({ id: projectId });
  const { data: tasks } = trpc.tasks.list.useQuery({
    projectId,
  });
  const { data: velocityData } = trpc.projects.getVelocity.useQuery({
    id: projectId,
  });
  const { data: healthData } = trpc.projects.getHealth.useQuery({
    id: projectId,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!tasks || !velocityData || !healthData) {
      return {
        progress: {
          completed: 0,
          total: 0,
          percentage: 0,
          trend: 'stable' as const,
        },
        velocity: {
          tasksPerWeek: 0,
          trend: 0,
          sparklineData: [],
        },
        health: {
          status: 'on-track' as const,
          blockers: 0,
          overdue: 0,
        },
      };
    }

    const completed = tasks.filter((t) => t.status === 'completed').length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      progress: {
        completed,
        total,
        percentage,
        trend: 'stable' as const, // Could calculate from history
      },
      velocity: {
        tasksPerWeek: velocityData.tasksPerWeek,
        trend: velocityData.trend,
        sparklineData: velocityData.sparklineData,
      },
      health: {
        status: healthData.status,
        blockers: healthData.blockers,
        overdue: healthData.overdue,
      },
    };
  }, [tasks, velocityData, healthData]);

  if (projectLoading) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The project you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Header */}
        <ProjectHeaderCompact project={project} />

        {/* Metrics Grid */}
        <ProjectMetricsGrid
          metrics={metrics}
          projectId={projectId}
          onAiChatOpen={() => setAiChatOpen(true)}
        />

        {/* Quick Actions */}
        <ProjectQuickActions
          projectId={projectId}
          projectType={project.type}
          wpOneClickEnabled={project.wpOneClickEnabled}
          onNewTask={() => setCreateModalOpen(true)}
          onAiChat={() => setAiChatOpen(true)}
        />

        {/* Kanban Board Section */}
        <section className="mt-8" data-board-section>
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Board</h2>
            <div className="hidden md:block text-sm text-slate-500">
              Drag tasks between columns.
            </div>
          </header>

          <KanbanBoard projectId={projectId} variant="default" />
        </section>

        {/* Quick Add Task */}
        <QuickAddTask projectId={projectId} />

        {/* Project Notes Section */}
        <ProjectNotesSection projectId={projectId} projectName={project.name} />

        {/* Task Create Modal */}
        <TaskCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={projectId}
        />

        {/* AI Chat Modal */}
        <UnifiedAiChatModal
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          context={{
            mode: 'project',
            projectId: projectId,
            projectName: project.name,
          }}
        />
      </div>
    </div>
  );
}
