'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { Columns3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';


export default function BoardPage() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const router = useRouter();

  const { data: projects } = trpc.projects.list.useQuery({});

  return (
    <div className="px-2 py-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Columns3}
          title="Kanban Board"
          subtitle="Visualize and manage your tasks across different stages"
          actions={
            <Button 
              onClick={() => {
                if (projects && projects.length > 0) {
                  setCreateModalOpen(true);
                } else {
                  // Redirect to create project first
                  router.push('/projects/new');
                }
              }}
            >
              New Task
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
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
        <KanbanBoard 
          projectId={projectFilter === 'all' ? undefined : projectFilter}
          variant="default"
        />

        {/* Task Create Modal */}
        <TaskCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={projects?.[0]?.id}
        />
      </div>
    </div>
  );
}
