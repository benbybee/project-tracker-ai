'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import Board from '@/components/kanban/Board';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useTaskModal } from '@/components/tasks/useTaskModal';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';


export default function BoardPage() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const router = useRouter();
  
  const taskModal = useTaskModal();

  const { data: projects } = trpc.projects.list.useQuery({});
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    projectId: projectFilter === 'all' ? undefined : projectFilter,
  });

  // Group tasks by status for the Kanban board
  const tasksByStatus = {
    'not_started': tasks?.filter(task => task.status === 'not_started') || [],
    'in_progress': tasks?.filter(task => task.status === 'in_progress') || [],
    'next_steps': tasks?.filter(task => task.status === 'next_steps') || [],
    'blocked': tasks?.filter(task => task.status === 'blocked') || [],
    'completed': tasks?.filter(task => task.status === 'completed') || [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
        <Button 
          onClick={() => {
            if (projects && projects.length > 0) {
              taskModal.openModal(projects[0].id, {});
            } else {
              // Redirect to create project first
              router.push('/projects/new');
            }
          }}
        >
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : (
        <Board 
          initial={tasksByStatus} 
          onEditTask={taskModal.editTask}
        />
      )}

      {/* Task Modal */}
      <TaskModal
        projectId={taskModal.projectId || ''}
        defaultValues={taskModal.defaultValues}
        onClose={taskModal.closeModal}
        isOpen={taskModal.isOpen}
      />
    </div>
  );
}
