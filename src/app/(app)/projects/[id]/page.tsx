'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useTaskModal } from '@/components/tasks/useTaskModal';
import { TaskCard } from '@/components/tasks/task-card';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectStats } from '@/components/projects/project-stats';
import { QuickAddTask } from '@/components/projects/quick-add-task';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId });
  const { data: roles } = trpc.roles.list.useQuery();
  
  // Add the byProjectId query at the top level
  const { data: projectTasks, isLoading: projectTasksLoading } = trpc.tasks.byProjectId.useQuery({ 
    projectId: projectId 
  });
  
  // Add the move mutation at the top level
  const moveTaskMutation = trpc.tasks.move.useMutation();
  
  const { isOpen, openModal, closeModal, defaultValues } = useTaskModal();
  
  if (projectLoading) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <p className="text-gray-600 mb-8">The project you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const projectRole = project.role;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <ProjectHeader project={project} role={projectRole} onNewTask={() => openModal(projectId)} />
        
        {/* Project Stats */}
        <ProjectStats 
          counts={{
            total: tasks?.length || 0,
            inProgress: tasks?.filter(task => task.status === 'in_progress').length || 0,
            completed: tasks?.filter(task => task.status === 'completed').length || 0,
          }}
        />

        {/* Kanban Board Section */}
        <section className="mt-8">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Board</h2>
            <div className="text-sm text-slate-500">Drag tasks between columns.</div>
          </header>

          <KanbanBoard 
            projectId={projectId}
            columns={["not_started", "in_progress", "blocked", "completed"]}
            fetchQuery={{
              data: projectTasks,
              isLoading: projectTasksLoading,
              error: null
            }}
            onMove={({ taskId, status }) =>
              moveTaskMutation.mutate({ 
                taskId, 
                projectId: project.id, 
                status: status as "not_started" | "in_progress" | "blocked" | "completed" | "next_steps"
              })
            }
          />
        </section>

        {/* Quick Add Task */}
        <QuickAddTask 
          projectId={projectId}
        />

        {/* Task Modal */}
        <TaskModal
          projectId={projectId}
          defaultValues={defaultValues}
          isOpen={isOpen}
          onClose={closeModal}
        />
      </div>
    </div>
  );
}
