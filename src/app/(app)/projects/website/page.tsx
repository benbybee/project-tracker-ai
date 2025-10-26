'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { MoreVertical, ExternalLink, ArrowDownCircle, FolderOpen, Copy, Globe } from 'lucide-react';
import WebsiteBoardMetrics from '@/components/projects/WebsiteBoardMetrics';
import { PageHeader } from '@/components/layout/page-header';

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
  createdAt?: Date;
  updatedAt?: Date;
};

type WebsiteStatus = 'discovery' | 'development' | 'client_review' | 'completed' | 'blocked';

const COLUMNS: { id: WebsiteStatus; label: string }[] = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'development', label: 'Development' },
  { id: 'client_review', label: 'Client Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'blocked', label: 'Blocked' },
];

function ProjectCard({ project, onConvertToGeneral }: { project: Project; onConvertToGeneral: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    data: { project },
  });

  const handleCopyStagingUrl = () => {
    if (project.stagingUrl) {
      navigator.clipboard.writeText(project.stagingUrl);
      setMenuOpen(false);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all relative group"
    >
      {/* Drag handle area */}
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-gray-900 leading-snug">{project.name}</h4>
        </div>
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{project.description}</p>
        )}
        <div className="flex flex-col gap-1 text-xs text-gray-500 mb-2">
          {project.domain && (
            <a 
              href={project.domain.startsWith('http') ? project.domain : `https://${project.domain}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              🌐 {project.domain} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {project.stagingUrl && (
            <a 
              href={project.stagingUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Staging <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Quick Actions Menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </button>

        {menuOpen && (
          <div className="absolute top-10 right-2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderOpen className="h-4 w-4 text-gray-600" />
              View Project Details
            </Link>
            {project.stagingUrl && (
              <button
                onClick={handleCopyStagingUrl}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Copy className="h-4 w-4 text-gray-600" />
                Copy Staging URL
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvertToGeneral(project.id);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-orange-600"
            >
              <ArrowDownCircle className="h-4 w-4" />
              Convert to General
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Column({ status, projects, totalProjects, onConvertToGeneral }: { status: WebsiteStatus; projects: Project[]; totalProjects: number; onConvertToGeneral: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const column = COLUMNS.find((c) => c.id === status);
  const percentage = totalProjects > 0 ? Math.round((projects.length / totalProjects) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl bg-white/80 backdrop-blur-sm p-4 border min-h-[500px] transition-all ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-800">
            {column?.label}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{percentage}% of total</p>
        </div>
        <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
          {projects.length}
        </span>
      </div>
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onConvertToGeneral={onConvertToGeneral} />
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

  async function handleConvertToGeneral(projectId: string) {
    // Optimistic update - remove from website projects
    utils.projects.list.setData({}, (old) => {
      if (!old) return old;
      return old.map((p) =>
        p.id === projectId ? { ...p, type: 'general', websiteStatus: null } : p
      );
    });

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general', websiteStatus: null }),
      });
      
      // Revalidate
      await utils.projects.list.invalidate();
    } catch (error) {
      console.error('Failed to convert project:', error);
      // Revert on error
      await utils.projects.list.invalidate();
    }
  }

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
    <div className="px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          icon={Globe}
          title="Website Project Workflow"
          subtitle="Drag projects between stages. Projects marked as Completed automatically convert back to general projects."
        />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading website projects...</p>
        </div>
      ) : websiteProjects.length > 0 ? (
        <>
          {/* Metrics */}
          <WebsiteBoardMetrics projects={allProjects || []} />

          {/* Board */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {COLUMNS.map((column) => (
                <Column
                  key={column.id}
                  status={column.id}
                  projects={projectsByStatus[column.id]}
                  totalProjects={websiteProjects.length}
                  onConvertToGeneral={handleConvertToGeneral}
                />
              ))}
            </div>
          </DndContext>
        </>
      ) : (
        <div className="text-center py-12 rounded-xl border border-gray-200 bg-white/80">
          <p className="text-lg font-medium text-gray-900 mb-2">No website projects in the workflow</p>
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
    </div>
  );
}

