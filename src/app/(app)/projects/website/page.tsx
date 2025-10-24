'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

type Project = {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  websiteStatus?: string | null;
  domain?: string | null;
  stagingUrl?: string | null;
};

type WebsiteStatus = 'discovery' | 'development' | 'client_review' | 'completed' | 'blocked';

const COLUMNS: { id: WebsiteStatus; label: string }[] = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'development', label: 'Development' },
  { id: 'client_review', label: 'Client Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'blocked', label: 'Blocked' },
];

function ProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    data: { project },
  });

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-gray-900 leading-snug">{project.name}</h4>
      </div>
      {project.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{project.description}</p>
      )}
      <div className="flex flex-col gap-1 text-xs text-gray-500">
        {project.domain && <span>🌐 {project.domain}</span>}
        {project.stagingUrl && <span>🔗 Staging</span>}
      </div>
      <Link
        href={`/projects/${project.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 block text-xs text-blue-600 hover:text-blue-800"
      >
        View details →
      </Link>
    </motion.div>
  );
}

function Column({ status, projects }: { status: WebsiteStatus; projects: Project[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const column = COLUMNS.find((c) => c.id === status);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl bg-white/80 backdrop-blur-sm p-4 border min-h-[500px] transition-all ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-800">
          {column?.label}
        </h3>
        <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default function WebsiteWorkflowBoard() {
  const { data: allProjects, isLoading } = trpc.projects.list.useQuery({});
  const utils = trpc.useUtils();
  
  const sensors = useSensors(useSensor(PointerSensor));

  const websiteProjects = useMemo(() => {
    return (allProjects || []).filter((p: Project) => p.type === 'website');
  }, [allProjects]);

  const projectsByStatus = useMemo(() => {
    const byStatus: Record<WebsiteStatus, Project[]> = {
      discovery: [],
      development: [],
      client_review: [],
      completed: [],
      blocked: [],
    };

    for (const project of websiteProjects) {
      const status = (project.websiteStatus || 'discovery') as WebsiteStatus;
      if (byStatus[status]) {
        byStatus[status].push(project);
      } else {
        byStatus.discovery.push(project);
      }
    }

    return byStatus;
  }, [websiteProjects]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const project = active.data.current?.project as Project | undefined;
    const newStatus = over.id as WebsiteStatus;

    if (!project || project.websiteStatus === newStatus) return;

    // Optimistic update
    utils.projects.list.setData({}, (old) => {
      if (!old) return old;
      return old.map((p) =>
        p.id === project.id ? { ...p, websiteStatus: newStatus } : p
      );
    });

    try {
      // If moving to completed, convert back to general project type
      if (newStatus === 'completed') {
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'general', websiteStatus: null }),
        });
      } else {
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteStatus: newStatus }),
        });
      }
      
      // Revalidate
      await utils.projects.list.invalidate();
    } catch (error) {
      console.error('Failed to update project status:', error);
      // Revert on error
      await utils.projects.list.invalidate();
    }
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Website Project Workflow</h1>
        <p className="text-sm text-gray-600 mt-1">
          Drag projects between stages. Projects marked as <b>Completed</b> automatically convert back to general projects.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading website projects...</p>
        </div>
      ) : websiteProjects.length > 0 ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                status={column.id}
                projects={projectsByStatus[column.id]}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="text-center py-12 rounded-xl border border-gray-200 bg-white/80">
          <p className="text-gray-600 mb-4">No website projects in the workflow.</p>
          <p className="text-sm text-gray-500 mb-4">
            Convert a project to "website" type to add it to this board.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            View All Projects
          </Link>
        </div>
      )}
    </div>
  );
}

