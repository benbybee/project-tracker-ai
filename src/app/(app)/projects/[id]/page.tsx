'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectStats } from '@/components/projects/project-stats';
import { QuickAddTask } from '@/components/projects/quick-add-task';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useRealtime } from '@/app/providers';
import { RealtimeTest } from '@/components/sync/RealtimeTest';
import { ProjectNotesSection } from '@/components/projects/ProjectNotesSection';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } =
    trpc.projects.get.useQuery({ id: projectId });
  const { data: tasks } = trpc.tasks.list.useQuery({
    projectId,
  });
  const { isConnected, onlineUsers } = useRealtime();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (projectLoading) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-[1600px] px-2 py-8">
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
      <div className="w-full">
        <div className="mx-auto w-full max-w-[1600px] px-2 py-8">
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

  const projectRole = project.role;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-2 py-6">
        {/* Project Header */}
        <ProjectHeader
          project={project}
          role={projectRole}
          onNewTask={() => setCreateModalOpen(true)}
        />

        {/* Real-time Status Indicator */}
        {isConnected && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">
                Real-time collaboration active ({onlineUsers.length} users
                online)
              </span>
            </div>
          </div>
        )}

        {/* Project Stats */}
        <ProjectStats
          counts={{
            total: tasks?.length || 0,
            inProgress:
              tasks?.filter((task) => task.status === 'in_progress').length ||
              0,
            completed:
              tasks?.filter((task) => task.status === 'completed').length || 0,
          }}
        />

        {/* Kanban Board Section */}
        <section className="mt-8">
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

        {/* Real-time Test Panel (only in development) */}
        {process.env.NODE_ENV === 'development' && <RealtimeTest />}
      </div>
    </div>
  );
}
